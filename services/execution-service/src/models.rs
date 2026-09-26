//! Data models for execution jobs and results.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Status of an execution job.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "execution_status", rename_all = "snake_case")]
pub enum ExecutionStatus {
    Queued,
    Starting,
    Running,
    Completed,
    Failed,
    Timeout,
    Cancelled,
}

/// Job pushed to the Redis queue by the API gateway.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionJob {
    pub id: String,
    pub user_id: String,
    pub language: String,
    pub source_code: String,
    pub stdin: Option<String>,
    pub timeout_secs: u64,
    pub memory_limit_mb: u64,
}

/// Result of a completed execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub id: String,
    pub status: ExecutionStatus,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub wall_time_ms: u64,
    pub memory_bytes: Option<u64>,
    pub error_message: Option<String>,
}
