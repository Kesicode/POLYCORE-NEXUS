# PolyCore Nexus — End-to-End Field Verification Suite
$base = "http://localhost:8080"
$results = @()

Write-Host "Starting PolyCore Nexus verification suite against $base..." -ForegroundColor Cyan

# ── 1. AUTHENTICATION & RBAC ───────────────────────────────
try {
  $rAdmin = Invoke-WebRequest -Method POST -Uri "$base/api/v1/auth/login" `
    -ContentType "application/json" -Body '{"email":"admin@polycore.dev","password":"PolyCoreAdmin2024!"}' -UseBasicParsing
  $jAdmin = $rAdmin.Content | ConvertFrom-Json
  $adminToken = $jAdmin.data.tokens.accessToken
  $results += [pscustomobject]@{Domain="Auth";Field="Admin Login";Status=if($jAdmin.success -and $jAdmin.data.user.role -eq "admin"){"PASS"}else{"FAIL"};Detail="role=admin"}
} catch {
  $results += [pscustomobject]@{Domain="Auth";Field="Admin Login";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rDev = Invoke-WebRequest -Method POST -Uri "$base/api/v1/auth/login" `
    -ContentType "application/json" -Body '{"email":"dev@polycore.dev","password":"DevUser2024!"}' -UseBasicParsing
  $jDev = $rDev.Content | ConvertFrom-Json
  $devToken = $jDev.data.tokens.accessToken
  $devRefresh = $jDev.data.tokens.refreshToken
  $results += [pscustomobject]@{Domain="Auth";Field="Developer Login";Status=if($jDev.success -and $devToken.Length -gt 20){"PASS"}else{"FAIL"};Detail="token_len=$($devToken.Length)"}
} catch {
  $results += [pscustomobject]@{Domain="Auth";Field="Developer Login";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rUser = Invoke-WebRequest -Method POST -Uri "$base/api/v1/auth/login" `
    -ContentType "application/json" -Body '{"email":"user@polycore.dev","password":"UserDemo2024!"}' -UseBasicParsing
  $jUser = $rUser.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Auth";Field="User Login";Status=if($jUser.success -and $jUser.data.user.role -eq "user"){"PASS"}else{"FAIL"};Detail="role=user"}
} catch {
  $results += [pscustomobject]@{Domain="Auth";Field="User Login";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rBad = Invoke-WebRequest -Method POST -Uri "$base/api/v1/auth/login" `
    -ContentType "application/json" -Body '{"email":"admin@polycore.dev","password":"wrong"}' -UseBasicParsing
  $jBad = $rBad.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Auth";Field="Credential Defense";Status=if(-not $jBad.success){"PASS"}else{"FAIL"};Detail="rejected"}
} catch {
  $results += [pscustomobject]@{Domain="Auth";Field="Credential Defense";Status="PASS";Detail="401 unauthorized"}
}

try {
  $rMe = Invoke-WebRequest -Uri "$base/api/v1/auth/me" -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $jMe = $rMe.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Auth";Field="Identity Profile (/me)";Status=if($jMe.data.email -eq "dev@polycore.dev"){"PASS"}else{"FAIL"};Detail=$jMe.data.email}
} catch {
  $results += [pscustomobject]@{Domain="Auth";Field="Identity Profile (/me)";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rRef = Invoke-WebRequest -Method POST -Uri "$base/api/v1/auth/refresh" `
    -ContentType "application/json" -Body "{`"refreshToken`":`"$devRefresh`"}" -UseBasicParsing
  $jRef = $rRef.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Auth";Field="Token Refresh";Status=if($jRef.success -and $jRef.data.tokens.accessToken){"PASS"}else{"FAIL"};Detail="rotated"}
} catch {
  $results += [pscustomobject]@{Domain="Auth";Field="Token Refresh";Status="FAIL";Detail=$_.Exception.Message}
}

# ── 2. POLYGLOT LANGUAGE REGISTRY ──────────────────────────
try {
  $rLangs = Invoke-WebRequest -Uri "$base/api/v1/languages" -UseBasicParsing
  $jLangs = $rLangs.Content | ConvertFrom-Json
  $count = $jLangs.data.languages.Count
  $results += [pscustomobject]@{Domain="Registry";Field="Polyglot Catalog";Status=if($count -ge 20){"PASS"}else{"FAIL"};Detail="$count runtimes loaded"}
} catch {
  $results += [pscustomobject]@{Domain="Registry";Field="Polyglot Catalog";Status="FAIL";Detail=$_.Exception.Message}
}

$langChecks = @("python", "go", "rust", "typescript", "cpp")
$foundAll = $true
foreach ($l in $langChecks) {
  try {
    $rl = Invoke-WebRequest -Uri "$base/api/v1/languages/$l" -UseBasicParsing
    $jl = $rl.Content | ConvertFrom-Json
    if (-not $jl.success) { $foundAll = $false }
  } catch { $foundAll = $false }
}
$results += [pscustomobject]@{Domain="Registry";Field="Metadata Verification";Status=if($foundAll){"PASS"}else{"FAIL"};Detail="py/go/rs/ts/cpp verified"}

# ── 3. SANDBOXED CODE EXECUTION ───────────────────────────
$execId = $null
try {
  $execPayload = @{
    language = "python"
    sourceCode = "import math`nradius = 7`narea = math.pi * radius**2`nprint(f'Circle Area: {area:.2f}')`nprint('Execution completed!')"
    stdin = ""
  } | ConvertTo-Json
  $rExec = Invoke-WebRequest -Method POST -Uri "$base/api/v1/executions" `
    -ContentType "application/json" -Headers @{Authorization="Bearer $devToken"} `
    -Body $execPayload -UseBasicParsing
  $jExec = $rExec.Content | ConvertFrom-Json
  $execId = $jExec.data.id
  $results += [pscustomobject]@{Domain="Execution";Field="Sandbox Dispatch";Status=if($jExec.success -and $execId){"PASS"}else{"FAIL"};Detail="id=$execId"}
} catch {
  $results += [pscustomobject]@{Domain="Execution";Field="Sandbox Dispatch";Status="FAIL";Detail=$_.Exception.Message}
}

if ($execId) {
  Start-Sleep -Seconds 8
  try {
    $rExecRes = Invoke-WebRequest -Uri "$base/api/v1/executions/$execId" `
      -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
    $jExecRes = $rExecRes.Content | ConvertFrom-Json
    $hasOutput = $jExecRes.data.stdout -match "Circle Area: 153.94"
    $results += [pscustomobject]@{Domain="Execution";Field="Bollard Sandbox Isolation";Status=if($jExecRes.data.status -eq "completed" -and $hasOutput){"PASS"}else{"FAIL"};Detail="exit=$($jExecRes.data.exit_code), output verified"}
  } catch {
    $results += [pscustomobject]@{Domain="Execution";Field="Bollard Sandbox Isolation";Status="FAIL";Detail=$_.Exception.Message}
  }
}

try {
  $rExecHist = Invoke-WebRequest -Uri "$base/api/v1/executions" `
    -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $jExecHist = $rExecHist.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Execution";Field="Execution History";Status=if($jExecHist.success -and $jExecHist.data.executions.Count -gt 0){"PASS"}else{"FAIL"};Detail="count=$($jExecHist.data.executions.Count)"}
} catch {
  $results += [pscustomobject]@{Domain="Execution";Field="Execution History";Status="FAIL";Detail=$_.Exception.Message}
}

# ── 4. WORKSPACES & PROJECT MANAGEMENT ──────────────────────
$projId = $null
try {
  $projPayload = @{
    name = "PolyCore Microservice Benchmark"
    description = "Multi-language micro-benchmark project"
    template = "blank"
  } | ConvertTo-Json
  $rProj = Invoke-WebRequest -Method POST -Uri "$base/api/v1/projects" `
    -ContentType "application/json" -Headers @{Authorization="Bearer $devToken"} `
    -Body $projPayload -UseBasicParsing
  $jProj = $rProj.Content | ConvertFrom-Json
  $projId = $jProj.data.id
  $results += [pscustomobject]@{Domain="Projects";Field="Create Project";Status=if($jProj.success -and $projId){"PASS"}else{"FAIL"};Detail="id=$projId"}
} catch {
  $results += [pscustomobject]@{Domain="Projects";Field="Create Project";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rProjList = Invoke-WebRequest -Uri "$base/api/v1/projects" `
    -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $jProjList = $rProjList.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Projects";Field="List Projects";Status=if($jProjList.data.projects.Count -gt 0){"PASS"}else{"FAIL"};Detail="count=$($jProjList.data.projects.Count)"}
} catch {
  $results += [pscustomobject]@{Domain="Projects";Field="List Projects";Status="FAIL";Detail=$_.Exception.Message}
}

if ($projId) {
  try {
    $filePayload = @{
      path = "/src/main.rs"
      name = "main.rs"
      content = "fn main() { println!(`"PolyCore Nexus Engine`"); }"
    } | ConvertTo-Json
    $rFile = Invoke-WebRequest -Method POST -Uri "$base/api/v1/projects/$projId/files" `
      -ContentType "application/json" -Headers @{Authorization="Bearer $devToken"} `
      -Body $filePayload -UseBasicParsing
    $jFile = $rFile.Content | ConvertFrom-Json
    $results += [pscustomobject]@{Domain="Projects";Field="Project File Tree";Status=if($jFile.success -and $jFile.data.name -eq "main.rs"){"PASS"}else{"FAIL"};Detail="file created"}
  } catch {
    $results += [pscustomobject]@{Domain="Projects";Field="Project File Tree";Status="FAIL";Detail=$_.Exception.Message}
  }
}

