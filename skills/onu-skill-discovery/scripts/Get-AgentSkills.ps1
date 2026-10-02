[CmdletBinding()]
param(
    [ValidateSet('any', 'codex', 'github', 'opencode')][string]$Client = 'any',
    [ValidateSet('all', 'project', 'user', 'repository')][string]$Scope = 'all',
    [string]$ProjectRoot = (Get-Location).Path,
    [string[]]$Root,
    [ValidateSet('json', 'object')][string]$Format = 'json',
    [switch]$IncludeInvalid
)

. (Join-Path $PSScriptRoot 'SkillDiscovery.ps1')

$catalog = Get-AgentSkillCatalog -Client $Client -Scope $Scope -ProjectRoot $ProjectRoot -Root $Root -IncludeInvalid:$IncludeInvalid

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject @($catalog) -Depth 8
}
else {
    $catalog
}
