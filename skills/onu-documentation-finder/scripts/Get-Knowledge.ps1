[CmdletBinding()]
param(
    [string]$ProjectRoot = (Get-Location).Path,
    [string[]]$Root,
    [ValidateSet('json', 'object')][string]$Format = 'json'
)

. (Join-Path $PSScriptRoot 'KnowledgeDiscovery.ps1')

$catalog = Get-KnowledgeCatalog -ProjectRoot $ProjectRoot -Root $Root

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject @($catalog) -Depth 8
}
else {
    $catalog
}
