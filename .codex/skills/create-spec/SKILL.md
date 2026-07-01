---
name: create-spec
description: Create a spec for a specified feature. Use when the user wants to define or refine an implementation plan in specs/ before coding.
license: MIT
metadata:
  version: "1.0"
  generatedBy: "1.1.1"
---

# Create Spec

## Overview

Use this skill when the user wants to turn a feature idea, issue, or rough request into an implementation spec in `specs/`.

Before writing the spec, read:
- [`references/interviewing.md`](./references/interviewing.md) for the questioning workflow
- [`references/spec-output.md`](./references/spec-output.md) for output location and spec structure guidance

## When To Use

Trigger this skill for requests like:
- "create a spec"
- "write a spec for this feature"
- "turn this issue into a spec"
- "plan this feature before implementation"

If the target feature is omitted, infer it from conversation context when possible. If it is still ambiguous, inspect `specs/roadmap.md` before asking an open-ended clarification question. Propose the relevant roadmap items so the user can choose the intended feature.

## Workflow

### 1. Identify the feature boundary

Determine the feature, change, or issue the spec should cover.

When the feature is unclear:

1. Read `specs/roadmap.md` if it exists.
2. Propose its applicable `planned` items by slug and short description.
3. Ask the user to select one or clarify a different feature.
4. Do not choose a roadmap item or begin writing the spec until the user confirms the target.

Do not use the roadmap when the user or conversation already identifies a clear feature.

Anchor on:
- what is changing;
- what is explicitly in scope;
- what adjacent work should stay out of scope;
- what constraints already exist in the repo or in the conversation.

### 2. Interview the user

Use the interviewing guidance in [`references/interviewing.md`](./references/interviewing.md).

The goal is to gather the non-obvious decisions that make the spec implementable:
- behavior boundaries;
- migration expectations;
- validation requirements;
- rollout or compatibility concerns;
- design tradeoffs;
- explicit non-goals.

Continue the interview until the spec can be written without filling major gaps by assumption.

### 3. Write the spec

Use the output and structure guidance in [`references/spec-output.md`](./references/spec-output.md).

Write the smallest useful spec that gives a developer or agent a clear implementation target.

### 4. Keep the spec practical

A good spec should:
- define behavior clearly;
- separate goals from non-goals;
- describe validation expectations;
- capture integration constraints and edge cases;
- avoid unnecessary architecture churn.

## Output Expectations

A good result has these properties:
- the spec lives in `specs/`;
- implementation boundaries are clear;
- important decisions are explicit rather than implied;
- validation expectations are concrete;
- the spec is immediately usable for implementation or task breakdown.
