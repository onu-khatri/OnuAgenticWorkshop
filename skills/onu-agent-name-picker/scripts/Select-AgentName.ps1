[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$SessionId,
    [string]$Origin,
    [int]$Count = 5,
    [string]$ProjectRoot = (Get-Location).Path,
    [ValidateSet('json', 'object')][string]$Format = 'json'
)

. (Join-Path $PSScriptRoot 'AgentNameCatalog.ps1')
. (Join-Path $PSScriptRoot 'AgentNameState.ps1')

$catalog = Get-AgentNameCatalog
$origins = Get-AgentNameOrigins

$session = Get-AgentSessionState -ProjectRoot $ProjectRoot -SessionId $SessionId
$activeNames = Get-AgentActiveNames -ProjectRoot $ProjectRoot

# Resolve origin: session lock wins, then explicit -Origin, then random.
$lockedOrigin = if ($session) { $session.origin } else { $null }
$effectiveOrigin = $null
if ($lockedOrigin) {
    $effectiveOrigin = $lockedOrigin
    if ($Origin -and $Origin -ne $lockedOrigin) {
        Write-Warning "Session '$SessionId' is locked to origin '$lockedOrigin'; ignoring requested origin '$Origin'."
    }
}
elseif ($Origin) {
    if ($origins -notcontains $Origin) {
        Write-Error "Unknown origin '$Origin'. Valid origins: $($origins -join ', ')"
        exit 2
    }
    $effectiveOrigin = $Origin
}
else {
    $effectiveOrigin = $origins | Get-Random
}

$sessionNames = @()
if ($session) { $sessionNames = @($session.assignments | ForEach-Object { $_.name }) }

# Candidates exclude names in use by active agents and names already assigned in this session.
$pool = @($catalog | Where-Object {
    $_.origin -eq $effectiveOrigin -and
    $activeNames -notcontains $_.name -and
    $sessionNames -notcontains $_.name
})

if ($pool.Count -eq 0) {
    Write-Warning "Origin '$effectiveOrigin' has no available names (all are in use by active agents or already assigned in this session)."
    $candidates = @()
}
else {
    $candidates = @($pool | Get-Random -Count ([Math]::Min($Count, $pool.Count)))
}

$result = foreach ($c in $candidates) {
    [pscustomobject][ordered]@{
        name         = $c.name
        origin       = $c.origin
        category     = $c.category
        era          = $c.era
        introduction = $c.introduction
        strengths    = $c.strengths
        weakness     = $c.weakness
        persona      = $c.persona
        aura         = $c.aura
    }
}

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject @($result) -Depth 6
}
else {
    $result
}
