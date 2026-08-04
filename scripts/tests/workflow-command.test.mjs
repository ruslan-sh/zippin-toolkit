import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { repositoryPaths } from "../workflow/lifecycle.mjs";
import { runOpenSpec } from "../workflow/openspec.mjs";
import { selectChange, validateWorkflow } from "../workflow.mjs";

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "zippin-workflow-command-"));
  mkdirSync(path.join(root, "specs"), { recursive: true });
  mkdirSync(path.join(root, "openspec", "changes", "archive"), { recursive: true });
  writeFileSync(path.join(root, "AGENTS.md"), "$openspec-verify-change independent read-only review fresh verification receipt $openspec-archive-change npm run opsx:archive Raw OpenSpec archival is unsupported\n");
  writeFileSync(path.join(root, "specs", "roadmap.yml"), `version: 1
test-area:
  description: Test area.
  items:
    - slug: ready-item
      prerequisites: []
      description: Ready.
    - slug: blocked-item
      prerequisites:
        - ready-item
      description: Blocked.
`);
  return { root, paths: repositoryPaths(root) };
}

function syntheticCreate(paths, slug) {
  mkdirSync(path.join(paths.activeChanges, slug), { recursive: true });
  writeFileSync(path.join(paths.activeChanges, slug, ".openspec.yaml"), "schema: spec-driven\ncreated: 2026-08-02\n");
}

