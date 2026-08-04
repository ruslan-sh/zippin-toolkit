import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { addRoadmapItem } from "../roadmap.mjs";
import { archiveChange, selectChange, validateWorkflow } from "../workflow.mjs";
import {
  acquireLifecycleLock,
  releaseLifecycleLock,
  repositoryPaths,
  snapshotPaths,
  validateRoadmap,
} from "../workflow/lifecycle.mjs";
import { runOpenSpec } from "../workflow/openspec.mjs";
import {
  computeRepositoryFingerprint,
  recordVerification,
  requireFreshVerification,
  REQUIRED_VERIFICATION_COMMANDS,
} from "../workflow/verification.mjs";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1")), "..", "..");

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function writeCompletedArtifacts(paths, slug) {
  const change = path.join(paths.activeChanges, slug);
  mkdirSync(path.join(change, "specs", "lifecycle-feature"), { recursive: true });
  writeFileSync(path.join(change, "proposal.md"), `## Why

Prove the complete repository lifecycle.

## What Changes

- Add temporary lifecycle behavior.

## Capabilities

### New Capabilities
- \`lifecycle-feature\`: Temporary integration behavior.

### Modified Capabilities
- None.

## Impact

- Isolated temporary project only.
`);
  writeFileSync(path.join(change, "design.md"), `## Context

The test uses a temporary OpenSpec project.

## Goals / Non-Goals

**Goals:**
- Exercise the pinned CLI boundary.

**Non-Goals:**
- Mutate the repository project.

## Decisions

Use repository lifecycle functions with a temporary root.

## Risks / Trade-offs

The fixture is removed after each run.
`);
  writeFileSync(path.join(change, "tasks.md"), "- [x] Complete the temporary lifecycle.\n");
  writeFileSync(path.join(change, "specs", "lifecycle-feature", "spec.md"), `## ADDED Requirements

### Requirement: Complete lifecycle
The system SHALL archive a verified selected change.

#### Scenario: Verified archive
- **WHEN** the temporary change completes verification
- **THEN** the archive synchronizes its specification
`);
}

function writeVerification(paths, slug) {
  const file = path.join(paths.activeChanges, slug, "verification.md");
  const commands = REQUIRED_VERIFICATION_COMMANDS.map((command) => `  ${JSON.stringify(command)}: pass`).join("\n");
  const source = `---
version: 1
reviewer: lifecycle-integration-reviewer
iterations: 1
outcome: clean
findings:
  - none
commands:
${commands}
fingerprint: sha256:<computed>
---
`;
  writeFileSync(file, source);
  writeFileSync(file, source.replace("sha256:<computed>", computeRepositoryFingerprint(paths, slug, source)));
}

