[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$ProjectRoot = (Get-Location).Path,
    [ValidateSet('json', 'object')][string]$Format = 'json'
)

. (Join-Path $PSScriptRoot 'AgentNameState.ps1')

$registry = Get-AgentActiveRegistry -ProjectRoot $ProjectRoot
$before = @($registry).Count
$newRegistry = @($registry | Where-Object { $_.name -ne $Name })
$released = $before - @($newRegistry).Count

Save-AgentActiveRegistry -ProjectRoot $ProjectRoot -Registry $newRegistry

$result = [pscustomobject]@{
    name     = $Name
    released = ($released -gt 0)
}

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject $result -Depth 4
}
else {
    $result
}
