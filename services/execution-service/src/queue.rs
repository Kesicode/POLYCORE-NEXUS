use redis::AsyncCommands;
use tracing::{error, info};

use crate::config::Config;
use crate::models::ExecutionJob;

pub const EXECUTION_QUEUE_KEY: &str = "polycore:executions:queue";

/// Pop the next job from the execution queue (blocking, 5s timeout).
/// Returns None on timeout or error.
pub async fn pop_job(
    conn: &mut redis::aio::ConnectionManager,
    _config: &Config,
) -> Option<ExecutionJob> {
    let result: Option<(String, String)> = conn
        .blpop(EXECUTION_QUEUE_KEY, 5.0)
        .await
        .unwrap_or(None);

    let (_, payload) = result?;

    match serde_json::from_str::<ExecutionJob>(&payload) {
        Ok(job) => {
            info!(job_id = %job.id, language = %job.language, "Dequeued job");
            Some(job)
        }
        Err(e) => {
            error!(error = %e, payload = %payload, "Failed to deserialize job");
            None
        }
    }
}

/// Publish a result event to Redis Pub/Sub.
pub async fn publish_result(
    conn: &mut redis::aio::ConnectionManager,
    job_id: &str,
    result_json: &str,
) {
    let channel = format!("polycore:executions:results:{}", job_id);
    if let Err(e) = conn.publish::<_, _, ()>(&channel, result_json).await {
        error!(error = %e, job_id = %job_id, "Failed to publish result");
    }
}
