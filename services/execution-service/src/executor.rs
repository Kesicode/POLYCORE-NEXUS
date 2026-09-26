//! Core Docker execution engine.
//!
//! SECURITY: All user code is executed inside isolated Docker containers.
//! Resource limits are enforced at the Docker API level.

use anyhow::{Context, Result};
use bollard::{
    container::{
        Config as ContainerConfig, CreateContainerOptions, LogOutput, LogsOptions,
        RemoveContainerOptions, StartContainerOptions, StopContainerOptions,
    },
    exec::{CreateExecOptions, StartExecResults},
    models::{HostConfig, ResourcesUlimits},
};
use futures_util::StreamExt;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::time::Instant;
use tokio::time::{timeout, Duration};
use tracing::{error, info, warn};

use crate::models::{ExecutionJob, ExecutionResult, ExecutionStatus};

/// Maps a language name to its Docker runner image.
pub fn language_to_image(language: &str) -> Option<&'static str> {
    match language {
        "python" => Some("python:3.12-slim"),
        "javascript" => Some("node:20-slim"),
        "typescript" => Some("node:20-slim"),
        "go" => Some("golang:1.22-alpine"),
        "rust" => Some("rust:1.78-slim"),
        "c" => Some("gcc:13"),
        "cpp" => Some("gcc:13"),
        "java" => Some("eclipse-temurin:21-jdk-alpine"),
        "csharp" => Some("mcr.microsoft.com/dotnet/sdk:8.0-alpine"),
        "php" => Some("php:8.3-cli-alpine"),
        "ruby" => Some("ruby:3.3-alpine"),
        "r" => Some("r-base:4.4.0"),
        "julia" => Some("julia:1.10-alpine"),
        "lua" => Some("nickblah/lua:5.4-alpine"),
        "kotlin" => Some("eclipse-temurin:21-jdk-alpine"),
        "swift" => Some("swift:5.10-focal"),
        "dart" => Some("dart:3.4"),
        "elixir" => Some("elixir:1.17-alpine"),
        "haskell" => Some("haskell:9.8"),
        "scala" => Some("sbtscala/scala-sbt:eclipse-temurin-21_1.10.0_3.4.1"),
        "groovy" => Some("groovy:4.0-jdk21-alpine"),
        "zig" => Some("ziglang/static-base:amd64-0.13.0"),
        "bash" => Some("bash:5.2"),
        "perl" => Some("perl:5.38-slim"),
        _ => None,
    }
}

/// Builds the execution command for a given language.
pub fn build_exec_command(language: &str, filename: &str) -> Vec<String> {
    match language {
        "python" => vec!["python3".into(), filename.into()],
        "javascript" => vec!["node".into(), filename.into()],
        "typescript" => vec!["npx".into(), "--yes".into(), "tsx".into(), filename.into()],
        "go" => vec!["go".into(), "run".into(), filename.into()],
        "rust" => vec![
            "sh".into(), "-c".into(),
            format!("rustc {} -o /tmp/prog && /tmp/prog", filename),
        ],
        "c" => vec![
            "sh".into(), "-c".into(),
            format!("gcc {} -o /tmp/prog && /tmp/prog", filename),
        ],
        "cpp" => vec![
            "sh".into(), "-c".into(),
            format!("g++ -std=c++20 {} -o /tmp/prog && /tmp/prog", filename),
        ],
        "java" => vec![
            "sh".into(), "-c".into(),
            format!("javac {} && java -cp /sandbox Main", filename),
        ],
        "r" => vec!["Rscript".into(), filename.into()],
        "julia" => vec!["julia".into(), filename.into()],
        "ruby" => vec!["ruby".into(), filename.into()],
        "php" => vec!["php".into(), filename.into()],
        "lua" => vec!["lua".into(), filename.into()],
        "bash" => vec!["bash".into(), filename.into()],
        "elixir" => vec!["elixir".into(), filename.into()],
        "haskell" => vec!["runghc".into(), filename.into()],
        "dart" => vec!["dart".into(), filename.into()],
        "kotlin" => vec![
            "sh".into(), "-c".into(),
            format!("kotlinc {} -include-runtime -d /tmp/prog.jar && java -jar /tmp/prog.jar", filename),
        ],
        "swift" => vec!["swift".into(), filename.into()],
        "groovy" => vec!["groovy".into(), filename.into()],
        "zig" => vec!["zig".into(), "run".into(), filename.into()],
        "csharp" => vec!["dotnet".into(), "script".into(), filename.into()],
        _ => vec!["sh".into(), "-c".into(), format!("cat {}", filename)],
    }
}

