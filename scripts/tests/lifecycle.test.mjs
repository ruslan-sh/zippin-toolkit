import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  acquireLifecycleLock,
  releaseLifecycleLock,
  repositoryPaths,
  restoreSnapshot,
  snapshotPaths,
  parseRoadmap,
  setScalarPreservingStyle,
  writeDocument,
  validateRoadmap,
  withLifecycleTransaction,
} from "../workflow/lifecycle.mjs";

function fixture(source) {
  const root = mkdtempSync(path.join(os.tmpdir(), "zippin-lifecycle-test-"));
  mkdirSync(path.join(root, "specs"), { recursive: true });
  mkdirSync(path.join(root, "openspec", "changes", "archive"), { recursive: true });
  writeFileSync(path.join(root, "specs", "roadmap.yml"), source);
  return { root, paths: repositoryPaths(root) };
}

const valid = `version: 1
area-one:
  description: Test area.
  items:
    - slug: first-item
      prerequisites: []
      description: First item.
    - slug: second-item
      prerequisites:
        - first-item
      description: Second item.
`;

test("validates the exact roadmap schema and graph", () => {
  const { root, paths } = fixture(valid);
  try {
    const result = validateRoadmap(paths);
    assert.deepEqual(result.items.map((item) => item.slug), ["first-item", "second-item"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const [name, replacement, message] of [
  ["unknown item fields", "      description: First item.\n      status: planned", "unknown fields"],
  ["missing prerequisites", "      prerequisites: []", "Missing prerequisite"],
  ["cycles", "      prerequisites: []", "cycle"],
]) {
  test(`rejects ${name}`, () => {
    let source;
    if (name === "unknown item fields") source = valid.replace("      description: First item.", replacement);
    else if (name === "missing prerequisites") source = valid.replace("        - first-item", "        - absent-item");
    else source = valid.replace("      prerequisites: []", "      prerequisites:\n        - second-item");
    const { root, paths } = fixture(source);
    try {
      assert.throws(() => validateRoadmap(paths), new RegExp(message, "i"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test("keeps lifecycle locks until explicit release", () => {
  const { root, paths } = fixture(valid);
  try {
    acquireLifecycleLock(paths, "test", [paths.roadmap]);
    assert.throws(() => acquireLifecycleLock(paths, "second"), /locked/i);
    assert.match(readFileSync(paths.lock, "utf8"), /"operation": "test"/);
    releaseLifecycleLock(paths);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("never auto-clears a stale lifecycle lock", () => {
  const { root, paths } = fixture(valid);
  try {
    mkdirSync(path.dirname(paths.lock), { recursive: true });
    writeFileSync(paths.lock, '{"operation":"archive","startedAt":"2000-01-01T00:00:00.000Z","affectedPaths":["specs/roadmap.yml"]}\n');
    assert.throws(
      () => acquireLifecycleLock(paths, "selection"),
      (error) => /deliberate recovery/i.test(error.message) && /"operation":"archive"/.test(error.message),
    );
    assert.equal(existsSync(paths.lock), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects collisions across roadmap, active changes, and archives", () => {
  const { root, paths } = fixture(valid);
  try {
    mkdirSync(path.join(paths.activeChanges, "first-item"), { recursive: true });
    validateRoadmap(paths);
    mkdirSync(path.join(paths.archives, "2026-08-02-first-item"), { recursive: true });
    assert.throws(() => validateRoadmap(paths), /reserved OpenSpec slug is reused/i);
    rmSync(path.join(paths.archives, "2026-08-02-first-item"), { recursive: true, force: true });
    mkdirSync(path.join(paths.archives, "2026-08-01-retired-item"), { recursive: true });
    mkdirSync(path.join(paths.archives, "2026-08-02-retired-item"), { recursive: true });
    assert.throws(() => validateRoadmap(paths), /duplicate archived OpenSpec identity/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("preserves comments, area order, and folded scalar style through document mutation", () => {
  const source = `# roadmap comment
version: 1
area-one:
  description: >-
    Test area.
  items:
    - slug: first-item # identity comment
      prerequisites: []
      description: >-
        First item.
area-two:
  description: Second area.
  items: []
`;
  const { root, paths } = fixture(source);
  try {
    const { document } = parseRoadmap(paths.roadmap);
    const item = document.getIn(["area-one", "items", 0], true);
    setScalarPreservingStyle(item, "description", "Changed item.");
    writeDocument(paths.roadmap, document);
    const output = readFileSync(paths.roadmap, "utf8");
    assert.ok(output.indexOf("area-one:") < output.indexOf("area-two:"));
    assert.match(output, /# roadmap comment/);
    assert.match(output, /# identity comment/);
    assert.match(output, /description: >-\n        Changed item\./);
    validateRoadmap(paths);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("restores exact path snapshots", () => {
  const { root, paths } = fixture(valid);
  try {
    const snapshot = snapshotPaths([paths.roadmap]);
    writeFileSync(paths.roadmap, "changed\n");
    restoreSnapshot(snapshot);
    assert.equal(readFileSync(paths.roadmap, "utf8"), valid);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rolls back handled transaction failures and clears the lock", async () => {
  const { root, paths } = fixture(valid);
  try {
    await assert.rejects(
      withLifecycleTransaction(paths, "failure-test", [paths.roadmap], () => {
        writeFileSync(paths.roadmap, "broken\n");
        throw new Error("injected");
      }),
      /injected/,
    );
    assert.equal(readFileSync(paths.roadmap, "utf8"), valid);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("restores created and deleted directory content on handled failure", async () => {
  const { root, paths } = fixture(valid);
  const directory = path.join(root, "transaction-tree");
  mkdirSync(path.join(directory, "nested"), { recursive: true });
  writeFileSync(path.join(directory, "nested", "original.txt"), "original\n");
  try {
    await assert.rejects(
      withLifecycleTransaction(paths, "tree-failure", [directory], () => {
        rmSync(path.join(directory, "nested"), { recursive: true, force: true });
        mkdirSync(path.join(directory, "created"), { recursive: true });
        writeFileSync(path.join(directory, "created", "new.txt"), "new\n");
        throw new Error("injected tree failure");
      }),
      /injected tree failure/,
    );
    assert.equal(readFileSync(path.join(directory, "nested", "original.txt"), "utf8"), "original\n");
    assert.equal(existsSync(path.join(directory, "created")), false);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