test("selects one eligible item and derives in-progress state", async () => {
  const { root, paths } = fixture();
  try {
    await selectChange(paths, "ready-item", { createChange: (slug) => syntheticCreate(paths, slug) });
    assert.equal(existsSync(path.join(paths.activeChanges, "ready-item")), true);
    assert.deepEqual(validateWorkflow(paths).active, ["ready-item"]);
    await assert.rejects(selectChange(paths, "ready-item", { createChange: () => {} }), /already active|reserved/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("selects through the pinned real OpenSpec CLI in a temporary project", async () => {
  const { root, paths } = fixture();
  const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1")), "..", "..");
  try {
    cpSync(path.join(repositoryRoot, "openspec", "config.yaml"), path.join(paths.openspec, "config.yaml"));
    await selectChange(paths, "ready-item", {
      createChange: (slug) => runOpenSpec(repositoryRoot, ["new", "change", slug, "--schema", "spec-driven", "--json"], { cwd: root }),
    });
    assert.equal(existsSync(path.join(paths.activeChanges, "ready-item", ".openspec.yaml")), true);
    assert.deepEqual(validateWorkflow(paths).active, ["ready-item"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects missing and blocked selections without mutation", async () => {
  const { root, paths } = fixture();
  try {
    await assert.rejects(selectChange(paths, "missing-item", { createChange: () => {} }), /not found/i);
    await assert.rejects(selectChange(paths, "blocked-item", { createChange: () => {} }), /blocked by/i);
    assert.equal(existsSync(path.join(paths.activeChanges, "missing-item")), false);
    assert.equal(existsSync(path.join(paths.activeChanges, "blocked-item")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rolls back partial selection failures", async () => {
  const { root, paths } = fixture();
  const target = path.join(paths.activeChanges, "ready-item");
  try {
    await assert.rejects(
      selectChange(paths, "ready-item", {
        createChange: () => {
          mkdirSync(target, { recursive: true });
          writeFileSync(path.join(target, "partial.txt"), "partial\n");
          throw new Error("injected creation failure");
        },
      }),
      /injected creation failure/i,
    );
    assert.equal(existsSync(target), false);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("detects active changes without roadmap linkage and archive evidence drift", () => {
  const { root, paths } = fixture();
  try {
    mkdirSync(path.join(paths.activeChanges, "orphan-change"), { recursive: true });
    assert.throws(() => validateWorkflow(paths), /no roadmap item/i);
    rmSync(path.join(paths.activeChanges, "orphan-change"), { recursive: true, force: true });
    mkdirSync(path.join(paths.archives, "2026-08-02-retired-item"), { recursive: true });
    assert.throws(() => validateWorkflow(paths), /missing verification/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects empty and malformed active scaffolds but accepts resumable proposal work", () => {
  const { root, paths } = fixture();
  const directory = path.join(paths.activeChanges, "ready-item");
  try {
    mkdirSync(directory, { recursive: true });
    assert.throws(() => validateWorkflow(paths), /missing \.openspec\.yaml/i);
    writeFileSync(path.join(directory, ".openspec.yaml"), "schema: [broken\n");
    assert.throws(() => validateWorkflow(paths), /invalid \.openspec\.yaml/i);
    writeFileSync(path.join(directory, ".openspec.yaml"), "schema: other\ncreated: invalid\n");
    assert.throws(() => validateWorkflow(paths), /spec-driven schema/i);
    for (const [metadata, message] of [
      ["schema: spec-driven\ngoal: 42\n", /invalid goal/i],
      ["schema: spec-driven\naffected_areas: nope\n", /invalid affected_areas/i],
      ["schema: spec-driven\ninitiative: invalid\n", /invalid initiative/i],
      ["schema: spec-driven\ninitiative:\n  store: valid-store\n  id: Invalid\n", /invalid initiative/i],
      ["schema: spec-driven\ninitiative:\n  store: 123\n  id: valid-id\n", /invalid initiative/i],
      ["schema: spec-driven\ninitiative:\n  store: valid-store\n  id: 456\n", /invalid initiative/i],
      ["schema: spec-driven\nskip_specs: nope\n", /invalid skip_specs/i],
    ]) {
      writeFileSync(path.join(directory, ".openspec.yaml"), metadata);
      assert.throws(() => validateWorkflow(paths), message);
    }
    writeFileSync(path.join(directory, ".openspec.yaml"), "schema: spec-driven\ncreated: 2026-08-02\n");
    writeFileSync(path.join(directory, "proposal.md"), "# Partial proposal\n\nWork can resume here.\n");
    validateWorkflow(paths);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("accepts only the complete legacy bootstrap combination", () => {
  const { root, paths } = fixture();
  try {
    const roadmap = readFileSync(paths.roadmap, "utf8").replace("  items:\n", `  items:\n    - slug: migrate-agentic-flow-to-open-spec\n      prerequisites: []\n      description: Bootstrap.\n`);
    writeFileSync(paths.roadmap, roadmap);
    writeFileSync(paths.legacyRoadmap, "### `migrate-agentic-flow-to-open-spec`\n\nStatus: in-progress\nPrerequisite: none\n");
    writeFileSync(path.join(root, "specs", "migrate-agentic-flow-to-open-spec.md"), "# Bootstrap\n");
    assert.throws(() => validateWorkflow(paths), /incomplete or contradictory/i);
    writeFileSync(path.join(root, "specs", "migrate-agentic-flow-to-open-spec.tasks.md"), "# Tasks\n");
    validateWorkflow(paths);
    writeFileSync(paths.roadmap, readFileSync(paths.roadmap, "utf8").replace(
      "    - slug: migrate-agentic-flow-to-open-spec\n      prerequisites: []",
      "    - slug: migrate-agentic-flow-to-open-spec\n      prerequisites:\n        - ready-item",
    ));
    assert.throws(() => validateWorkflow(paths), /canonical YAML bootstrap item must remain unblocked/i);
    writeFileSync(paths.roadmap, readFileSync(paths.roadmap, "utf8").replace(
      "    - slug: migrate-agentic-flow-to-open-spec\n      prerequisites:\n        - ready-item",
      "    - slug: migrate-agentic-flow-to-open-spec\n      prerequisites: []",
    ));
    writeFileSync(paths.legacyRoadmap, "### `migrate-agentic-flow-to-open-spec`\n\nStatus: in-progress\nPrerequisite: other-item\n\n### `other-item`\n\nStatus: planned\nPrerequisite: none\n");
    assert.throws(() => validateWorkflow(paths), /does not authorize/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("requires an explicit contract that raw OpenSpec archival is unsupported", () => {
  const { root, paths } = fixture();
  try {
    writeFileSync(path.join(root, "AGENTS.md"), "$openspec-verify-change independent read-only review fresh verification receipt $openspec-archive-change npm run opsx:archive\n");
    assert.throws(() => validateWorkflow(paths), /Raw OpenSpec archival is unsupported/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