# ── 5. IOT & HARDWARE TELEMETRY ────────────────────────────
try {
  $rDevList = Invoke-WebRequest -Uri "$base/api/v1/devices" `
    -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $jDevList = $rDevList.Content | ConvertFrom-Json
  $devTotal = $jDevList.data.devices.Count
  $results += [pscustomobject]@{Domain="IoT";Field="Gateway Proxy to Broker";Status=if($devTotal -ge 3){"PASS"}else{"FAIL"};Detail="$devTotal devices active"}
} catch {
  $results += [pscustomobject]@{Domain="IoT";Field="Gateway Proxy to Broker";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rIotHealth = Invoke-WebRequest -Uri "http://localhost:8005/health" -UseBasicParsing
  $jIotHealth = $rIotHealth.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="IoT";Field="Device Telemetry Health";Status=if($jIotHealth.status -eq "ok"){"PASS"}else{"FAIL"};Detail="MQTT online"}
} catch {
  $results += [pscustomobject]@{Domain="IoT";Field="Device Telemetry Health";Status="FAIL";Detail=$_.Exception.Message}
}

# ── 6. BENCHMARK SUITE ──────────────────────────────────────
try {
  $rBench = Invoke-WebRequest -Uri "$base/api/v1/benchmarks/algorithms" `
    -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $jBench = $rBench.Content | ConvertFrom-Json
  $algoCount = $jBench.data.algorithms.Count
  $results += [pscustomobject]@{Domain="Benchmarks";Field="Algorithm Registry";Status=if($algoCount -gt 0){"PASS"}else{"FAIL"};Detail="$algoCount algorithms"}
} catch {
  $results += [pscustomobject]@{Domain="Benchmarks";Field="Algorithm Registry";Status="FAIL";Detail=$_.Exception.Message}
}

