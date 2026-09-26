// PolyCore Nexus — Sieve of Eratosthenes (Go)
package main

import (
	"fmt"
	"math"
	"os"
	"strconv"
	"time"
)

func sieve(limit int) []int {
	isPrime := make([]bool, limit+1)
	for i := 2; i <= limit; i++ {
		isPrime[i] = true
	}
	for i := 2; i <= int(math.Sqrt(float64(limit))); i++ {
		if isPrime[i] {
			for j := i * i; j <= limit; j += i {
				isPrime[j] = false
			}
		}
	}
	var primes []int
	for i, v := range isPrime {
		if v {
			primes = append(primes, i)
		}
	}
	return primes
}

func main() {
	limit := 10_000
	if len(os.Args) > 1 {
		if v, err := strconv.Atoi(os.Args[1]); err == nil {
			limit = v
		}
	}
	start := time.Now()
	primes := sieve(limit)
	elapsed := time.Since(start)

	fmt.Printf("sieve(%d): %d primes found\n", limit, len(primes))
	if len(primes) > 0 {
		fmt.Printf("largest: %d\n", primes[len(primes)-1])
	}
	fmt.Printf("elapsed: %.3fms\n", float64(elapsed.Nanoseconds())/1e6)
}
