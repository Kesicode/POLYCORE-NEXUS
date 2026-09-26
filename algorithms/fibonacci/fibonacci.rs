// PolyCore Nexus — Fibonacci (Rust)
// Algorithm: iterative O(n) — identical output across all language implementations.
use std::env;
use std::time::Instant;

fn fibonacci(n: u32) -> u64 {
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 0..n {
        (a, b) = (b, a.saturating_add(b));
    }
    a
}

fn main() {
    let n: u32 = env::args()
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(40);

    let start = Instant::now();
    let result = fibonacci(n);
    let elapsed = start.elapsed();

    println!("fibonacci({}) = {}", n, result);
    println!("elapsed: {:.3}ms", elapsed.as_secs_f64() * 1000.0);
}
