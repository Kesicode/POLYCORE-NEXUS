//! Configuration loaded from environment variables.

use anyhow::{bail, Result};

#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub redis_url: String,
    pub docker_host: Option<String>,
    pub max_concurrent_executions: usize,
    pub default_timeout_secs: u64,
    pub max_timeout_secs: u64,
    pub max_memory_mb: u64,
    pub max_output_kb: usize,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://polycore:polycore_secret@localhost:5432/polycore_nexus".to_string());

        let redis_url = std::env::var("REDIS_URL")
            .unwrap_or_else(|_| "redis://localhost:6379".to_string());

        Ok(Config {
            port: std::env::var("EXECUTION_SERVICE_PORT")
                .unwrap_or_else(|_| "8002".to_string())
                .parse()
                .unwrap_or(8002),
            database_url,
            redis_url,
            docker_host: std::env::var("DOCKER_HOST").ok(),
            max_concurrent_executions: std::env::var("MAX_CONCURRENT_EXECUTIONS")
                .unwrap_or_else(|_| "5".to_string())
                .parse()
                .unwrap_or(5),
            default_timeout_secs: std::env::var("EXECUTION_DEFAULT_TIMEOUT_SECS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()
                .unwrap_or(10),
            max_timeout_secs: std::env::var("EXECUTION_MAX_TIMEOUT_SECS")
                .unwrap_or_else(|_| "30".to_string())
                .parse()
                .unwrap_or(30),
            max_memory_mb: std::env::var("EXECUTION_MAX_MEMORY_MB")
                .unwrap_or_else(|_| "128".to_string())
                .parse()
                .unwrap_or(128),
            max_output_kb: std::env::var("EXECUTION_MAX_OUTPUT_KB")
                .unwrap_or_else(|_| "1024".to_string())
                .parse()
                .unwrap_or(1024),
        })
    }
}
