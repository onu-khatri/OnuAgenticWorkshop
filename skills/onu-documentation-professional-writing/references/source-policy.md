# Public Reference Policy

References strengthen the article, but they should validate the technical lesson rather than reveal where the private project work happened.

## Source hierarchy

Use sources in this order:

1. **Official documentation** for language, framework, runtime, cloud, IDE, and tooling behavior.
2. **Specifications / release notes / standards** for behavior that changes by version.
3. **Primary engineering sources** from maintainers or vendors.
4. **Strong secondary sources** only for context not adequately covered by primary material.

Avoid using another tutorial as the main authority for a claim that official docs can support.

## Good reference roots for the author's common topics

### .NET and C#

- Microsoft Learn .NET: https://learn.microsoft.com/dotnet/
- C# language reference: https://learn.microsoft.com/dotnet/csharp/language-reference/
- .NET API browser: https://learn.microsoft.com/dotnet/api/
- .NET release information: https://dotnet.microsoft.com/platform/support/policy/dotnet-core

### Testing and coverage

- `dotnet test`: https://learn.microsoft.com/dotnet/core/tools/dotnet-test
- Coverlet: https://github.com/coverlet-coverage/coverlet
- ReportGenerator: https://github.com/danielpalme/ReportGenerator

### GitHub / Copilot

- GitHub Copilot docs: https://docs.github.com/copilot
- GitHub changelog: https://github.blog/changelog/
- GitHub Actions docs: https://docs.github.com/actions

### Web / security when relevant

- OWASP: https://owasp.org/
- MDN Web Docs: https://developer.mozilla.org/

These are starting points, not a fixed bibliography. Link to the most specific page that supports the article.

## Freshness rule

For features, prices, billing, AI models, Copilot behavior, IDE capabilities, cloud services, or anything likely to change:

- verify against a current official source
- check publication/update date when visible
- state version/date in the article if it materially affects applicability
- do not reuse an old claim simply because it appeared in a previous article

## Reference count

For a five-minute article, 2–5 references is usually enough.

Prefer references that let the reader go deeper on:

- the core language/tool behavior
- one important caveat
- one official implementation/configuration detail

Do not clutter the article with links for common knowledge.

## Citation style

In Medium prose, references can appear as natural links in the relevant sentence or as a short `References` section at the end.

For the author's style, a compact end section is usually cleaner when several sources support one technical topic.
