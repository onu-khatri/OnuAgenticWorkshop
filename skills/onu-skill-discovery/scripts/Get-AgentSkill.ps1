[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Name,
    [ValidateSet('any', 'codex', 'github', 'opencode')][string]$Client = 'any',
    [ValidateSet('all', 'project', 'user', 'repository')][string]$Scope = 'all',
    [string]$ProjectRoot = (Get-Location).Path,
    [string[]]$Root,
    [ValidateSet('json', 'object', 'content', 'path')][string]$Format = 'json',
    [switch]$First
)

. (Join-Path $PSScriptRoot 'SkillDiscovery.ps1')

$catalog = Get-AgentSkillCatalog -Client $Client -Scope $Scope -ProjectRoot $ProjectRoot -Root $Root
$matches = @($catalog | Where-Object { $_.name -eq $Name } | Sort-Object priority, location)

if ($matches.Count -eq 0) {
    Write-Error "Skill '$Name' was not found. Run scripts/Get-AgentSkills.ps1 or scripts/Find-AgentSkill.ps1 first."
    exit 2
}

if ($First) {
    $matches = @($matches[0])
}

if ($Format -eq 'path') {
    $matches | ForEach-Object { $_.location }
    exit 0
}

if ($Format -eq 'content') {
    if ($matches.Count -gt 1 -and -not $First) {
        Write-Error "Skill '$Name' exists in multiple roots. Re-run with -Client/-Scope/-Root to disambiguate, or pass -First."
        $matches | ForEach-Object { Write-Error "Candidate: $($_.location)" }
        exit 3
    }
    Get-Content -LiteralPath $matches[0].location -Raw
    exit 0
}

$result = foreach ($skill in $matches) {
    $content = Get-Content -LiteralPath $skill.location -Raw
    [pscustomobject][ordered]@{
        name = $skill.name
        description = $skill.description
        location = $skill.location
        skillPath = $skill.skillPath
        scope = $skill.scope
        provider = $skill.provider
        content = $content
    }
}

if ($Format -eq 'json') {
    ConvertTo-Json -InputObject @($result) -Depth 8
}
else {
    $result
}
