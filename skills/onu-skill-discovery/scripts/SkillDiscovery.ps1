Set-StrictMode -Version Latest

function Resolve-NormalizedPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    try {
        return [System.IO.Path]::GetFullPath($Path)
    }
    catch {
        return $Path
    }
}

function Get-SkillFrontmatter {
    param([Parameter(Mandatory = $true)][string]$ManifestPath)

    $result = [ordered]@{
        Name = $null
        Description = $null
        Valid = $false
        Errors = @()
    }

    if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) {
        $result.Errors = @("SKILL.md not found")
        return [pscustomobject]$result
    }

    try {
        $text = Get-Content -LiteralPath $ManifestPath -Raw -ErrorAction Stop
    }
    catch {
        $result.Errors = @("Could not read SKILL.md: $($_.Exception.Message)")
        return [pscustomobject]$result
    }

    $normalized = $text -replace "`r`n", "`n"
    if (-not $normalized.StartsWith("---`n")) {
        $result.Errors = @("SKILL.md is missing YAML frontmatter")
        return [pscustomobject]$result
    }

    $endIndex = $normalized.IndexOf("`n---`n", 4)
    if ($endIndex -lt 0) {
        if ($normalized.EndsWith("`n---")) {
            $endIndex = $normalized.Length - 4
        }
        else {
            $result.Errors = @("SKILL.md frontmatter is not terminated")
            return [pscustomobject]$result
        }
    }

    $block = $normalized.Substring(4, $endIndex - 4)
    $lines = $block -split "`n"
    $values = @{}

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -notmatch '^(?<key>[A-Za-z0-9_-]+):\s*(?<value>.*)$') {
            continue
        }

        $key = $Matches['key']
        $value = $Matches['value'].Trim()

        if ($value -match '^[>|][+-]?$') {
            $parts = New-Object System.Collections.Generic.List[string]
            for ($j = $i + 1; $j -lt $lines.Count; $j++) {
                $next = $lines[$j]
                if ($next -match '^\s+') {
                    $parts.Add($next.Trim())
                    $i = $j
                    continue
                }
                if ([string]::IsNullOrWhiteSpace($next)) {
                    $parts.Add('')
                    $i = $j
                    continue
                }
                break
            }
            $value = ($parts -join ' ').Trim()
        }

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            if ($value.Length -ge 2) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }
        $values[$key.ToLowerInvariant()] = $value
    }

    $result.Name = $values['name']
    $result.Description = $values['description']

    $errors = New-Object System.Collections.Generic.List[string]
    if ([string]::IsNullOrWhiteSpace($result.Name)) { $errors.Add("Missing frontmatter field 'name'") }
    if ([string]::IsNullOrWhiteSpace($result.Description)) { $errors.Add("Missing frontmatter field 'description'") }

    $result.Errors = $errors.ToArray()
    $result.Valid = $errors.Count -eq 0
    return [pscustomobject]$result
}

