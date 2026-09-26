//! PolyCore Nexus — Execution Service
//! Securely executes user code in isolated Docker containers.

use anyhow::Result;
use axum::{routing::get, Router};
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod error;
mod executor;
mod handlers;
mod models;
mod queue;
mod worker;

pub use config::Config;

#[tokio::main]
async fn main() -> Result<()> {
    // Load .env
    let _ = dotenvy::dotenv();

    // Setup tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "execution_service=info,tower_http=info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let cfg = Config::from_env()?;
    info!("Starting PolyCore Execution Service on port {}", cfg.port);

    // Connect to PostgreSQL
    let db_pool = db::create_pool(&cfg.database_url).await?;
    info!("Connected to PostgreSQL");

    // Connect to Redis
    let redis_client = redis::Client::open(cfg.redis_url.clone())?;
    let redis_conn = redis::aio::ConnectionManager::new(redis_client.clone()).await?;
    info!("Connected to Redis");

    // Connect to Docker
    let docker = bollard::Docker::connect_with_local_defaults()?;
    info!("Connected to Docker");

    let state = Arc::new(AppState {
        db: db_pool.clone(),
        redis: redis_conn.clone(),
        docker: docker.clone(),
        config: cfg.clone(),
    });

    // Spawn the execution worker (consumes Redis queue jobs)
    let worker_state = state.clone();
    tokio::spawn(async move {
        worker::run_worker(worker_state).await;
    });
    info!("Execution worker started");

    // Build HTTP router
    let app = Router::new()
        .route("/health", get(handlers::health))
        .route("/ready", get(handlers::ready))
        .with_state(state);

    // Start server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", cfg.port)).await?;
    info!("Execution service listening on port {}", cfg.port);

    axum::serve(listener, app).await?;
    Ok(())
}

/// Shared application state across all handlers.
pub struct AppState {
    pub db: sqlx::PgPool,
    pub redis: redis::aio::ConnectionManager,
    pub docker: bollard::Docker,
    pub config: Config,
}
