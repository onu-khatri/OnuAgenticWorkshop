# Worked Example: private incident → published article

This walkthrough shows the full pipeline on a realistic, non-sensitive incident. It is synthetic; use it as a shape reference, not a template to copy.

## 1. The private incident (what actually happened)

A .NET service assumed a resource path was **relative to the process working directory**. It worked locally and in CI, then failed in the deployed container because the runtime set a different working directory. The immediate fix hardcoded an absolute path; the deeper fix injected a base path at the configuration boundary.

## 2. Private intake (never publish)

From `project-learning-intake.md`:

- **Trigger:** CI green, container crash on a missing resource.
- **Symptom:** `FileNotFoundException` for a bundled resource.
- **Assumption:** the path bug is a one-line config mistake.
- **Mechanism:** working-directory assumption leaked into core logic.
- **Decision:** inject the base path at the boundary, not inline.
- **Trade-off:** an explicit base path is more configuration surface.
- **Principle:** environment assumptions should not leak into core logic.

## 3. Clean-room transformation

Apply `privacy-and-sanitization.md`:

1. **Abstract the mechanism** (no project nouns):
   > A component assumed a resource path was relative to the process working directory, while the deployment environment used a different working directory.

2. **Drop source shape** — no class names, method signatures, folder layout, or exception structure.

3. **Pick a neutral domain** — "configuration loader" (not the original service).

4. **Rebuild a minimal example** from public APIs only:

   ```csharp
   // Before: relative to the process working directory
   var path = "config/appsettings.json";
   var content = File.ReadAllText(path);

   // After: resolve against an explicit base directory
   var root = configuration.GetValue<string>("App:BaseDirectory");
   var fullPath = Path.Combine(root, "config", "appsettings.json");
   var content = File.ReadAllText(fullPath);
   ```

5. **Alter more than names** — domain, data shape, control flow, values, and dependencies all differ from the source.

## 4. Published article (condensed)

**Title:** *Your Config Bug Was a Working-Directory Bug All Along*

> A path looks relative, but "relative to what?" is the whole question.

**Hook.** A service passed every test and shipped green, then crashed in the container on a file it had bundled. The fix looked like a one-liner — until it exposed a boundary that should never have been in the core logic.

**The real problem.** "Relative path" hides an assumption about *where the process runs*. Local and CI share one working directory; the container used another. The bug was never the string — it was the environment assumption living inside the component.

> A path that looks relative is really an undocumented dependency on the environment.

**The mechanism.** Plain English first: the component asked the operating system "where am I?" and trusted the answer. A formal definition only after the model is clear.

**A small example.** (the code above, with a note that it is illustrative)

**What changes in a real codebase.**
- Resolve paths against an explicit base directory, never the process working directory.
- Inject that base directory at the configuration boundary.
- Fail fast when a required path is missing rather than throwing later.
- Log the *resolved* path, not the relative string, for debuggability.

**The trade-off.** An explicit base directory is more configuration surface and more to document — a fair cost for removing a silent environment dependency.

**Final takeaway.** The next bug isn't the path; it's the assumption hiding inside a value that looks self-contained.

> An environment assumption belongs at the boundary, not in the core.

## 5. Lint and review

- `article_lint.py` — flags no secrets/URLs; read time ~4.5 min at 210 wpm.
- `article-review-checklist.md` — value (one lesson), voice (engineer, plain-first), privacy (no project nouns), evidence (public .NET docs), length (in band).

The lesson is transferable and reconstructable from public .NET knowledge; no reader can identify the source project.