/// Returns file extension for a language.
fn language_extension(language: &str) -> &'static str {
    match language {
        "python" => "py",
        "javascript" => "js",
        "typescript" => "ts",
        "go" => "go",
        "rust" => "rs",
        "c" => "c",
        "cpp" => "cpp",
        "java" => "java",
        "ruby" => "rb",
        "php" => "php",
        "r" => "R",
        "julia" => "jl",
        "lua" => "lua",
        "bash" => "sh",
        "elixir" => "exs",
        "haskell" => "hs",
        "dart" => "dart",
        "kotlin" => "kt",
        "swift" => "swift",
        "groovy" => "groovy",
        "zig" => "zig",
        "csharp" => "cs",
        "scala" => "scala",
        _ => "txt",
    }
}

/// Executes code inside an isolated Docker container.
///
/// # Security
/// - Network access: disabled (NetworkMode = "none")
/// - CPU: limited to 0.5 cores (nano_cpus = 500_000_000)
/// - Memory: limited to max_memory_mb
/// - PID limit: 32 (prevents fork bombs)
/// - No new privileges
/// - tmpfs workspace: noexec flag prevents compiled binaries from escaping temp dir
pub async fn execute(
    docker: &bollard::Docker,
    job: &ExecutionJob,
    max_output_kb: usize,
) -> Result<ExecutionResult> {
    let image = match language_to_image(&job.language) {
        Some(img) => img,
        None => {
            return Ok(ExecutionResult {
                id: job.id.clone(),
                status: ExecutionStatus::Failed,
                exit_code: Some(-1),
                stdout: String::new(),
                stderr: format!("Unsupported language: {}", job.language),
                wall_time_ms: 0,
                memory_bytes: None,
                error_message: Some(format!("Unsupported language: {}", job.language)),
            });
        }
    };

    let ext = language_extension(&job.language);
    let filename = if job.language == "java" {
        "/sandbox/Main.java".to_string()
    } else {
        format!("/sandbox/main.{}", ext)
    };

    let cmd = build_exec_command(&job.language, &filename);
    let memory_bytes = job.memory_limit_mb * 1024 * 1024;

    // Container configuration with strict security limits
    let container_config = ContainerConfig {
        image: Some(image),
        cmd: Some(cmd.iter().map(|s| s.as_str()).collect()),
        working_dir: Some("/sandbox"),
        // Inject source code via environment to avoid filesystem mount issues
        // In production, use tmpfs volume mounts
        env: Some(vec![
            &format!("SOURCE_CODE_B64={}", base64_encode(&job.source_code)),
            "HOME=/tmp",
        ]),
        host_config: Some(HostConfig {
            // Memory limits
            memory: Some(memory_bytes as i64),
            memory_swap: Some(memory_bytes as i64), // No swap
            // CPU limits (0.5 cores)
            nano_cpus: Some(500_000_000),
            // Process limits (prevents fork bombs)
            pids_limit: Some(32),
            // No network access
            network_mode: Some("none".into()),
            // No new privileges
            security_opt: Some(vec!["no-new-privileges:true".into()]),
            // Read-only root filesystem
            readonly_rootfs: Some(true),
            // Writable tmpfs at /sandbox and /tmp only
            tmpfs: Some(HashMap::from([
                ("/sandbox".into(), "size=32m,noexec,nosuid".into()),
                ("/tmp".into(), "size=32m,noexec,nosuid".into()),
            ])),
            ..Default::default()
        }),
        ..Default::default()
    };

    let container_name = format!("polycore-exec-{}", &job.id[..8]);
    let start = Instant::now();

    // Create container
    let create_opts = CreateContainerOptions {
        name: &container_name,
        platform: None,
    };

    let container_id = match docker
        .create_container(Some(create_opts), container_config)
        .await
    {
        Ok(resp) => resp.id,
        Err(e) => {
            error!("Failed to create container for job {}: {}", job.id, e);
            return Ok(ExecutionResult {
                id: job.id.clone(),
                status: ExecutionStatus::Failed,
                exit_code: Some(-1),
                stdout: String::new(),
                stderr: "Container creation failed".into(),
                wall_time_ms: start.elapsed().as_millis() as u64,
                memory_bytes: None,
                error_message: Some(format!("Container error: {}", e)),
            });
        }
    };

    // Write source code into container via exec
    let write_exec = docker.create_exec(
        &container_id,
        CreateExecOptions {
            cmd: Some(vec!["sh", "-c",
                &format!("mkdir -p /sandbox && printf '%s' \"$SOURCE_CODE\" > {}", filename)]),
            ..Default::default()
        },
    ).await;

    // Start container
    if let Err(e) = docker
        .start_container(&container_id, None::<StartContainerOptions<String>>)
        .await
    {
        let _ = cleanup_container(docker, &container_id).await;
        error!("Failed to start container {}: {}", container_id, e);
        return Ok(ExecutionResult {
            id: job.id.clone(),
            status: ExecutionStatus::Failed,
            exit_code: Some(-1),
            stdout: String::new(),
            stderr: "Container start failed".into(),
            wall_time_ms: start.elapsed().as_millis() as u64,
            memory_bytes: None,
            error_message: Some(format!("Start error: {}", e)),
        });
    }

    // Collect logs with timeout
    let timeout_duration = Duration::from_secs(job.timeout_secs.min(35));
    let max_output = max_output_kb * 1024;

    let log_result = timeout(timeout_duration, collect_logs(docker, &container_id, max_output)).await;

    let wall_time_ms = start.elapsed().as_millis() as u64;

    // Clean up container regardless of outcome
    let _ = cleanup_container(docker, &container_id).await;

    match log_result {
        Ok(Ok((stdout, stderr, exit_code))) => {
            let status = if exit_code == 0 {
                ExecutionStatus::Completed
            } else {
                ExecutionStatus::Failed
            };
            Ok(ExecutionResult {
                id: job.id.clone(),
                status,
                exit_code: Some(exit_code),
                stdout,
                stderr,
                wall_time_ms,
                memory_bytes: None, // Would need cgroups metrics collection
                error_message: None,
            })
        }
        Ok(Err(e)) => {
            error!("Log collection error for job {}: {}", job.id, e);
            Ok(ExecutionResult {
                id: job.id.clone(),
                status: ExecutionStatus::Failed,
                exit_code: Some(-1),
                stdout: String::new(),
                stderr: "Execution error occurred".into(),
                wall_time_ms,
                memory_bytes: None,
                error_message: Some(e.to_string()),
            })
        }
        Err(_) => {
            warn!("Execution timeout for job {} after {}s", job.id, job.timeout_secs);
            Ok(ExecutionResult {
                id: job.id.clone(),
                status: ExecutionStatus::Timeout,
                exit_code: None,
                stdout: String::new(),
                stderr: format!("Execution exceeded the {}s time limit", job.timeout_secs),
                wall_time_ms,
                memory_bytes: None,
                error_message: Some("EXECUTION_TIMEOUT".into()),
            })
        }
    }
}

