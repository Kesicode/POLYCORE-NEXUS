-- POLYCORE NEXUS — Seed Data
-- Run after schema migration

-- ============================================================
-- LANGUAGES
-- ============================================================

INSERT INTO languages (name, display_name, version, category, runtime, file_extensions, execution_command, supports_compilation, supports_metrics, runner_image, color, description) VALUES
('python', 'Python', '3.12', 'AI/Backend', 'python3', ARRAY['.py'], 'python3 /sandbox/main.py', false, true, 'polycore/runner-python:latest', '#3776AB', 'General-purpose language used for AI, data science, and automation.'),
('javascript', 'JavaScript', '20 (LTS)', 'Web Core', 'node', ARRAY['.js', '.mjs'], 'node /sandbox/main.js', false, true, 'polycore/runner-node:latest', '#F7DF1E', 'The language of the web, also used server-side via Node.js.'),
('typescript', 'TypeScript', '5.4', 'Web Core', 'node+tsx', ARRAY['.ts', '.tsx'], 'npx tsx /sandbox/main.ts', false, true, 'polycore/runner-node:latest', '#3178C6', 'Typed superset of JavaScript with excellent tooling.'),
('go', 'Go', '1.22', 'Backend', 'go', ARRAY['.go'], 'go run /sandbox/main.go', false, true, 'polycore/runner-go:latest', '#00ADD8', 'Fast, statically typed language by Google. Great for microservices.'),
('rust', 'Rust', '1.78', 'Systems', 'rustc', ARRAY['.rs'], 'rustc /sandbox/main.rs -o /sandbox/main && /sandbox/main', true, true, 'polycore/runner-rust:latest', '#CE412B', 'Memory-safe systems language with zero-cost abstractions.'),
('c', 'C', 'GCC 13', 'Systems', 'gcc', ARRAY['.c'], 'gcc /sandbox/main.c -o /sandbox/main && /sandbox/main', true, true, 'polycore/runner-c:latest', '#A8B9CC', 'The foundational systems language. Used in embedded, OS, and performance-critical code.'),
('cpp', 'C++', 'GCC 13 / C++23', 'Systems', 'g++', ARRAY['.cpp', '.cc', '.cxx'], 'g++ -std=c++23 /sandbox/main.cpp -o /sandbox/main && /sandbox/main', true, true, 'polycore/runner-cpp:latest', '#00599C', 'Extension of C with OOP, templates, and STL. Used in game engines, HPC, and robotics.'),
('java', 'Java', '21 (LTS)', 'Backend/JVM', 'openjdk', ARRAY['.java'], 'javac /sandbox/Main.java && java -cp /sandbox Main', true, true, 'polycore/runner-java:latest', '#ED8B00', 'Mature, enterprise-grade language with strong ecosystem.'),
('csharp', 'C#', '.NET 8', 'Backend/Desktop', 'dotnet', ARRAY['.cs'], 'dotnet script /sandbox/main.cs', false, true, 'polycore/runner-dotnet:latest', '#512BD4', 'Microsofts flagship language. Excellent for enterprise and game dev (Unity).'),
('php', 'PHP', '8.3', 'Web', 'php', ARRAY['.php'], 'php /sandbox/main.php', false, true, 'polycore/runner-php:latest', '#777BB4', 'Server-side scripting language powering much of the web.'),
('ruby', 'Ruby', '3.3', 'Scripting', 'ruby', ARRAY['.rb'], 'ruby /sandbox/main.rb', false, true, 'polycore/runner-ruby:latest', '#CC342D', 'Elegant, developer-friendly scripting language. Creator of Ruby on Rails.'),
('r', 'R', '4.4', 'Data Science', 'Rscript', ARRAY['.r', '.R'], 'Rscript /sandbox/main.R', false, true, 'polycore/runner-r:latest', '#276DC3', 'Statistical computing language with rich data visualization.'),
('julia', 'Julia', '1.10', 'Scientific', 'julia', ARRAY['.jl'], 'julia /sandbox/main.jl', false, true, 'polycore/runner-julia:latest', '#9558B2', 'High-performance dynamic language for scientific computing.'),
('lua', 'Lua', '5.4', 'Scripting', 'lua', ARRAY['.lua'], 'lua /sandbox/main.lua', false, false, 'polycore/runner-lua:latest', '#000080', 'Lightweight embeddable scripting language used in game engines and plugins.'),
('kotlin', 'Kotlin', '2.0', 'Mobile/JVM', 'kotlin', ARRAY['.kt'], 'kotlinc /sandbox/main.kt -include-runtime -d /sandbox/main.jar && java -jar /sandbox/main.jar', true, true, 'polycore/runner-kotlin:latest', '#7F52FF', 'Googles preferred Android language. Modern, concise, and safe.'),
('swift', 'Swift', '5.10', 'Mobile/Systems', 'swift', ARRAY['.swift'], 'swift /sandbox/main.swift', false, true, 'polycore/runner-swift:latest', '#F05138', 'Apples modern systems language for iOS, macOS, and server-side.'),
('dart', 'Dart', '3.4', 'Mobile/Web', 'dart', ARRAY['.dart'], 'dart /sandbox/main.dart', false, true, 'polycore/runner-dart:latest', '#0175C2', 'Googles language powering Flutter for cross-platform apps.'),
('elixir', 'Elixir', '1.17', 'Backend/Functional', 'elixir', ARRAY['.ex', '.exs'], 'elixir /sandbox/main.exs', false, true, 'polycore/runner-elixir:latest', '#6E4A7E', 'Functional language on the BEAM VM. Excellent for real-time distributed systems.'),
('haskell', 'Haskell', 'GHC 9.8', 'Functional', 'ghc', ARRAY['.hs'], 'runghc /sandbox/main.hs', false, true, 'polycore/runner-haskell:latest', '#5D4F85', 'Purely functional language with strong type system. Academic and industrial use.'),
('scala', 'Scala', '3.4', 'JVM/Functional', 'scala', ARRAY['.scala'], 'scala /sandbox/main.scala', false, true, 'polycore/runner-scala:latest', '#DC322F', 'Functional + OOP language on JVM. Used in big data (Spark, Kafka).'),
('groovy', 'Groovy', '4.0', 'JVM/Scripting', 'groovy', ARRAY['.groovy'], 'groovy /sandbox/main.groovy', false, false, 'polycore/runner-groovy:latest', '#4298B8', 'Dynamic JVM language used heavily in Jenkins pipelines and Gradle.'),
('zig', 'Zig', '0.13', 'Systems', 'zig', ARRAY['.zig'], 'zig run /sandbox/main.zig', false, true, 'polycore/runner-zig:latest', '#F7A41D', 'Low-level systems language with explicit memory management. Modern C alternative.'),
('assembly', 'Assembly (x86-64)', 'NASM 2.16', 'Systems', 'nasm', ARRAY['.asm', '.s'], 'nasm -f elf64 /sandbox/main.asm -o /sandbox/main.o && ld /sandbox/main.o -o /sandbox/main && /sandbox/main', true, true, 'polycore/runner-assembly:latest', '#6E4C13', 'Low-level CPU instruction language. Educational component showing raw hardware.'),
('bash', 'Bash', '5.2', 'Scripting', 'bash', ARRAY['.sh', '.bash'], 'bash /sandbox/main.sh', false, false, 'polycore/runner-bash:latest', '#4EAA25', 'Unix shell scripting language for automation and system administration.'),
('matlab', 'MATLAB / Octave', 'Octave 9', 'Engineering', 'octave', ARRAY['.m'], 'octave --no-gui /sandbox/main.m', false, false, 'polycore/runner-octave:latest', '#E16737', 'Numerical computing. MATLAB syntax; Octave used as open-source runner.');

