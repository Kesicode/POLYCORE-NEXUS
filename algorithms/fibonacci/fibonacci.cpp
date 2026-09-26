// PolyCore Nexus — Fibonacci (C++)
// Algorithm: iterative O(n) — identical output across all language implementations.
#include <iostream>
#include <chrono>
#include <cstdint>
#include <string>

uint64_t fibonacci(int n) {
    uint64_t a = 0, b = 1;
    for (int i = 0; i < n; ++i) {
        uint64_t c = a + b;
        a = b;
        b = c;
    }
    return a;
}

int main(int argc, char* argv[]) {
    int n = 40;
    if (argc > 1) {
        n = std::stoi(argv[1]);
    }

    auto start = std::chrono::high_resolution_clock::now();
    uint64_t result = fibonacci(n);
    auto end = std::chrono::high_resolution_clock::now();

    double elapsed_ms = std::chrono::duration<double, std::milli>(end - start).count();

    std::cout << "fibonacci(" << n << ") = " << result << "\n";
    std::cout << "elapsed: " << elapsed_ms << "ms\n";

    return 0;
}
