# POLYCORE NEXUS — Language Matrix

> Every language owns a real technical responsibility.

| Language   | Category    | Runtime    | Purpose                            | Port/Interface | Status   |
|------------|-------------|------------|------------------------------------|----------------|----------|
| TypeScript | Web Core    | Node/Vite  | Main frontend + type-safe clients  | :3000          | Active   |
| HTML       | Web Core    | Browser    | Semantic structure, docs pages     | —              | Active   |
| CSS        | Web Core    | Browser    | Design system, animations          | —              | Active   |
| JavaScript | Web Core    | Browser    | WebSocket client, browser utils    | —              | Active   |
| Go         | Backend     | Go runtime | API gateway, IoT service           | :8080, :8005   | Active   |
| Python     | Backend/AI  | CPython    | AI service, analytics, automation  | :8001          | Active   |
| Rust       | Systems     | Rust       | Secure execution engine            | :8002          | Active   |
| Java       | Backend     | JVM        | Enterprise API, auth service       | :8003          | Active   |
| C          | Systems     | GCC        | Embedded firmware, algorithms      | ESP32          | Active   |
| C++        | Systems     | GCC/Clang  | High-perf compute, image proc      | Container      | Active   |
| C#         | Desktop     | .NET       | Desktop admin client / simulator   | App            | Active   |
| PHP        | Web         | PHP-FPM    | Legacy backend demonstration       | :8007          | Active   |
| Ruby       | Scripting   | MRI Ruby   | Dev tooling, project scaffolding   | CLI            | Active   |
| Kotlin     | Mobile      | JVM        | Android companion app              | App            | Planned  |
| Swift      | Mobile      | Swift      | iOS companion app                  | App            | Planned  |
| Dart       | Mobile      | Flutter    | Cross-platform mobile prototype    | App            | Planned  |
| R          | Data        | R          | Statistical analysis, sensor data  | :8006          | Active   |
| Julia      | Scientific  | Julia      | Numerical computing, simulations   | Container      | Active   |
| MATLAB     | Engineering | MATLAB/Oct | Signal processing, control systems | File/Octave    | Planned  |
| Bash       | Scripting   | Bash       | Linux setup, Docker orchestration  | CLI            | Active   |
| PowerShell | Scripting   | PS Core    | Windows dev setup, automation      | CLI            | Active   |
| Lua        | Scripting   | LuaJIT     | Plugin system, user automation     | Embedded       | Active   |
| Scala      | JVM         | Scala/JVM  | Data processing demonstration      | Container      | Planned  |
| Elixir     | Backend     | BEAM       | Real-time events, WebSockets       | :8004          | Active   |
| Haskell    | Functional  | GHC        | Pure algorithm service             | Container      | Planned  |
| Groovy     | JVM         | Groovy     | Build automation, CI scripting     | Gradle         | Active   |
| Zig        | Systems     | Zig        | Low-level utility, native build    | Container      | Planned  |
| Assembly   | Systems     | NASM       | CPU instruction demo, benchmark    | Container      | Planned  |
| Solidity   | Blockchain  | EVM        | Execution result integrity hash    | Testnet        | Optional |

## Language Runner Dockerfile Pattern

Every language runner follows this pattern:

```dockerfile
FROM <language-base-image>
WORKDIR /sandbox
# Install language toolchain
# Copy runner script
RUN adduser --disabled-password --gecos "" runner
USER runner
ENTRYPOINT ["./run.sh"]
```

## Adding a New Language

1. Create `runtimes/<language>/` directory
2. Add `metadata.json` with language registry entry
3. Add `runner.sh` or `runner.py` execution wrapper
4. Add `Dockerfile`
5. Add at least one algorithm implementation
6. Add tests
7. Register in `database/seeds/languages.sql`
8. The frontend discovers it automatically from the API
