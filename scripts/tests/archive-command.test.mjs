import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { archiveChange } from "../workflow.mjs";
import { repositoryPaths } from "../workflow/lifecycle.mjs";
import { runOpenSpec } from "../workflow/openspec.mjs";
import { computeRepositoryFingerprint, recordVerification, REQUIRED_VERIFICATION_COMMANDS } from "../workflow/verification.mjs";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1")), "..", "..");

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function fixture({ delta = true, modifiesExistingSpec = false } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "zippin-archive-command-"));
  const paths = repositoryPaths(root);
  const slug = "ready-item";
  const change = path.join(paths.activeChanges, slug);
  mkdirSync(path.join(paths.archives), { recursive: true });
  mkdirSync(change, { recursive: true });
  mkdirSync(path.join(paths.openspec, "specs"), { recursive: true });
  cpSync(path.join(repositoryRoot, "openspec", "config.yaml"), path.join(paths.openspec, "config.yaml"));
  if (existsSync(path.join(repositoryRoot, ".gitattributes"))) {
    cpSync(path.join(repositoryRoot, ".gitattributes"), path.join(root, ".gitattributes"));
  }
  if (delta) mkdirSync(path.join(change, "specs", "feature"), { recursive: true });
  writeFileSync(path.join(root, ".gitignore"), "openspec/.verification/\nopenspec/.lifecycle-lock\n");
  writeFileSync(path.join(root, "AGENTS.md"), "$openspec-verify-change independent read-only review fresh verification receipt $openspec-archive-change npm run opsx:archive Raw OpenSpec archival is unsupported\n");
  mkdirSync(path.join(root, "specs"), { recursive: true });
  writeFileSync(paths.roadmap, `version: 1
test-area:
  description: Test.
  items:
    - slug: ready-item
      prerequisites: []
      description: Ready.
    - slug: dependent-item
      prerequisites:
        - ready-item
      description: Dependent.
`);
  writeFileSync(path.join(change, ".openspec.yaml"), `schema: spec-driven
created: 2026-08-02
${delta ? "" : "skip_specs: true\n"}`);
  writeFileSync(path.join(change, "proposal.md"), `## Why

Test the archive lifecycle.

## What Changes

- Add temporary archive behavior.

## Capabilities

### New Capabilities
- \`archive-test\`: Temporary archive behavior.

### Modified Capabilities
- None.

## Impact

- Temporary test project only.
`);
  writeFileSync(path.join(change, "tasks.md"), "- [x] Complete\n");
  writeFileSync(path.join(change, "design.md"), `## Context

This temporary project exercises the pinned archive command.

## Goals / Non-Goals

**Goals:**
- Prove archive compatibility.

**Non-Goals:**
- Change application behavior.

## Decisions

Use an isolated temporary project.

## Risks / Trade-offs

Temporary files are removed after the test.
`);
  if (modifiesExistingSpec) {
    mkdirSync(path.join(paths.currentSpecs, "feature"), { recursive: true });
    cpSync(path.join(repositoryRoot, "openspec", "specs", "hex-map-editor", "spec.md"), path.join(paths.currentSpecs, "feature", "spec.md"));
  }
  if (delta) writeFileSync(path.join(change, "specs", "feature", "spec.md"), modifiesExistingSpec ? `## MODIFIED Requirements

### Requirement: Fixed hex map workspace
The system SHALL provide a fixed 101 by 101 pointy-top hex grid at a fixed zoom
level. Unpainted hexes SHALL appear black, the editor SHALL show grid lines,
and the editor SHALL use standard scrollbars with the initial viewport centered
on the grid.

#### Scenario: Editor opens
- **WHEN** the user opens the Map Drawing Tool
- **THEN** the system shows the center of a black 101 by 101 pointy-top hex grid

#### Scenario: User navigates the grid
- **WHEN** the grid is larger than the available editor viewport
- **THEN** the system provides horizontal and vertical scrollbars
` : `## ADDED Requirements

### Requirement: Archive test behavior
The system SHALL archive a verified temporary change.

#### Scenario: Archive succeeds
- **WHEN** the verified change is archived
- **THEN** its delta specification is synchronized
`);
  git(root, "init", "--initial-branch=main");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test User");
  git(root, "add", ".");
  git(root, "commit", "-m", "fixture");
  writeEvidence(paths, slug);
  recordVerification(paths, slug);
  return { root, paths, slug, change };
}

