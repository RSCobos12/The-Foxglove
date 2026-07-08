# The Foxglove Project Standards

Version: 1.0

---

# Purpose

This document establishes the design, development, and quality standards for The Foxglove website.

Its purpose is to ensure every page feels like it belongs to the same experience, regardless of when it is built or who contributes to the project.

These standards take precedence over convenience. Consistency is considered part of the product.

---

# Core Philosophy

The Foxglove is not simply a website.

It is a digital extension of the tournament itself.

Every page should evoke the feeling of receiving an invitation to an exclusive private club.

The site should communicate:

- Prestige
- Brotherhood
- Tradition
- Mystery
- Luxury
- Restraint

Nothing should feel loud, trendy, or over-designed.

---

# Design Principles

When making design decisions, follow these priorities:

1. Elegance over excess.
2. Simplicity over complexity.
3. Consistency over novelty.
4. Refinement over decoration.
5. White space is intentional.
6. Typography carries the visual hierarchy.
7. Every element must have a purpose.

When choosing between two acceptable solutions, choose the quieter one.

---

# Homepage as the Benchmark

Homepage Version 1.0 is the visual benchmark for the entire website.

Every interior page should feel like a continuation of the homepage.

Shared elements should remain visually identical unless there is a compelling reason to deviate.

These include:

- Header
- Navigation
- Footer
- Color palette
- Typography
- Hover animations
- Scroll behavior
- Divider motif
- Buttons

---

# Shared Components

Whenever practical, use shared components instead of duplicate code.

Shared components currently include:

- Header
- Footer
- Navigation
- Header scroll behavior

Future shared components may include:

- Buttons
- Form controls
- Cards
- Animations
- Modals
- Member authentication

# Placeholder Content

Placeholder content exists only to validate design, layout, and functionality.

No placeholder names, scores, images, quotes, statistics, years, or event details should be treated as permanent unless explicitly approved.

Pages should be built so that placeholder content can be replaced without requiring layout changes.

The system should support future dynamic content, including:

- Winner names
- Scores
- Photos
- Videos
- Reflections
- Dinner locations
- Courses played
- RSVP details
- Member-specific information

Build the system, not the sample data.

---

# Color Standards

Primary Colors

- Foxglove Navy
- Foxglove Gold
- Cream

No additional accent colors should be introduced without approval.

---

# Typography Standards

Typography should remain restrained and editorial.

Gold text should be reserved for:

- Navigation accents
- Section labels
- Buttons
- Dividers
- Important emphasis

Body copy should generally remain cream or white.

---

# Layout Standards

Every page should contain:

1. Shared Header
2. Hero Section
3. Primary Divider
4. Main Content
5. Shared Footer

Spacing should remain generous but intentional.

Large empty areas should only exist when contributing to the emotional tone of the page.

# Decision Framework

Every decision should be evaluated in this order:

1. Does it support the project's vision?
2. Does it improve the user experience?
3. Does it maintain visual consistency?
4. Is it simple to understand and maintain?
5. Will it scale as additional pages are added?

If a proposed change fails one of these tests, reconsider the implementation before proceeding.

The objective is not to create the most complex solution.

The objective is to create the most timeless solution.

---

# Development Lifecycle

Every page follows the same lifecycle.

1. Vision
2. Story
3. Visual Mockup
4. Approval
5. Implementation
6. White Glove Review
7. Sign-Off
8. Freeze Version 1.0

No page should be considered complete before White Glove Review.

---

# Versioning

Every page progresses through the following versions.

0.1 — Initial concept

0.5 — Approved visual design

0.9 — Implementation complete

1.0 — Approved and frozen

Future updates become:

1.1
1.2
2.0

Version 1.0 should never be modified directly.

---

# White Glove Review

Every page must undergo a visual inspection before approval.

Review includes:

- Spacing
- Alignment
- Typography
- Animations
- Hover states
- Responsive layout
- Shared component consistency
- Accessibility
- Visual balance

Small refinements are encouraged.

Large redesigns after approval are discouraged.

---

# Documentation

Every completed page should include:

- Sign-Off document
- Version number
- Changelog entry

Major architectural decisions should also be documented.

---

# Long-Term Vision

The Foxglove should feel timeless.

The website should resemble the printed invitation, the tournament materials, and the overall identity of the event.

Every page should reinforce the feeling that the visitor has been invited into something exclusive, prestigious, and enduring.

---

# Final Principle

If a feature does not improve the experience,
it should not be added.

Restraint is part of the design.

# Project Partnership

The Foxglove is developed as a partnership.

Scott Cobos serves as the project's Creative Director.

ChatGPT serves as the project's Technical Director and implementation partner.

Responsibilities are intentionally divided.

Creative Director

- Defines vision
- Establishes brand identity
- Approves design
- Sets priorities
- Makes final creative decisions

Technical Director

- Recommends architecture
- Maintains consistency
- Guides implementation
- Documents standards
- Protects long-term maintainability

Neither role supersedes the other.

The strongest solutions are reached through collaboration.

Every major design or engineering decision should support the long-term vision of The Foxglove.