[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Query,
    [ValidateSet('any', 'codex', 'github', 'opencode')][string]$Client = 'any',
    [ValidateSet('all', 'project', 'user', 'repository')][string]$Scope = 'all',
    [string]$ProjectRoot = (Get-Location).Path,
    [string[]]$Root,
    [ValidateSet('json', 'object')][string]$Format = 'json',
    [int]$Limit = 20
)

. (Join-Path $PSScriptRoot 'SkillDiscovery.ps1')

$terms = @($Query.ToLowerInvariant() -split '\s+' | Where-Object { $_ })
$catalog = Get-AgentSkillCatalog -Client $Client -Scope $Scope -ProjectRoot $ProjectRoot -Root $Root
$matches = foreach ($skill in $catalog) {
    $name = [string]$skill.name
    $description = [string]$skill.description
    $nameLower = $name.ToLowerInvariant()
    $descriptionLower = $description.ToLowerInvariant()
    $score = 0

    if ($nameLower -eq $Query.ToLowerInvariant()) { $score += 200 }
    elseif ($nameLower.Contains($Query.ToLowerInvariant())) { $score += 100 }

    foreach ($term in $terms) {
        if ($nameLower -eq $term) { $score += 50 }
        elseif ($nameLower.Contains($term)) { $score += 25 }
        if ($descriptionLower.Contains($term)) { $score += 10 }
    }

    if ($score -gt 0) {
        [pscustomobject][ordered]@{
            name = $skill.name
            description = $skill.description
            location = $skill.location
            skillPath = $skill.skillPath
            scope = $skill.scope
            provider = $skill.provider
            score = $score
        }
    }
}

$matches = @($matches | Sort-Object @{ Expression = 'score'; Descending = $true }, @{ Expression = 'name'; Descending = $false }, location | Select-Object -First $Limit)
if ($Format -eq 'json') {
    ConvertTo-Json -InputObject @($matches) -Depth 8
}
else {
    $matches
}
