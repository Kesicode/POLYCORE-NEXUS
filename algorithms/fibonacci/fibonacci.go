// PolyCore Nexus — Fibonacci (Go)
// Algorithm: iterative O(n) — identical output across all language implementations.
package main

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

func fibonacci(n int) uint64 {
	a, b := uint64(0), uint64(1)
	for i := 0; i < n; i++ {
		a, b = b, a+b
	}
	return a
}

func main() {
	n := 40
	if len(os.Args) > 1 {
		if v, err := strconv.Atoi(os.Args[1]); err == nil {
			n = v
		}
	}

	start := time.Now()
	result := fibonacci(n)
	elapsed := time.Since(start)

	fmt.Printf("fibonacci(%d) = %d\n", n, result)
	fmt.Printf("elapsed: %.3fms\n", float64(elapsed.Nanoseconds())/1e6)
}
