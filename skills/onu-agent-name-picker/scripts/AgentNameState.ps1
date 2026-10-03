Set-StrictMode -Version Latest

# Shared state helpers for agent-name persistence.
#   Session state : .tmp/agent-names/sessions/<session-id>.json   (origin lock + assignments)
#   Active registry: .tmp/agent-names/active.json                  (names currently in use by active agents)

function Get-AgentNameStateDir {
    param([string]$ProjectRoot = (Get-Location).Path)
    return (Join-Path $ProjectRoot '.tmp/agent-names')
}

function Get-AgentSessionPath {
    param([string]$ProjectRoot, [string]$SessionId)
    return (Join-Path (Get-AgentNameStateDir -ProjectRoot $ProjectRoot) "sessions/$SessionId.json")
}

function Get-AgentActivePath {
    param([string]$ProjectRoot)
    return (Join-Path (Get-AgentNameStateDir -ProjectRoot $ProjectRoot) 'active.json')
}

function Get-AgentSessionState {
    param([string]$ProjectRoot, [string]$SessionId)
    $p = Get-AgentSessionPath -ProjectRoot $ProjectRoot -SessionId $SessionId
    if (-not (Test-Path -LiteralPath $p)) { return $null }
    return (Get-Content -LiteralPath $p -Raw | ConvertFrom-Json)
}

function Save-AgentSessionState {
    param([string]$ProjectRoot, [string]$SessionId, $State)
    $p = Get-AgentSessionPath -ProjectRoot $ProjectRoot -SessionId $SessionId
    New-Item -ItemType Directory -Force -Path (Split-Path $p) | Out-Null
    ConvertTo-Json -InputObject $State -Depth 8 | Set-Content -LiteralPath $p -Encoding utf8
}

function Get-AgentActiveRegistry {
    param([string]$ProjectRoot)
    $p = Get-AgentActivePath -ProjectRoot $ProjectRoot
    if (-not (Test-Path -LiteralPath $p)) { return @() }
    return @(Get-Content -LiteralPath $p -Raw | ConvertFrom-Json)
}

function Save-AgentActiveRegistry {
    param([string]$ProjectRoot, $Registry)
    $p = Get-AgentActivePath -ProjectRoot $ProjectRoot
    New-Item -ItemType Directory -Force -Path (Split-Path $p) | Out-Null
    ConvertTo-Json -InputObject @($Registry) -Depth 8 | Set-Content -LiteralPath $p -Encoding utf8
}

function Get-AgentActiveNames {
    param([string]$ProjectRoot)
    return @(Get-AgentActiveRegistry -ProjectRoot $ProjectRoot | ForEach-Object { $_.name })
}
