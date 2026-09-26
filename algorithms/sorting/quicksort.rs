// PolyCore Nexus — Quicksort (Rust)
use std::env;
use std::time::Instant;

fn quicksort(arr: &mut Vec<i64>) {
    let len = arr.len();
    if len <= 1 {
        return;
    }
    quicksort_slice(arr, 0, len - 1);
}

fn quicksort_slice(arr: &mut Vec<i64>, low: usize, high: usize) {
    if low < high {
        let p = partition(arr, low, high);
        if p > 0 {
            quicksort_slice(arr, low, p - 1);
        }
        quicksort_slice(arr, p + 1, high);
    }
}

fn partition(arr: &mut Vec<i64>, low: usize, high: usize) -> usize {
    let pivot = arr[high];
    let mut i = low;
    for j in low..high {
        if arr[j] <= pivot {
            arr.swap(i, j);
            i += 1;
        }
    }
    arr.swap(i, high);
    i
}

// Simple deterministic pseudo-random number generator (LCG, seed=42)
fn lcg_random(seed: &mut u64) -> i64 {
    *seed = seed.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(1_442_695_040_888_963_407);
    ((*seed >> 33) % 1_000_001) as i64
}

fn main() {
    let n: usize = env::args()
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(10_000);

    let mut seed = 42u64;
    let mut data: Vec<i64> = (0..n).map(|_| lcg_random(&mut seed)).collect();

    let start = Instant::now();
    quicksort(&mut data);
    let elapsed = start.elapsed();

    println!("quicksort({} ints): sorted {} elements", n, data.len());
    println!("first 5: {:?}", &data[..5.min(data.len())]);
    println!("last  5: {:?}", &data[data.len().saturating_sub(5)..]);
    println!("elapsed: {:.3}ms", elapsed.as_secs_f64() * 1000.0);
}
