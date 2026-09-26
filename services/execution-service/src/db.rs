//! PostgreSQL connection pool.

use anyhow::Result;
use sqlx::postgres::PgPoolOptions;

pub async fn create_pool(database_url: &str) -> Result<sqlx::PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(database_url)
        .await?;
    Ok(pool)
}
