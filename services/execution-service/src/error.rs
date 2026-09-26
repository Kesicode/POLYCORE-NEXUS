//! Error types for the execution service.

use thiserror::Error;

#[derive(Error, Debug)]
pub enum ExecutionError {
    #[error("Unsupported language: {0}")]
    UnsupportedLanguage(String),

    #[error("Container creation failed: {0}")]
    ContainerCreationFailed(String),

    #[error("Execution timed out after {0} seconds")]
    Timeout(u64),

    #[error("Output size exceeded limit")]
    OutputTooLarge,

    #[error("Docker error: {0}")]
    Docker(#[from] bollard::errors::Error),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
}
