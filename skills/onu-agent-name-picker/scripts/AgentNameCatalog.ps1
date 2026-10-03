Set-StrictMode -Version Latest

# Loads the agent name catalog from AgentNameCatalog.json (same directory).
# Data lives in JSON so it can be extended without touching code.

$script:NameCatalog = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'AgentNameCatalog.json') -Raw -ErrorAction Stop | ConvertFrom-Json

function Get-AgentNameCatalog {
    return ,@($script:NameCatalog)
}

function Get-AgentNameOrigins {
    return ,@($script:NameCatalog | Select-Object -ExpandProperty origin -Unique | Sort-Object)
}

function Get-AgentNameByName {
    param([Parameter(Mandatory = $true)][string]$Name)

    $match = @($script:NameCatalog | Where-Object { $_.name -eq $Name })
    if ($match.Count -eq 0) { return $null }
    return $match[0]
}