function Get-AgentSkillRoots {
    param(
        [ValidateSet('any', 'codex', 'github', 'opencode')][string]$Client = 'any',
        [ValidateSet('all', 'project', 'user', 'repository')][string]$Scope = 'all',
        [string]$ProjectRoot = (Get-Location).Path,
        [string[]]$Root
    )

    $roots = New-Object System.Collections.Generic.List[object]

    if ($Root -and $Root.Count -gt 0) {
        $priority = 0
        foreach ($customRoot in $Root) {
            $roots.Add([pscustomobject]@{
                Path = Resolve-NormalizedPath $customRoot
                Scope = 'custom'
                Provider = 'custom'
                Priority = $priority
            })
            $priority++
        }
        return $roots.ToArray()
    }

    $project = Resolve-NormalizedPath $ProjectRoot
    $userHome = [Environment]::GetFolderPath('UserProfile')
    if ([string]::IsNullOrWhiteSpace($userHome)) { $userHome = $HOME }

    $includeProject = $Scope -in @('all', 'project')
    $includeUser = $Scope -in @('all', 'user')
    $includeRepository = $Scope -in @('all', 'repository')

    if ($includeRepository) {
        $repoSkills = Join-Path $project 'skills'
        if (Test-Path -LiteralPath $repoSkills -PathType Container) {
            $roots.Add([pscustomobject]@{ Path = $repoSkills; Scope = 'repository'; Provider = 'source'; Priority = 5 })
        }
    }

    if ($includeProject) {
        if ($Client -in @('any', 'codex', 'github', 'opencode')) {
            $roots.Add([pscustomobject]@{ Path = (Join-Path $project '.agents/skills'); Scope = 'project'; Provider = 'shared'; Priority = 10 })
        }
        if ($Client -in @('any', 'github')) {
            $roots.Add([pscustomobject]@{ Path = (Join-Path $project '.github/skills'); Scope = 'project'; Provider = 'github'; Priority = 11 })
        }
        if ($Client -in @('any', 'opencode')) {
            $roots.Add([pscustomobject]@{ Path = (Join-Path $project '.opencode/skills'); Scope = 'project'; Provider = 'opencode'; Priority = 12 })
        }
    }

    if ($includeUser) {
        if ($Client -in @('any', 'codex', 'github', 'opencode')) {
            $roots.Add([pscustomobject]@{ Path = (Join-Path $userHome '.agents/skills'); Scope = 'user'; Provider = 'shared'; Priority = 20 })
        }
        if ($Client -in @('any', 'github')) {
            $copilotHome = if ($env:COPILOT_HOME) { $env:COPILOT_HOME } else { Join-Path $userHome '.copilot' }
            $roots.Add([pscustomobject]@{ Path = (Join-Path $copilotHome 'skills'); Scope = 'user'; Provider = 'github'; Priority = 21 })
        }
        if ($Client -in @('any', 'opencode')) {
            $configHome = if ($env:XDG_CONFIG_HOME) { $env:XDG_CONFIG_HOME } else { Join-Path $userHome '.config' }
            $roots.Add([pscustomobject]@{ Path = (Join-Path $configHome 'opencode/skills'); Scope = 'user'; Provider = 'opencode'; Priority = 22 })
        }
    }

    $seen = @{}
    $deduped = New-Object System.Collections.Generic.List[object]
    foreach ($entry in ($roots | Sort-Object Priority)) {
        $normalized = Resolve-NormalizedPath $entry.Path
        $key = if ($IsWindows) { $normalized.ToLowerInvariant() } else { $normalized }
        if (-not $seen.ContainsKey($key)) {
            $seen[$key] = $true
            $deduped.Add([pscustomobject]@{
                Path = $normalized
                Scope = $entry.Scope
                Provider = $entry.Provider
                Priority = $entry.Priority
            })
        }
    }
    return $deduped.ToArray()
}

function Get-AgentSkillCatalog {
    param(
        [ValidateSet('any', 'codex', 'github', 'opencode')][string]$Client = 'any',
        [ValidateSet('all', 'project', 'user', 'repository')][string]$Scope = 'all',
        [string]$ProjectRoot = (Get-Location).Path,
        [string[]]$Root,
        [switch]$IncludeInvalid
    )

    $items = New-Object System.Collections.Generic.List[object]
    $roots = Get-AgentSkillRoots -Client $Client -Scope $Scope -ProjectRoot $ProjectRoot -Root $Root

    foreach ($rootEntry in $roots) {
        if (-not (Test-Path -LiteralPath $rootEntry.Path -PathType Container)) { continue }

        $skillDirs = Get-ChildItem -LiteralPath $rootEntry.Path -Directory -ErrorAction SilentlyContinue | Sort-Object Name
        foreach ($skillDir in $skillDirs) {
            $manifestPath = Join-Path $skillDir.FullName 'SKILL.md'
            if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { continue }

            $metadata = Get-SkillFrontmatter -ManifestPath $manifestPath
            if (-not $metadata.Valid -and -not $IncludeInvalid) { continue }

            $items.Add([pscustomobject][ordered]@{
                name = if ($metadata.Name) { $metadata.Name } else { $skillDir.Name }
                description = $metadata.Description
                location = $manifestPath
                skillPath = $skillDir.FullName
                scope = $rootEntry.Scope
                provider = $rootEntry.Provider
                priority = $rootEntry.Priority
                valid = [bool]$metadata.Valid
                errors = @($metadata.Errors)
            })
        }
    }

    return @($items | Sort-Object priority, name, location)
}

function Convert-AgentSkillOutput {
    param(
        [Parameter(ValueFromPipeline = $true)]$InputObject,
        [ValidateSet('json', 'object')][string]$Format = 'json'
    )
    begin { $buffer = New-Object System.Collections.Generic.List[object] }
    process { $buffer.Add($InputObject) }
    end {
        if ($Format -eq 'json') {
            $buffer.ToArray() | ConvertTo-Json -Depth 8
        }
        else {
            $buffer.ToArray()
        }
    }
}
