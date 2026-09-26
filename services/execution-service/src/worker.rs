//! Background worker — consumes Redis queue and executes jobs.

use std::sync::Arc;
use tracing::{error, info, warn};

use crate::{
    executor,
    models::{ExecutionJob, ExecutionStatus},
    AppState,
};

/// Main worker loop. Blocks on Redis BLPOP waiting for jobs.
pub async fn run_worker(state: Arc<AppState>) {
    info!("Execution worker waiting for jobs on polycore:executions:queue");

    // Semaphore to limit concurrent executions
    let semaphore = Arc::new(tokio::sync::Semaphore::new(state.config.max_concurrent_executions));

    loop {
        let mut conn = state.redis.clone();

        // BLPOP blocks for up to 5 seconds waiting for a job
        let result: Option<(String, String)> = match redis::cmd("BLPOP")
            .arg("polycore:executions:queue")
            .arg(5u64)
            .query_async(&mut conn)
            .await
        {
            Ok(r) => r,
            Err(e) => {
                error!("Redis BLPOP error: {}", e);
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                continue;
            }
        };

        let (_, job_json) = match result {
            Some(r) => r,
            None => continue, // Timeout, no job — loop again
        };

        let job: ExecutionJob = match serde_json::from_str(&job_json) {
            Ok(j) => j,
            Err(e) => {
                error!("Failed to deserialize job: {} — {}", e, job_json);
                continue;
            }
        };

        info!("Processing execution job {} (language: {})", job.id, job.language);

        // Acquire semaphore slot
        let permit = match semaphore.clone().acquire_owned().await {
            Ok(p) => p,
            Err(e) => {
                error!("Semaphore acquire failed: {}", e);
                continue;
            }
        };

        let state_clone = state.clone();
        tokio::spawn(async move {
            let _permit = permit; // Released when this task completes
            process_job(state_clone, job).await;
        });
    }
}

/// Processes a single execution job end-to-end.
async fn process_job(state: Arc<AppState>, job: ExecutionJob) {
    // Update status to 'starting'
    if let Err(e) = update_execution_status(&state, &job.id, "starting").await {
        error!("Failed to update status to starting for {}: {}", job.id, e);
    }

    // Execute in Docker container
    let result = executor::execute(&state.docker, &job, state.config.max_output_kb).await;

    match result {
        Ok(exec_result) => {
            info!(
                "Job {} completed: status={:?}, exit_code={:?}, wall_time={}ms",
                job.id, exec_result.status, exec_result.exit_code, exec_result.wall_time_ms
            );

            // Write result to PostgreSQL
            if let Err(e) = save_execution_result(&state, &exec_result).await {
                error!("Failed to save result for job {}: {}", job.id, e);
            }

            // Publish completion event to Redis pub/sub
            let event = serde_json::json!({
                "type": "execution:update",
                "executionId": exec_result.id,
                "status": format!("{:?}", exec_result.status).to_lowercase(),
                "exitCode": exec_result.exit_code,
                "stdout": exec_result.stdout,
                "stderr": exec_result.stderr,
                "wallTimeMs": exec_result.wall_time_ms,
            });

            let mut conn = state.redis.clone();
            let channel = format!("polycore:executions:results:{}", exec_result.id);
            let _ = redis::cmd("PUBLISH")
                .arg(&channel)
                .arg(event.to_string())
                .query_async::<()>(&mut conn)
                .await;

            // Also publish to global channel for dashboard
            let _ = redis::cmd("PUBLISH")
                .arg("polycore:events:executions")
                .arg(event.to_string())
                .query_async::<()>(&mut conn)
                .await;
        }
        Err(e) => {
            error!("Executor error for job {}: {}", job.id, e);
            let _ = update_execution_status(&state, &job.id, "failed").await;
        }
    }
}

async fn update_execution_status(state: &Arc<AppState>, execution_id: &str, status: &str) -> anyhow::Result<()> {
    let started_at_clause = if status == "running" || status == "starting" {
        ", started_at = NOW()"
    } else {
        ""
    };

    sqlx::query(&format!(
        "UPDATE executions SET status = $1::execution_status{} WHERE id::text = $2",
        started_at_clause
    ))
    .bind(status)
    .bind(execution_id)
    .execute(&state.db)
    .await?;

    Ok(())
}

async fn save_execution_result(state: &Arc<AppState>, result: &crate::models::ExecutionResult) -> anyhow::Result<()> {
    let status_str = format!("{:?}", result.status).to_lowercase();

    sqlx::query(
        "UPDATE executions SET
            status = $1::execution_status,
            exit_code = $2,
            stdout = $3,
            stderr = $4,
            error_message = $5,
            completed_at = NOW()
         WHERE id::text = $6"
    )
    .bind(&status_str)
    .bind(result.exit_code)
    .bind(&result.stdout)
    .bind(&result.stderr)
    .bind(&result.error_message)
    .bind(&result.id)
    .execute(&state.db)
    .await?;

    // Save metrics
    sqlx::query(
        "INSERT INTO execution_metrics (execution_id, wall_time_ms, memory_bytes)
         VALUES ($1::uuid, $2, $3)"
    )
    .bind(&result.id)
    .bind(result.wall_time_ms as i64)
    .bind(result.memory_bytes.map(|m| m as i64))
    .execute(&state.db)
    .await?;

    Ok(())
}
