// PolyCore Nexus — Fibonacci (JavaScript)
// Algorithm: iterative O(n) — identical output across all language implementations.

function fibonacci(n) {
  let a = 0n, b = 1n
  for (let i = 0; i < n; i++) {
    ;[a, b] = [b, a + b]
  }
  return a
}

const n = parseInt(process.argv[2] ?? '40', 10)

const start = process.hrtime.bigint()
const result = fibonacci(n)
const elapsed = process.hrtime.bigint() - start

console.log(`fibonacci(${n}) = ${result}`)
console.log(`elapsed: ${(Number(elapsed) / 1e6).toFixed(3)}ms`)
