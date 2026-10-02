---
name: onu-content-seo
description: "Write SEO-optimized content for the target project public pages: landing, marketing, public content discovery, and help documentation. Use when creating content that needs search visibility."
---

# SEO Content Writer

Use this skill to write public-facing content for the target project that ranks and converts, grounded in the actual product features and target audience.

## Use this skill when

- writing or refreshing the public landing page or marketing site
- composing help articles, blog posts, or release notes
- optimizing public content-discovery metadata (see the relevant story)
- creating content that must compete for search intent

## Do not use this skill when

- the content is internal-only documentation or ADRs
- the primary goal is technical accuracy for developers (use `onu-documentation-generation`)

## Content workflow

1. Identify the target keyword and search intent.
2. Craft a compelling title (50-60 chars) and meta description (150-160 chars) that include the keyword.
3. Structure the page with a single `h1`, logical `h2`/`h3` hierarchy, and short paragraphs.
4. Include internal links to related pages and a clear call to action.
5. Optimize images with descriptive `alt` text and compressed formats.
6. Prefer nouns and action verbs; avoid jargon and filler.

## Target project domain

- Audience: the product's target audience (from the PRD and marketing).
- Core keywords: the product's primary and secondary keywords (from the PRD and marketing).
- Feature pages to optimize: the product's public feature, template, pricing, and help pages.
- Public content-discovery pages should use schema markup for rich snippets.

## On-page checklist

- [ ] Title tag is unique and includes the primary keyword.
- [ ] Meta description is compelling and under 160 characters.
- [ ] Headings form a clear hierarchy and include related terms naturally.
- [ ] Content is unique, substantive (300+ words for articles), and answers the search intent.
- [ ] Images have descriptive `alt` text.
- [ ] Internal links connect related content.
- [ ] No duplicate or thin pages competing for the same keyword.

## Definition of Done

- The page or article targets a specific keyword with unique content.
- SEO metadata and schema are in place.
- Content is aligned with actual product features, not generic claims.
