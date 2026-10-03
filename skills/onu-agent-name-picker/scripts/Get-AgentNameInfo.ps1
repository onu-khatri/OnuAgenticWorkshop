[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Name,
    [ValidateSet('json', 'object', 'text')][string]$Format = 'json'
)

. (Join-Path $PSScriptRoot 'AgentNameCatalog.ps1')

$catalog = Get-AgentNameCatalog
$match = @($catalog | Where-Object { $_.name -eq $Name })

if ($match.Count -eq 0) {
    Write-Error "Name '$Name' was not found in the catalog. Run Select-AgentName.ps1 or list origins with Get-AgentNameOrigins."
    exit 2
}

$m = $match[0]

if ($Format -eq 'text') {
    $strengths = ($m.strengths -join ', ')
    $weakness = ($m.weakness -join ', ')
    "Name: $($m.name)"
    "Origin: $($m.origin) | Category: $($m.category) | Era: $($m.era)"
    "Introduction: $($m.introduction)"
    "Strengths: $strengths"
    "Weakness: $weakness"
    "Persona: $($m.persona)"
    "Aura: $($m.aura)"
    exit 0
}

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject $m -Depth 6
}
else {
    $m
}
