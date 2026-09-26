# PolyCore Nexus — Sieve of Eratosthenes (Python)
# Generates all primes up to N — identical output across all language implementations.
import sys
import time


def sieve(limit: int) -> list[int]:
    is_prime = bytearray([1]) * (limit + 1)
    is_prime[0] = is_prime[1] = 0
    for i in range(2, int(limit**0.5) + 1):
        if is_prime[i]:
            is_prime[i * i :: i] = bytearray(len(is_prime[i * i :: i]))
    return [i for i, v in enumerate(is_prime) if v]


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10_000
    start = time.perf_counter_ns()
    primes = sieve(limit)
    elapsed_ns = time.perf_counter_ns() - start

    print(f"sieve({limit}): {len(primes)} primes found")
    print(f"largest: {primes[-1] if primes else 'none'}")
    print(f"elapsed: {elapsed_ns / 1_000_000:.3f}ms")


if __name__ == "__main__":
    main()