test("proves the complete pinned-CLI lifecycle without touching repository state", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "zippin-lifecycle-integration-"));
  const paths = repositoryPaths(root);
  const slug = "foundation-change";
  try {
    assert.match(execFileSync(process.execPath, [path.join(repositoryRoot, "scripts", "openspec-integration.mjs"), "check"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }), /generated integration is reproducible/i);
    mkdirSync(path.join(root, "specs"), { recursive: true });
    mkdirSync(paths.archives, { recursive: true });
    mkdirSync(paths.currentSpecs, { recursive: true });
    cpSync(path.join(repositoryRoot, "openspec", "config.yaml"), path.join(paths.openspec, "config.yaml"));
    cpSync(path.join(repositoryRoot, "AGENTS.md"), path.join(root, "AGENTS.md"));
    writeFileSync(path.join(root, ".gitignore"), "openspec/.verification/\nopenspec/.lifecycle-lock\n");
    writeFileSync(paths.roadmap, `version: 1
test-area:
  description: Integration test area.
  items:
    - slug: foundation-change
      prerequisites: []
      description: Foundation.
    - slug: dependent-change
      prerequisites:
        - foundation-change
      description: Dependent.
`);
    git(root, "init", "--initial-branch=main");
    git(root, "config", "user.email", "test@example.com");
    git(root, "config", "user.name", "Test User");
    git(root, "add", ".");
    git(root, "commit", "-m", "initial lifecycle fixture");

    await addRoadmapItem(paths, {
      area: "test-area",
      slug: "intake-change",
      description: "Added through canonical intake.",
      prerequisites: [slug],
    });
    await assert.rejects(selectChange(paths, "dependent-change", { createChange: () => {} }), /blocked by: foundation-change/i);

    acquireLifecycleLock(paths, "interrupted-test", [paths.roadmap]);
    await assert.rejects(addRoadmapItem(paths, {
      area: "test-area",
      slug: "locked-change",
      description: "Must not be added.",
      prerequisites: [],
    }), /interrupted-test/);
    assert.throws(() => validateWorkflow(paths), /inspect recorded state/i);
    releaseLifecycleLock(paths);

    const beforeFailure = readFileSync(paths.roadmap);
    await assert.rejects(addRoadmapItem(paths, {
      area: "test-area",
      slug: "rollback-change",
      description: "Must roll back.",
      prerequisites: [],
    }, { afterWrite: () => { throw new Error("injected lifecycle failure"); } }), /injected lifecycle failure/);
    assert.deepEqual(readFileSync(paths.roadmap), beforeFailure);

    await selectChange(paths, slug, {
      createChange: (changeSlug) => runOpenSpec(repositoryRoot, ["new", "change", changeSlug, "--schema", "spec-driven", "--json"], { cwd: root }),
    });
    writeCompletedArtifacts(paths, slug);
    validateWorkflow(paths, { requireCompletedTasks: true });
    mkdirSync(path.join(paths.activeChanges, "orphan-change"));
    assert.throws(() => validateWorkflow(paths), /no roadmap item/i);
    rmSync(path.join(paths.activeChanges, "orphan-change"), { recursive: true });

    writeVerification(paths, slug);
    recordVerification(paths, slug);
    assert.equal(requireFreshVerification(paths, slug).slug, slug);
    writeFileSync(path.join(root, "freshness-drift.txt"), "drift\n");
    assert.throws(() => requireFreshVerification(paths, slug), /stale/i);
    rmSync(path.join(root, "freshness-drift.txt"));
    assert.equal(requireFreshVerification(paths, slug).slug, slug);

    const receipt = path.join(paths.receipts, `${slug}.json`);
    const transactionPaths = [paths.roadmap, path.join(paths.activeChanges, slug), paths.archives, paths.currentSpecs, receipt];
    const beforeArchiveFailure = snapshotPaths(transactionPaths);
    await assert.rejects(archiveChange(paths, slug, {
      getStatus: () => JSON.parse(runOpenSpec(repositoryRoot, ["status", "--change", slug, "--json"], { cwd: root })),
      strictValidate: (args) => runOpenSpec(repositoryRoot, args, { cwd: root }),
      archive: (args) => {
        runOpenSpec(repositoryRoot, args, { cwd: root });
        throw new Error("injected failure after native archive mutation");
      },
      diffCheck: () => git(root, "diff", "--check"),
    }), /injected failure after native archive mutation/i);
    assert.deepEqual(snapshotPaths(transactionPaths), beforeArchiveFailure);
    assert.equal(existsSync(paths.lock), false);

    await archiveChange(paths, slug, {
      getStatus: () => JSON.parse(runOpenSpec(repositoryRoot, ["status", "--change", slug, "--json"], { cwd: root })),
      strictValidate: (args) => runOpenSpec(repositoryRoot, args, { cwd: root }),
      archive: (args) => runOpenSpec(repositoryRoot, args, { cwd: root }),
      diffCheck: () => git(root, "diff", "--check"),
    });

    const state = validateRoadmap(paths);
    assert.equal(state.bySlug.has(slug), false);
    assert.deepEqual(state.bySlug.get("dependent-change").prerequisites, []);
    assert.deepEqual(state.bySlug.get("intake-change").prerequisites, []);
    assert.match(readFileSync(path.join(paths.currentSpecs, "lifecycle-feature", "spec.md"), "utf8"), /Complete lifecycle/);
    assert.equal(existsSync(path.join(paths.receipts, `${slug}.json`)), false);
    await assert.rejects(addRoadmapItem(paths, {
      area: "test-area",
      slug,
      description: "Archived identities stay reserved.",
      prerequisites: [],
    }), /already live or reserved/i);
    validateWorkflow(paths);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
