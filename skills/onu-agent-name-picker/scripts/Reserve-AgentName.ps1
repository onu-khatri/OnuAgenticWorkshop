[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$SessionId,
    [string]$Role = 'agent',
    [string]$AgentId,
    [string]$ProjectRoot = (Get-Location).Path,
    [ValidateSet('json', 'object')][string]$Format = 'json'
)

. (Join-Path $PSScriptRoot 'AgentNameCatalog.ps1')
. (Join-Path $PSScriptRoot 'AgentNameState.ps1')

$entry = Get-AgentNameByName -Name $Name
if (-not $entry) {
    Write-Error "Name '$Name' was not found in the catalog."
    exit 2
}

$activeRegistry = Get-AgentActiveRegistry -ProjectRoot $ProjectRoot
$activeNames = @($activeRegistry | ForEach-Object { $_.name })
if ($activeNames -contains $Name) {
    Write-Error "Name '$Name' is already in use by an active agent. Choose another name."
    exit 3
}

$session = Get-AgentSessionState -ProjectRoot $ProjectRoot -SessionId $SessionId
if ($session -and $session.origin -and $session.origin -ne $entry.origin) {
    Write-Error "Session '$SessionId' is locked to origin '$($session.origin)', but '$Name' belongs to '$($entry.origin)'. Pick a name from '$($session.origin)'."
    exit 4
}

# Update session state (origin locks on first reservation).
$assignments = @()
if ($session) { $assignments = @($session.assignments) }
$assignments += [pscustomobject]@{
    role       = $Role
    name       = $Name
    agentId    = $AgentId
    assignedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
}

$newSession = [pscustomobject]@{
    sessionId   = $SessionId
    origin      = if ($session -and $session.origin) { $session.origin } else { $entry.origin }
    assignments = $assignments
}
Save-AgentSessionState -ProjectRoot $ProjectRoot -SessionId $SessionId -State $newSession

# Mark the name active (reserved) in the global registry.
$activeRegistry += [pscustomobject]@{
    name       = $Name
    origin     = $entry.origin
    role       = $Role
    agentId    = $AgentId
    sessionId  = $SessionId
    assignedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
}
Save-AgentActiveRegistry -ProjectRoot $ProjectRoot -Registry $activeRegistry

$result = [pscustomobject][ordered]@{
    name         = $entry.name
    origin       = $entry.origin
    category     = $entry.category
    era          = $entry.era
    introduction = $entry.introduction
    strengths    = $entry.strengths
    weakness     = $entry.weakness
    persona      = $entry.persona
    aura         = $entry.aura
    reserved     = $true
}

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject $result -Depth 6
}
else {
    $result
}
