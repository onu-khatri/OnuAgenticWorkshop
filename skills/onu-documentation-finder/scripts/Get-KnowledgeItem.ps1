[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$ProjectRoot = (Get-Location).Path,
    [string[]]$Root,
    [ValidateSet('json', 'object', 'content', 'path')][string]$Format = 'json',
    [switch]$First
)

. (Join-Path $PSScriptRoot 'KnowledgeDiscovery.ps1')

$catalog = Get-KnowledgeCatalog -ProjectRoot $ProjectRoot -Root $Root
$nameLower = $Name.ToLowerInvariant()

$matches = @($catalog | Where-Object {
    ([string]$_.title).ToLowerInvariant() -eq $nameLower -or
    ([string]$_.filename).ToLowerInvariant() -eq $nameLower -or
    ([string]$_.kind).ToLowerInvariant() -eq $nameLower
})

if ($matches.Count -eq 0) {
    Write-Error "Knowledge artifact '$Name' was not found. Run scripts/Get-Knowledge.ps1 or scripts/Find-Knowledge.ps1 first."
    exit 2
}

if ($First) {
    $matches = @($matches[0])
}

if ($Format -eq 'path') {
    $matches | ForEach-Object { $_.path }
    exit 0
}

if ($Format -eq 'content') {
    if ($matches.Count -gt 1 -and -not $First) {
        Write-Error "Knowledge artifact '$Name' matches multiple entries. Re-run with -Root/-ProjectRoot to disambiguate, or pass -First."
        $matches | ForEach-Object { Write-Error "Candidate: $($_.path)" }
        exit 3
    }
    Get-Content -LiteralPath $matches[0].path -Raw
    exit 0
}

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject @($matches) -Depth 8
}
else {
    $matches
}