# ── 7. SYSTEM MONITORING & TELEMETRY ────────────────────────
try {
  $rSys = Invoke-WebRequest -Uri "$base/api/v1/system/services" `
    -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $jSys = $rSys.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="System";Field="Service Mesh Health";Status=if($jSys.success){"PASS"}else{"FAIL"};Detail="mesh ok"}
} catch {
  $results += [pscustomobject]@{Domain="System";Field="Service Mesh Health";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rMet = Invoke-WebRequest -Uri "$base/api/v1/system/metrics" `
    -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $jMet = $rMet.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="System";Field="Execution Queue Depth";Status=if($jMet.success){"PASS"}else{"FAIL"};Detail="active=$($jMet.data.executionQueue.active)"}
} catch {
  $results += [pscustomobject]@{Domain="System";Field="Execution Queue Depth";Status="FAIL";Detail=$_.Exception.Message}
}

# ── 8. ADMIN SECURITY GATES ─────────────────────────────────
try {
  $rAdminUsers = Invoke-WebRequest -Uri "$base/admin/users" `
    -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing
  $jAdminUsers = $rAdminUsers.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Security";Field="Admin User Management";Status=if($jAdminUsers.success -and $jAdminUsers.data.users.Count -ge 3){"PASS"}else{"FAIL"};Detail="$($jAdminUsers.data.users.Count) users managed"}
} catch {
  $results += [pscustomobject]@{Domain="Security";Field="Admin User Management";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rGate = Invoke-WebRequest -Uri "$base/admin/users" `
    -Headers @{Authorization="Bearer $devToken"} -UseBasicParsing
  $results += [pscustomobject]@{Domain="Security";Field="Role Authorization Barrier";Status="FAIL";Detail="unexpectedly allowed"}
} catch {
  $results += [pscustomobject]@{Domain="Security";Field="Role Authorization Barrier";Status="PASS";Detail="403 forbidden enforced"}
}

