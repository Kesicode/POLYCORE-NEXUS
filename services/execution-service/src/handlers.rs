//! HTTP handlers for the execution service.

use axum::{extract::State, Json};
use serde_json::{json, Value};
use std::sync::Arc;

use crate::AppState;

pub async fn health() -> Json<Value> {
    Json(json!({
        "service": "execution-service",
        "status": "ok",
        "version": "1.0.0"
    }))
}

pub async fn ready(State(state): State<Arc<AppState>>) -> Json<Value> {
    // Check DB
    let db_ok = sqlx::query("SELECT 1").execute(&state.db).await.is_ok();

    // Check Redis
    let mut conn = state.redis.clone();
    let redis_ok: bool = redis::cmd("PING")
        .query_async::<String>(&mut conn)
        .await
        .map(|r| r == "PONG")
        .unwrap_or(false);

    // Check Docker
    let docker_ok = state.docker.ping().await.is_ok();

    let all_ok = db_ok && redis_ok && docker_ok;

    Json(json!({
        "service": "execution-service",
        "status": if all_ok { "ready" } else { "degraded" },
        "deps": {
            "postgres": if db_ok { "ok" } else { "error" },
            "redis": if redis_ok { "ok" } else { "error" },
            "docker": if docker_ok { "ok" } else { "error" }
        }
    }))
}
