[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Query,
    [string]$ProjectRoot = (Get-Location).Path,
    [string[]]$Root,
    [ValidateSet('json', 'object')][string]$Format = 'json',
    [int]$Limit = 20
)

. (Join-Path $PSScriptRoot 'KnowledgeDiscovery.ps1')

$terms = @($Query.ToLowerInvariant() -split '\s+' | Where-Object { $_ })
$catalog = Get-KnowledgeCatalog -ProjectRoot $ProjectRoot -Root $Root
$q = $Query.ToLowerInvariant()

$matches = foreach ($item in $catalog) {
    $title = [string]$item.title
    $intent = [string]$item.intent
    $scope = [string]$item.scope
    $audience = [string]$item.audience
    $filename = [string]$item.filename

    $titleLower = $title.ToLowerInvariant()
    $intentLower = $intent.ToLowerInvariant()
    $scopeLower = $scope.ToLowerInvariant()
    $audienceLower = $audience.ToLowerInvariant()
    $filenameLower = $filename.ToLowerInvariant()

    $score = 0
    if ($titleLower -eq $q) { $score += 200 }
    elseif ($titleLower.Contains($q)) { $score += 100 }

    foreach ($term in $terms) {
        if ($titleLower -eq $term) { $score += 50 }
        elseif ($titleLower.Contains($term)) { $score += 25 }
        if ($intentLower.Contains($term)) { $score += 15 }
        if ($scopeLower.Contains($term)) { $score += 15 }
        if ($audienceLower.Contains($term)) { $score += 8 }
        if ($filenameLower.Contains($term)) { $score += 8 }
    }

    if ($score -gt 0) {
        [pscustomobject][ordered]@{
            title         = $item.title
            kind          = $item.kind
            filename      = $item.filename
            path          = $item.path
            scope         = $item.scope
            audience      = $item.audience
            last_reviewed = $item.last_reviewed
            score         = $score
        }
    }
}

$matches = @($matches | Sort-Object @{ Expression = 'score'; Descending = $true }, @{ Expression = 'title'; Descending = $false } | Select-Object -First $Limit)

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject @($matches) -Depth 8
}
else {
    $matches
}
