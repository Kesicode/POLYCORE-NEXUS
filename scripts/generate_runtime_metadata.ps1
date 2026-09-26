$languages = @(
    @{ name="python";     display="Python";       version="3.12.7"; category="scripting";     color="#3776AB"; ext=@("py") }
    @{ name="javascript"; display="JavaScript";    version="Node 20"; category="scripting";     color="#F7DF1E"; ext=@("js","mjs") }
    @{ name="typescript"; display="TypeScript";    version="5.3";    category="scripting";     color="#3178C6"; ext=@("ts","tsx") }
    @{ name="go";         display="Go";            version="1.22";   category="system";        color="#00ADD8"; ext=@("go") }
    @{ name="rust";       display="Rust";          version="1.82";   category="system";        color="#CE412B"; ext=@("rs") }
    @{ name="c";          display="C";             version="GCC 13"; category="system";        color="#A8B9CC"; ext=@("c","h") }
    @{ name="cpp";        display="C++";           version="C++23";  category="system";        color="#00599C"; ext=@("cpp","cc","cxx","h","hpp") }
    @{ name="java";       display="Java";          version="21 LTS"; category="jvm";           color="#ED8B00"; ext=@("java") }
    @{ name="kotlin";     display="Kotlin";        version="2.0";    category="jvm";           color="#7F52FF"; ext=@("kt","kts") }
    @{ name="scala";      display="Scala";         version="3.4";    category="jvm";           color="#DC322F"; ext=@("scala","sc") }
    @{ name="csharp";     display="C#";            version="12/.NET 8"; category="dotnet";    color="#512BD4"; ext=@("cs") }
    @{ name="ruby";       display="Ruby";          version="3.3";    category="scripting";     color="#CC342D"; ext=@("rb") }
    @{ name="php";        display="PHP";           version="8.3";    category="scripting";     color="#777BB4"; ext=@("php") }
    @{ name="swift";      display="Swift";         version="5.10";   category="system";        color="#F05138"; ext=@("swift") }
    @{ name="r";          display="R";             version="4.4";    category="data-science";  color="#276DC3"; ext=@("r","R") }
    @{ name="julia";      display="Julia";         version="1.10";   category="data-science";  color="#9558B2"; ext=@("jl") }
    @{ name="haskell";    display="Haskell";       version="GHC 9.8"; category="functional";  color="#5D4F85"; ext=@("hs","lhs") }
    @{ name="elixir";     display="Elixir";        version="1.17";   category="functional";   color="#6E4A7E"; ext=@("ex","exs") }
    @{ name="erlang";     display="Erlang";        version="OTP 27"; category="functional";   color="#A90533"; ext=@("erl","hrl") }
    @{ name="lua";        display="Lua";           version="5.4";    category="scripting";     color="#000080"; ext=@("lua") }
    @{ name="perl";       display="Perl";          version="5.38";   category="scripting";     color="#39457E"; ext=@("pl","pm","t") }
    @{ name="dart";       display="Dart";          version="3.5";    category="emerging";      color="#0175C2"; ext=@("dart") }
    @{ name="zig";        display="Zig";           version="0.13";   category="emerging";      color="#F7A41D"; ext=@("zig") }
    @{ name="nim";        display="Nim";           version="2.0";    category="emerging";      color="#FFE953"; ext=@("nim","nims") }
    @{ name="bash";       display="Bash";          version="5.2";    category="scripting";     color="#4EAA25"; ext=@("sh","bash") }
)

foreach ($lang in $languages) {
    $dir = "c:\Users\kesi\Downloads\POLYCORE NEXUS\runtimes\$($lang.name)"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    $meta = @{
        name            = $lang.name
        displayName     = $lang.display
        version         = $lang.version
        category        = $lang.category
        color           = $lang.color
        fileExtensions  = $lang.ext
        isActive        = $true
        isExperimental  = $false
        supportsMetrics = $true
        description     = "PolyCore Nexus runner for $($lang.display) $($lang.version)"
        runnerImage     = "polycore-runner-$($lang.name):latest"
    }

    $meta | ConvertTo-Json -Depth 5 | Set-Content "$dir\metadata.json"
    Write-Host "Created $($lang.name) metadata"
}

Write-Host "`nAll $($languages.Count) language runtime metadata files created."
