# PolyCore Nexus — Quicksort (Python)
import sys
import time
import random


def quicksort(arr: list) -> list:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x < pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10_000
    seed = 42
    random.seed(seed)
    data = [random.randint(0, 1_000_000) for _ in range(n)]

    start = time.perf_counter_ns()
    sorted_data = quicksort(data)
    elapsed_ns = time.perf_counter_ns() - start

    print(f"quicksort({n} ints): sorted {len(sorted_data)} elements")
    print(f"first 5: {sorted_data[:5]}")
    print(f"last  5: {sorted_data[-5:]}")
    print(f"elapsed: {elapsed_ns / 1_000_000:.3f}ms")


if __name__ == "__main__":
    main()
