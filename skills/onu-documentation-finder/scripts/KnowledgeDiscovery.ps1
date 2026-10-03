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

function Resolve-KnowledgeBaseRoots {
    param(
        [string]$ProjectRoot = (Get-Location).Path,
        [string[]]$Root
    )

    if ($Root -and $Root.Count -gt 0) {
        $out = @()
        foreach ($r in $Root) {
            $p = Resolve-NormalizedPath $r
            if (Test-Path -LiteralPath $p -PathType Container) { $out += $p }
        }
        return $out
    }

    $project = Resolve-NormalizedPath $ProjectRoot
    $preferred = @('knowledge-base', 'knowledge_base')
    $fallback = @('knowledgebase', 'knowledge', 'kb')

    $result = New-Object System.Collections.Generic.List[string]
    $seen = @{}

    foreach ($names in @($preferred, $fallback)) {
        foreach ($n in $names) {
            $c = Join-Path $project $n
            if ((Test-Path -LiteralPath $c -PathType Container) -and (-not $seen.ContainsKey($c))) {
                $seen[$c] = $true
                $result.Add($c)
            }
        }
        if ($result.Count -gt 0) { break }

        foreach ($n in $names) {
            $hits = Get-ChildItem -LiteralPath $project -Directory -Filter $n -Recurse -Depth 2 -ErrorAction SilentlyContinue
            foreach ($h in $hits) {
                if (-not $seen.ContainsKey($h.FullName)) {
                    $seen[$h.FullName] = $true
                    $result.Add($h.FullName)
                }
            }
        }
        if ($result.Count -gt 0) { break }
    }

    return ,$result.ToArray()
}

function Get-KnowledgeFrontmatter {
    param([Parameter(Mandatory = $true)][string]$Path)

    $result = [ordered]@{
        Title        = $null
        Intent       = $null
        Scope        = $null
        Audience     = $null
        LastReviewed = $null
        HasFrontmatter = $false
    }

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return [pscustomobject]$result }

    $text = Get-Content -LiteralPath $Path -Raw -ErrorAction SilentlyContinue
    if (-not $text) { return [pscustomobject]$result }

    $normalized = $text -replace "`r`n", "`n"
    if (-not $normalized.StartsWith("---`n")) { return [pscustomobject]$result }

    $endIndex = $normalized.IndexOf("`n---`n", 4)
    if ($endIndex -lt 0) {
        if ($normalized.EndsWith("`n---")) { $endIndex = $normalized.Length - 4 }
        else { return [pscustomobject]$result }
    }

    $block = $normalized.Substring(4, $endIndex - 4)
    $values = @{}
    foreach ($line in ($block -split "`n")) {
        if ($line -notmatch '^(?<key>[A-Za-z0-9_-]+):\s*(?<value>.*)$') { continue }
        $key = $Matches['key']
        $value = $Matches['value'].Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            if ($value.Length -ge 2) { $value = $value.Substring(1, $value.Length - 2) }
        }
        $values[$key.ToLowerInvariant()] = $value
    }

    $result.Title = $values['title']
    $result.Intent = $values['intent']
    $result.Scope = $values['scope']
    $result.Audience = $values['audience']
    $result.LastReviewed = $values['last_reviewed']
    $result.HasFrontmatter = $true
    return [pscustomobject]$result
}

function Get-KnowledgeCatalog {
    param(
        [string]$ProjectRoot = (Get-Location).Path,
        [string[]]$Root
    )

    $items = New-Object System.Collections.Generic.List[object]
    $roots = Resolve-KnowledgeBaseRoots -ProjectRoot $ProjectRoot -Root $Root

    foreach ($kbRoot in $roots) {
        $indexPath = Join-Path $kbRoot 'index.md'
        if (Test-Path -LiteralPath $indexPath -PathType Leaf) {
            $items.Add([pscustomobject][ordered]@{
                title         = '<index>'
                kind          = 'index'
                path          = $indexPath
                knowledgeBase = $kbRoot
                filename      = 'index.md'
                intent        = $null
                scope         = $null
                audience      = $null
                last_reviewed = $null
            })
        }

        $knowledgeFiles = Get-ChildItem -LiteralPath $kbRoot -File -Filter '*.knowledge.md' -Recurse -ErrorAction SilentlyContinue
        foreach ($f in $knowledgeFiles) {
            $fm = Get-KnowledgeFrontmatter -Path $f.FullName
            $items.Add([pscustomobject][ordered]@{
                title         = if ($fm.Title) { $fm.Title } else { $f.BaseName }
                kind          = 'knowledge'
                path          = $f.FullName
                knowledgeBase = $kbRoot
                filename      = $f.Name
                intent        = $fm.Intent
                scope         = $fm.Scope
                audience      = $fm.Audience
                last_reviewed = $fm.LastReviewed
            })
        }

        $adrDir = Join-Path $kbRoot 'ADR'
        if (Test-Path -LiteralPath $adrDir -PathType Container) {
            $adrFiles = Get-ChildItem -LiteralPath $adrDir -File -Filter '*.md' -Recurse -ErrorAction SilentlyContinue
            foreach ($f in $adrFiles) {
                $fm = Get-KnowledgeFrontmatter -Path $f.FullName
                $items.Add([pscustomobject][ordered]@{
                    title         = if ($fm.Title) { $fm.Title } else { $f.BaseName }
                    kind          = 'adr'
                    path          = $f.FullName
                    knowledgeBase = $kbRoot
                    filename      = $f.Name
                    intent        = $fm.Intent
                    scope         = $fm.Scope
                    audience      = $fm.Audience
                    last_reviewed = $fm.LastReviewed
                })
            }
        }
    }

    return ,$items.ToArray()
}