-- ============================================================
-- BENCHMARK ALGORITHMS
-- ============================================================

INSERT INTO benchmark_algorithms (name, display_name, description, category) VALUES
('fibonacci', 'Fibonacci Sequence', 'Compute the nth Fibonacci number. Tests recursion, iteration, and memoization across languages.', 'Mathematics'),
('primes', 'Prime Number Sieve', 'Sieve of Eratosthenes to find all primes up to N. Tests loop performance and array operations.', 'Mathematics'),
('sorting', 'Sorting Algorithms', 'Sort an array of 100,000 random integers. Tests comparison and memory allocation performance.', 'Data Structures'),
('matrix_multiply', 'Matrix Multiplication', 'Multiply two NxN matrices. Tests numeric computation and nested loop performance.', 'Linear Algebra'),
('sha256', 'SHA-256 Hashing', 'Compute SHA-256 of a 1MB string. Tests cryptographic hashing throughput.', 'Cryptography'),
('monte_carlo_pi', 'Monte Carlo Pi', 'Estimate Pi using 1,000,000 random samples. Tests floating-point and RNG performance.', 'Statistics'),
('string_processing', 'String Processing', 'Count words in a 10,000-word text and find top-10 frequent words. Tests string ops.', 'Text Processing'),
('json_parsing', 'JSON Parse/Serialize', 'Parse a 500KB JSON file and re-serialize. Tests JSON library and memory handling.', 'Data Format'),
('binary_search', 'Binary Search', 'Perform 1,000,000 binary searches on a sorted array of 1,000,000 integers.', 'Data Structures'),
('graph_bfs', 'Graph BFS/DFS', 'Breadth-first search on a graph with 10,000 nodes and 50,000 edges.', 'Graph Theory');

-- ============================================================
-- DEMO USERS (passwords will be re-hashed by seed script)
-- ============================================================
-- Admin: admin@polycore.dev / PolyCoreAdmin2024!
-- Developer: dev@polycore.dev / DevUser2024!
-- User: user@polycore.dev / UserDemo2024!

-- These will be inserted by the application seed script (seeds/demo_users.go)
-- because we need bcrypt hashing which is not done in SQL

-- ============================================================
-- DEMO DEVICES
-- ============================================================

-- Inserted by application seed script after users are created
