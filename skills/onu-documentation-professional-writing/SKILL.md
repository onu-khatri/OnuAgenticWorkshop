---
name: onu-documentation-professional-writing
description: Turn real software-project learnings into professional ~5-minute Medium articles in a practical, example-driven style while preventing leakage of proprietary project code, identifiers, architecture, or business context.
---

# Real Project Medium Writer

Use this skill when the author wants to turn something learned while building, debugging, reviewing, testing, operating, or improving a software project into a public Medium article.

The goal is **knowledge transfer, not project disclosure**. Learn from the real work, then rebuild the explanation from public knowledge and synthetic examples.

## Default output

Produce a publish-ready Medium draft with:

- 3 title options, with the strongest first
- optional one-line subtitle
- ~850–1,100 words of article body (roughly a 5-minute read; use judgment when code/diagrams add reading time)
- short paragraphs and descriptive headings
- 1–2 small synthetic examples when useful
- 1–3 memorable principle callouts or contrast statements
- a concise final takeaway
- 2–5 public references, preferring official documentation
- 5 suggested Medium tags (for search reach, align title, keywords, and tags with `$onu-content-seo`)
- optional `Happy Coding :-)` only when it fits naturally

Do not expose the private analysis, source-project details, or the confidential-to-public mapping used to sanitize the article.

## Author voice

Write as an experienced engineer sharing something useful that came from real work, not as a textbook, marketing post, or generic tutorial.

The author's recurring voice is:

- practical and grounded in real engineering situations
- first-person when a real incident or learning triggered the topic
- plain-English before formal terminology
- example-driven: explain the concept, then make it concrete
- comfortable challenging an oversimplification: “X is useful, but X is not the same as Y”
- focused on engineering judgment, trade-offs, maintainability, correctness, and production behavior
- concise at paragraph level, with scannable headings and lists
- willing to use a small analogy when it makes a concept memorable
- inclined to end with the larger engineering principle rather than only the local fix

Avoid imitating grammar mistakes or awkward phrasing from older posts. Preserve the author's **thinking style and cadence**, while improving polish and clarity.

Read `references/style-profile.md` before drafting.

## Core workflow

### 1. Mine the project for a public lesson

Use project material only to answer these private questions:

1. What surprised us?
2. What failed, was misunderstood, or became expensive?
3. What was the immediate fix?
4. What deeper engineering principle did the work reveal?
5. What would another engineer benefit from knowing before hitting the same class of problem?
6. Which parts are general technical knowledge versus project-specific implementation?

Prefer lessons that travel across projects: failure modes, design principles, testing strategy, architectural boundaries, tool behavior, performance reasoning, AI-assisted engineering, CI/CD, observability, maintainability, or debugging methods.

If the only interesting content is proprietary business logic, do not write the article from it. Find a more general engineering principle or stop.

### 2. Build an internal insight ledger

Before writing prose, privately reduce the project work to this abstraction:

- **Trigger:** what kind of engineering situation exposed the lesson?
- **Symptom:** what observable behavior made the issue visible?
- **Naive interpretation:** what would someone reasonably assume at first?
- **Underlying mechanism:** what technical behavior actually mattered?
- **Decision:** what engineering choice improved the situation?
- **Trade-off:** what did the decision cost or constrain?
- **Transferable principle:** what can readers apply elsewhere?

This ledger is private and must not be included in the final article.

### 3. Apply the privacy firewall

Read `references/privacy-and-sanitization.md` and enforce it before creating examples.

**Never copy project code into the article, even after simple renaming.**

Instead, use a clean-room example process:

1. Extract the abstract mechanism in words.
2. Close the source material mentally: do not preserve line structure or implementation shape.
3. Choose a different neutral domain.
4. Rebuild the smallest example from first principles.
5. Change names, values, data shape, control flow, and surrounding architecture.
6. Keep only the concept required to teach the lesson.
7. State that examples are simplified/illustrative when appropriate.

See `references/worked-example.md` for a complete private-incident → published-article walkthrough of this method.

The article must not reveal or make it easy to infer:

- company/client/product names
- repository, solution, project, module, feature, class, method, namespace, table, queue, topic, bucket, endpoint, hostname, or environment names
- ticket/incident/PR identifiers
- internal URLs, domains, IPs, paths, account IDs, tenant IDs, GUIDs, secrets, connection strings, certificates, or tokens
- actual logs, stack traces, comments, config, schema, payloads, queries, prompts, or architecture diagrams
- exact proprietary metrics, volumes, dates, costs, SLAs, thresholds, or deployment details
- distinctive combinations of facts that could identify the project even when each fact seems harmless alone

When in doubt, generalize or omit.

### 4. Design a synthetic example

A safe example preserves the **engineering relationship**, not the implementation.

Good transformations:

