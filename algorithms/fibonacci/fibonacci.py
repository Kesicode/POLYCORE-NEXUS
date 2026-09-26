"""
PolyCore Nexus — Fibonacci (Python)
Algorithm: iterative O(n) — identical output across all language implementations.
"""
import sys
import time


def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    start = time.perf_counter_ns()
    result = fibonacci(n)
    elapsed_ns = time.perf_counter_ns() - start

    print(f"fibonacci({n}) = {result}")
    print(f"elapsed: {elapsed_ns / 1_000_000:.3f}ms")


if __name__ == "__main__":
    main()
