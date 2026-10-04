# Privacy and Sanitization Firewall

The article may be inspired by private project work, but the publication must be reconstructable from public technical knowledge plus a synthetic scenario.

## Principle

**Publish the lesson, not the evidence trail.**

A reader should learn *what kind of engineering issue exists and how to reason about it* without being able to identify the company, client, repository, feature, incident, architecture, or source implementation that produced the lesson.

## Red: never publish

- source-project code, even with simple renaming
- internal or customer identifiers
- repository/solution/project/module names
- real class, method, namespace, database, table, queue, topic, endpoint, feature, or environment names
- internal hosts, URLs, domains, IP addresses, ports, paths, tenant/account IDs
- keys, tokens, secrets, certificates, headers, connection strings
- ticket, incident, PR, branch, commit, or build identifiers
- logs, stack traces, config, payloads, prompts, queries, schemas, or private diagrams
- customer/business rules that are not public
- exact private metrics, SLAs, thresholds, costs, row counts, traffic, or operational dates
- organization-specific security controls or known weaknesses

## Amber: generalize aggressively

These facts may be safe individually but dangerous in combination:

- cloud/provider choice
- exact framework versions
- uncommon library combinations
- unusual deployment topology
- exact number of services or databases
- precise sequence of an incident
- distinctive feature behavior
- team size or geography
- rare failure conditions
- performance measurements

Use only when technically necessary and publicly non-sensitive. Prefer generic wording.

## Green: generally publishable after verification

- public language/framework behavior
- public APIs and documented features
- common design patterns
- general testing/CI/CD principles
- generic failure modes
- synthetic code and data written from scratch
- public release notes/specifications/documentation
- broadly known engineering trade-offs

## Clean-room example method

Do not “sanitize” by search-and-replace. Reconstruct.

### Step 1: Abstract the mechanism

Write one sentence with no project nouns.

Example:

> A component assumed that a resource path was relative to the process working directory, while the deployment environment used a different working directory.

### Step 2: Remove source shape

Discard:

- original class boundaries
- original method signatures
- original variable names
- original exception handling structure
- original data model
- original folder layout

### Step 3: Pick a neutral domain

Examples:

- configuration loader
- document import
- notification routing
- product catalog
- image processing
- subscription status
- report generation

Avoid a domain that is too close to the private project.

### Step 4: Rebuild the minimum example

Use the smallest public-code example that reproduces the concept. Prefer 10–25 lines over a production-style implementation.

### Step 5: Alter more than names

At least four of these should differ from the source:

- domain
- data model
- method shape
- control flow
- file organization
- values
- error behavior
- dependencies
- persistence model
- naming

### Step 6: Break inferential links

Ask:

> If a coworker read this article, could they confidently identify the project, incident, feature, or implementation?

If yes, abstract further.

## Quantitative data

When a number is important to the lesson:

- prefer qualitative language: “noticeably,” “several times,” “a meaningful drop”
- or use a clearly illustrative number not derived from the project
- or use a broad range/rounded value only if it cannot identify the source

Never fabricate a private result and present it as measured fact. If a number is illustrative, say so.

## Code rule

**No transformed project code.**

The public snippet should be written as if the author knew only the general technical lesson and public APIs.

If the concept cannot be shown without reproducing project-specific structure, explain it in prose or a simple abstract diagram instead.

## Reference rule

Do not cite the project, ticket, repository, internal documentation, screenshots, private chats, or private logs.

Use public documentation to support public claims.