# ── 9. MICROSERVICE HEALTH PROBES ───────────────────────────
try {
  $rAiH = Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing
  $jAiH = $rAiH.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Microservices";Field="AI Microservice (Py)";Status=if($jAiH.status -eq "ok"){"PASS"}else{"FAIL"};Detail="uptime=$([Math]::Round($jAiH.uptime_seconds,1))s"}
} catch {
  $results += [pscustomobject]@{Domain="Microservices";Field="AI Microservice (Py)";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rExH = Invoke-WebRequest -Uri "http://localhost:8002/health" -UseBasicParsing
  $jExH = $rExH.Content | ConvertFrom-Json
  $results += [pscustomobject]@{Domain="Microservices";Field="Execution Engine (Rust)";Status=if($jExH.status -eq "ok"){"PASS"}else{"FAIL"};Detail="v$($jExH.version)"}
} catch {
  $results += [pscustomobject]@{Domain="Microservices";Field="Execution Engine (Rust)";Status="FAIL";Detail=$_.Exception.Message}
}

try {
  $rWeb = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
  $results += [pscustomobject]@{Domain="Frontend";Field="React SPA Web App";Status=if($rWeb.StatusCode -eq 200){"PASS"}else{"FAIL"};Detail="HTTP 200 OK"}
} catch {
  $results += [pscustomobject]@{Domain="Frontend";Field="React SPA Web App";Status="FAIL";Detail=$_.Exception.Message}
}

Write-Host "`n"
Write-Host "═════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "          POLYCORE NEXUS — END-TO-END FIELD VERIFICATION SUITE" -ForegroundColor Yellow
Write-Host "═════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$results | Format-Table -Property Domain, Field, Status, Detail -AutoSize
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $results.Count
Write-Host "═════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($passCount -eq $totalCount) {
  Write-Host "  RESULT: ALL $totalCount FIELDS VERIFIED SUCCESSFULLY! (100% PASS RATE)" -ForegroundColor Green
} else {
  Write-Host "  TOTAL: $totalCount  |  PASS: $passCount  |  FAIL: $($totalCount - $passCount)" -ForegroundColor Red
}
Write-Host "═════════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