async fn collect_logs(
    docker: &bollard::Docker,
    container_id: &str,
    max_bytes: usize,
) -> Result<(String, String, i32)> {
    let mut stdout = String::new();
    let mut stderr = String::new();

    let log_opts = LogsOptions::<String> {
        stdout: true,
        stderr: true,
        follow: true,
        ..Default::default()
    };

    let mut log_stream = docker.logs(container_id, Some(log_opts));

    while let Some(msg) = log_stream.next().await {
        match msg? {
            LogOutput::StdOut { message } => {
                let s = String::from_utf8_lossy(&message);
                if stdout.len() + s.len() <= max_bytes {
                    stdout.push_str(&s);
                } else {
                    stdout.push_str("\n[Output truncated — exceeded size limit]");
                    break;
                }
            }
            LogOutput::StdErr { message } => {
                let s = String::from_utf8_lossy(&message);
                if stderr.len() + s.len() <= max_bytes / 2 {
                    stderr.push_str(&s);
                } else {
                    stderr.push_str("\n[Stderr truncated]");
                }
            }
            _ => {}
        }
    }

    // Get exit code
    let inspect = docker.inspect_container(container_id, None).await?;
    let exit_code = inspect
        .state
        .and_then(|s| s.exit_code)
        .unwrap_or(-1) as i32;

    Ok((stdout, stderr, exit_code))
}

async fn cleanup_container(docker: &bollard::Docker, container_id: &str) -> Result<()> {
    // Stop (in case still running)
    let _ = docker
        .stop_container(container_id, Some(StopContainerOptions { t: 1 }))
        .await;

    // Remove
    docker
        .remove_container(
            container_id,
            Some(RemoveContainerOptions {
                force: true,
                ..Default::default()
            }),
        )
        .await
        .context("removing container")?;

    Ok(())
}

fn base64_encode(input: &str) -> String {
    use std::io::Write;
    // Simple base64 encoding without external dep
    let bytes = input.as_bytes();
    let mut encoded = String::new();
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        encoded.push(CHARS[(b0 >> 2)] as char);
        encoded.push(CHARS[((b0 & 3) << 4) | (b1 >> 4)] as char);
        encoded.push(if chunk.len() > 1 { CHARS[((b1 & 15) << 2) | (b2 >> 6)] as char } else { '=' });
        encoded.push(if chunk.len() > 2 { CHARS[b2 & 63] as char } else { '=' });
    }
    encoded
}