- payment domain → document import, inventory, notifications, or subscription example
- real service/class names → generic `OrderValidator`, `ReportLoader`, `NotificationPolicy`
- real database tables → in-memory list or generic repository
- internal message/event flow → generic producer/consumer interaction
- exact performance numbers → qualitative or rounded illustrative values
- actual CI path → synthetic `config/sample.json`

Do not map every source object to a renamed public object. That is disguised leakage. Collapse complexity.

### 5. Verify public technical claims

Project experience can motivate an article, but published technical facts should be independently supportable.

Use the source hierarchy in `references/source-policy.md`:

1. official language/framework/tool documentation
2. specifications or vendor release notes
3. reputable primary engineering sources
4. high-quality secondary sources only when primary material is insufficient

For current products, pricing, model behavior, release features, or rapidly changing tooling, verify the current state and include the relevant version/date when material.

Never cite private project material.

### 6. Pick the article shape

Choose one of these shapes based on the lesson:

**Incident → principle**
Use for bugs, CI/CD failures, production surprises, debugging, or design improvements.

1. real-world trigger, sanitized
2. what looked wrong
3. why the obvious fix was incomplete
4. underlying mechanism
5. synthetic example
6. broader engineering win
7. takeaway

**Misconception → clearer model**
Use for coverage, async, caching, AI agents, architecture, testing, performance, etc.

1. common belief
2. why it is incomplete
3. better mental model
4. example
5. practical rules
6. limitations/trade-offs
7. takeaway

**Concept → analogy → practical use**
Use for language/framework concepts.

1. personal or practical hook
2. TL;DR when helpful
3. memorable analogy
4. minimal technical model
5. small synthetic example
6. real-world use cases
7. gotcha or boundary
8. wrap-up

**Tool capability → engineering discipline**
Use for Copilot/AI/dev tooling.

1. what changed
2. why the old mental model no longer works
3. new cost/risk/quality equation
4. developer practices
5. team/system practices
6. common mistakes
7. checklist or operating principle
8. future-facing conclusion

Start from `templates/5-minute-article.md` when no stronger structure is obvious.

### 7. Draft for a five-minute read

Target **850–1,100 words** by default. Code blocks, tables, and diagrams increase reading time, so shorten surrounding prose when they are present.

Use these pacing rules:

- hook: 70–130 words
- context/problem: 120–180 words
- core explanation: 300–450 words
- synthetic example: 150–250 words
- practical guidance/trade-offs: 150–250 words
- conclusion: 70–130 words

Prefer 5–8 meaningful headings instead of many tiny sections.

### 8. Use the author's rhetorical patterns deliberately

Useful patterns include:

- **Contrast:** `Passing tests != proving the requirement.`
- **Reframe:** `The bug was small. The design lesson was bigger.`
- **Question shift:** move from “Does this compile?” to “What behavior changed?”
- **Rule of thumb:** one crisp operational guideline after explanation
- **Mini flow:** simple text arrows for data or decision flow when it genuinely helps
- **Practical takeaway:** summarize what the reader should change tomorrow

Do not force all of them into every article.

### 9. Keep code intentionally synthetic

Code is optional. Use it only when it teaches faster than prose.

When code is useful:

- write it from scratch
- keep it minimal and self-contained
- use public APIs and generic names
- avoid exact project folder layouts and architecture
- include comments such as `// simplified example` when readers might mistake it for production code
- prefer one focused snippet over a full implementation

Do not publish source-derived code, even if it has been reformatted, shortened, or renamed.

### 10. Finish with evidence and judgment

The conclusion should elevate the article from “here is a fix” to “here is the engineering principle.”

Good ending pattern:

- acknowledge the simple/local solution
- explain the larger lesson
- give one memorable principle the reader can carry to another project

Optional closing: `Happy Coding :-)`

## Quality gate

Before returning the article, check all of the following:

- The article teaches a general lesson that is useful outside the source project.
- No code or prose is copied from the project.
- Synthetic examples differ materially from source implementation and business context.
- No confidential identifier, internal URL, real schema, private metric, or distinctive architecture detail appears.
- Technical claims are supported by public references where appropriate.
- The title promises the actual lesson rather than clickbait.
- The opening establishes practical relevance within the first 120 words.
- The explanation uses plain English before unnecessary jargon.
- The article contains at least one concrete example or scenario.
- Trade-offs or limits are acknowledged when they matter.
- The conclusion states the larger engineering principle.
- The body is approximately a five-minute read.
- Grammar is polished without erasing the author's practical voice.

When files are available, run `scripts/article_lint.py` on the final Markdown and fix high-confidence privacy flags before delivery.

## Final-output format

Return only public-safe content:

1. title options
2. subtitle if useful
3. complete Medium article
4. references
5. suggested tags

Do **not** include the private insight ledger, sanitization mapping, raw project excerpts, or a list of confidential details you detected.
