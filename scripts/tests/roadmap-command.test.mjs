import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { addRoadmapItem } from "../roadmap.mjs";
import {
  acquireLifecycleLock,
  releaseLifecycleLock,
  repositoryPaths,
  validateRoadmap,
} from "../workflow/lifecycle.mjs";

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "zippin-roadmap-command-"));
  mkdirSync(path.join(root, "specs"), { recursive: true });
  mkdirSync(path.join(root, "openspec", "changes", "archive"), { recursive: true });
  writeFileSync(path.join(root, "specs", "roadmap.yml"), `# preserved comment
version: 1
test-area:
  description: Test area.
  items:
    - slug: base-item # preserved identity comment
      prerequisites: []
      description: Base item.
`);
  return { root, paths: repositoryPaths(root) };
}

test("adds canonical intake while preserving existing comments", async () => {
  const { root, paths } = fixture();
  try {
    await addRoadmapItem(paths, { area: "test-area", slug: "new-item", description: "New item.", prerequisites: ["base-item"] });
    const state = validateRoadmap(paths);
    assert.deepEqual(state.bySlug.get("new-item").prerequisites, ["base-item"]);
    const source = readFileSync(paths.roadmap, "utf8");
    assert.match(source, /# preserved comment/);
    assert.match(source, /# preserved identity comment/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const [name, input, message] of [
  ["unknown area", { area: "absent", slug: "new-item", description: "New.", prerequisites: [] }, /unknown roadmap area/i],
  ["duplicate slug", { area: "test-area", slug: "base-item", description: "New.", prerequisites: [] }, /already live or reserved/i],
  ["unknown prerequisite", { area: "test-area", slug: "new-item", description: "New.", prerequisites: ["absent"] }, /unknown prerequisite/i],
  ["duplicate prerequisite", { area: "test-area", slug: "new-item", description: "New.", prerequisites: ["base-item", "base-item"] }, /duplicate prerequisite/i],
  ["self prerequisite", { area: "test-area", slug: "new-item", description: "New.", prerequisites: ["new-item"] }, /cannot depend on itself/i],
  ["invalid slug", { area: "test-area", slug: "Not Valid", description: "New.", prerequisites: [] }, /invalid roadmap slug/i],
]) {
  test(`rejects ${name} and rolls back`, async () => {
    const { root, paths } = fixture();
    const before = readFileSync(paths.roadmap);
    try {
      await assert.rejects(addRoadmapItem(paths, input), message);
      assert.ok(before.equals(readFileSync(paths.roadmap)));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test("rejects an active OpenSpec identity at the command boundary", async () => {
  const { root, paths } = fixture();
  try {
    mkdirSync(path.join(paths.activeChanges, "base-item"), { recursive: true });
    await assert.rejects(
      addRoadmapItem(paths, { area: "test-area", slug: "base-item", description: "Duplicate.", prerequisites: [] }),
      /already live or reserved/i,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects an archived OpenSpec identity at the command boundary", async () => {
  const { root, paths } = fixture();
  try {
    mkdirSync(path.join(paths.archives, "2026-08-02-retired-item"), { recursive: true });
    await assert.rejects(
      addRoadmapItem(paths, { area: "test-area", slug: "retired-item", description: "Duplicate.", prerequisites: [] }),
      /already live or reserved/i,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fails command-level intake while the shared lifecycle lock is held", async () => {
  const { root, paths } = fixture();
  try {
    acquireLifecycleLock(paths, "archive", [paths.roadmap]);
    await assert.rejects(
      addRoadmapItem(paths, { area: "test-area", slug: "new-item", description: "New.", prerequisites: [] }),
      /lifecycle operation is locked/i,
    );
    assert.match(readFileSync(paths.lock, "utf8"), /"operation": "archive"/);
    releaseLifecycleLock(paths);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rolls back exact YAML after a handled post-write command failure", async () => {
  const { root, paths } = fixture();
  const before = readFileSync(paths.roadmap);
  try {
    await assert.rejects(
      addRoadmapItem(
        paths,
        { area: "test-area", slug: "new-item", description: "New.", prerequisites: [] },
        { afterWrite: () => { throw new Error("injected post-write failure"); } },
      ),
      /injected post-write failure/i,
    );
    assert.ok(before.equals(readFileSync(paths.roadmap)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