function writeEvidence(paths, slug) {
  const file = path.join(paths.activeChanges, slug, "verification.md");
  const commands = REQUIRED_VERIFICATION_COMMANDS.map((command) => `  ${JSON.stringify(command)}: pass`).join("\n");
  const source = `---
version: 1
reviewer: archive-reviewer
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

function syntheticArchive(paths, slug, args) {
  const delta = path.join(paths.activeChanges, slug, "specs");
  if (existsSync(delta) && !args.includes("--skip-specs")) {
    cpSync(delta, paths.currentSpecs, { recursive: true });
  }
  const destination = path.join(paths.archives, `2026-08-02-${slug}`);
  renameSync(path.join(paths.activeChanges, slug), destination);
  return args;
}

function options(paths, slug, calls, overrides = {}) {
  return {
    getStatus: () => ({ artifacts: [{ id: "proposal", status: "done" }, { id: "tasks", status: "done" }] }),
    strictValidate: (args) => calls.push(["validate", args]),
    archive: (args) => {
      calls.push(["archive", args]);
      syntheticArchive(paths, slug, args);
    },
    diffCheck: () => calls.push(["diff"]),
    ...overrides,
  };
}

test("archives delta specs, cleans dependencies, validates, and consumes the receipt", async () => {
  const { root, paths, slug } = fixture();
  const calls = [];
  try {
    await archiveChange(paths, slug, options(paths, slug, calls));
    assert.equal(existsSync(path.join(paths.activeChanges, slug)), false);
    assert.equal(existsSync(path.join(paths.archives, `2026-08-02-${slug}`, "verification.md")), true);
    assert.match(readFileSync(path.join(paths.currentSpecs, "feature", "spec.md"), "utf8"), /Archive test behavior/);
    assert.equal(existsSync(path.join(paths.receipts, `${slug}.json`)), false);
    const roadmap = readFileSync(paths.roadmap, "utf8");
    assert.doesNotMatch(roadmap, /slug: ready-item/);
    assert.match(roadmap, /slug: dependent-item\s+prerequisites: \[\]/);
    const archiveArgs = calls.find(([kind]) => kind === "archive")[1];
    assert.equal(archiveArgs.includes("--skip-specs"), false);
    assert.equal(calls.filter(([kind]) => kind === "validate").length, 2);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const delta of [true, false]) {
  test(`archives ${delta ? "delta" : "infrastructure-only"} change with pinned real OpenSpec CLI`, async () => {
    const { root, paths, slug } = fixture({ delta });
    try {
      await archiveChange(paths, slug, {
        getStatus: () => JSON.parse(runOpenSpec(repositoryRoot, ["status", "--change", slug, "--json"], { cwd: root })),
        strictValidate: (args) => runOpenSpec(repositoryRoot, args, { cwd: root }),
        archive: (args) => runOpenSpec(repositoryRoot, args, { cwd: root }),
        diffCheck: () => {},
      });
      assert.equal(existsSync(path.join(paths.activeChanges, slug)), false);
      assert.equal(existsSync(path.join(paths.receipts, `${slug}.json`)), false);
      if (delta) assert.match(readFileSync(path.join(paths.currentSpecs, "feature", "spec.md"), "utf8"), /Archive test behavior/);
      else assert.equal(existsSync(path.join(paths.currentSpecs, "feature")), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test("archives a pinned-CLI modification with the real Git whitespace check", async () => {
  const { root, paths, slug } = fixture({ modifiesExistingSpec: true });
  try {
    await archiveChange(paths, slug, {
      getStatus: () => JSON.parse(runOpenSpec(repositoryRoot, ["status", "--change", slug, "--json"], { cwd: root })),
      strictValidate: (args) => runOpenSpec(repositoryRoot, args, { cwd: root }),
      archive: (args) => runOpenSpec(repositoryRoot, args, { cwd: root }),
      diffCheck: () => git(root, "diff", "--check"),
    });
    const spec = readFileSync(path.join(paths.currentSpecs, "feature", "spec.md"), "utf8");
    assert.match(spec, /fixed 101 by 101 pointy-top hex grid/);
    assert.match(spec, /\n\n$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("keeps trailing whitespace checks active for canonical OpenSpec specs", () => {
  const { root, paths } = fixture({ modifiesExistingSpec: true });
  try {
    const spec = path.join(paths.currentSpecs, "feature", "spec.md");
    writeFileSync(spec, `${readFileSync(spec, "utf8")}Trailing spaces remain invalid.  \n`);
    assert.throws(
      () => git(root, "diff", "--check"),
      (error) => error.status === 2 && /trailing whitespace/.test(error.stdout),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("uses the documented infrastructure archive path when no delta specs exist", async () => {
  const { root, paths, slug } = fixture({ delta: false });
  const calls = [];
  try {
    await archiveChange(paths, slug, options(paths, slug, calls));
    const archiveArgs = calls.find(([kind]) => kind === "archive")[1];
    assert.equal(archiveArgs.includes("--skip-specs"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects incomplete artifacts and unchecked tasks before archive mutation", async () => {
  const { root, paths, slug, change } = fixture();
  try {
    await assert.rejects(archiveChange(paths, slug, options(paths, slug, [], {
      getStatus: () => ({ artifacts: [{ id: "proposal", status: "ready" }] }),
    })), /incomplete artifacts/i);
    writeFileSync(path.join(change, "tasks.md"), "- [ ] Incomplete\n");
    await assert.rejects(archiveChange(paths, slug, options(paths, slug, [])), /unchecked implementation tasks/i);
    assert.equal(existsSync(change), true);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects missing and stale receipts before archive mutation", async () => {
  const { root, paths, slug, change } = fixture();
  try {
    rmSync(path.join(paths.receipts, `${slug}.json`));
    await assert.rejects(archiveChange(paths, slug, options(paths, slug, [])), /receipt is missing/i);
    writeEvidence(paths, slug);
    recordVerification(paths, slug);
    writeFileSync(path.join(root, "later.txt"), "later edit\n");
    await assert.rejects(archiveChange(paths, slug, options(paths, slug, [])), /stale/i);
    assert.equal(existsSync(change), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects invalid archive slugs before creating lifecycle state", async () => {
  const { root, paths } = fixture();
  try {
    await assert.rejects(archiveChange(paths, "../outside"), /invalid change slug/i);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("restores roadmap, active change, archives, specs, and receipt after handled failures", async () => {
  for (const boundary of ["archive", "post-archive-validation", "diff-check"]) {
    const { root, paths, slug, change } = fixture();
    const originalRoadmap = readFileSync(paths.roadmap);
    const receipt = path.join(paths.receipts, `${slug}.json`);
    const originalReceipt = readFileSync(receipt);
    try {
      const calls = [];
      const base = options(paths, slug, calls);
      if (boundary === "archive") base.archive = () => { throw new Error("injected archive failure"); };
      if (boundary === "post-archive-validation") base.strictValidate = (args) => {
        if (args.includes("--all")) throw new Error("injected post-archive validation failure");
      };
      if (boundary === "diff-check") base.diffCheck = () => { throw new Error("injected diff failure"); };
      await assert.rejects(archiveChange(paths, slug, base), /injected/i);
      assert.deepEqual(readFileSync(paths.roadmap), originalRoadmap);
      assert.deepEqual(readFileSync(receipt), originalReceipt);
      assert.equal(existsSync(change), true);
      assert.equal(existsSync(path.join(paths.archives, `2026-08-02-${slug}`)), false);
      assert.equal(existsSync(path.join(paths.currentSpecs, "feature", "spec.md")), false);
      assert.equal(existsSync(paths.lock), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});
