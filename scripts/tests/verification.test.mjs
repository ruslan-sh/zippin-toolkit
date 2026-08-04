import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { repositoryPaths } from "../workflow/lifecycle.mjs";
import {
  computeRepositoryFingerprint,
  recordVerification,
  requireFreshVerification,
  REQUIRED_VERIFICATION_COMMANDS,
} from "../workflow/verification.mjs";

function run(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "zippin-verification-"));
  const paths = repositoryPaths(root);
  const slug = "test-change";
  mkdirSync(path.join(paths.activeChanges, slug), { recursive: true });
  writeFileSync(path.join(root, ".gitignore"), "openspec/.verification/\nopenspec/.lifecycle-lock\nignored.txt\n");
  writeFileSync(path.join(root, "tracked.txt"), "tracked\n");
  writeFileSync(path.join(paths.activeChanges, slug, ".openspec.yaml"), "schema: spec-driven\n");
  run(root, "init", "--initial-branch=main");
  run(root, "config", "user.email", "test@example.com");
  run(root, "config", "user.name", "Test User");
  run(root, "add", ".");
  run(root, "commit", "-m", "fixture");
  return { root, paths, slug };
}

function evidence(replacements = {}) {
  const commands = Object.fromEntries(REQUIRED_VERIFICATION_COMMANDS.map((command) => [command, "pass"]));
  const value = {
    version: 1,
    reviewer: "review-task-1",
    iterations: 1,
    outcome: "clean",
    findings: ["none"],
    commands,
    fingerprint: "sha256:<computed>",
    ...replacements,
  };
  const commandLines = Object.entries(value.commands).map(([command, result]) => `  ${JSON.stringify(command)}: ${result}`).join("\n");
  return `---\nversion: ${value.version}\nreviewer: ${value.reviewer}\niterations: ${value.iterations}\noutcome: ${value.outcome}\nfindings:\n${value.findings.map((item) => `  - ${item}`).join("\n")}\ncommands:\n${commandLines}\nfingerprint: ${value.fingerprint}\n---\n\n# Verification\n\nConcise independent verification evidence.\n`;
}

function writeCurrentEvidence(paths, slug, source = evidence()) {
  const file = path.join(paths.activeChanges, slug, "verification.md");
  writeFileSync(file, source);
  const fingerprint = computeRepositoryFingerprint(paths, slug, source);
  writeFileSync(file, source.replace("sha256:<computed>", fingerprint));
  return file;
}

test("records complete evidence and accepts a fresh receipt", () => {
  const { root, paths, slug } = fixture();
  try {
    writeCurrentEvidence(paths, slug);
    const receipt = recordVerification(paths, slug);
    assert.equal(receipt.slug, slug);
    assert.deepEqual(requireFreshVerification(paths, slug), receipt);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fingerprint covers HEAD, tracked state, non-ignored untracked files, and evidence", () => {
  const { root, paths, slug } = fixture();
  try {
    const file = writeCurrentEvidence(paths, slug);
    recordVerification(paths, slug);
    writeFileSync(path.join(root, "untracked.txt"), "new\n");
    assert.throws(() => requireFreshVerification(paths, slug), /stale/i);
    rmSync(path.join(root, "untracked.txt"));
    writeCurrentEvidence(paths, slug);
    recordVerification(paths, slug);
    writeFileSync(path.join(root, "tracked.txt"), "changed\n");
    assert.throws(() => requireFreshVerification(paths, slug), /stale/i);
    writeFileSync(path.join(root, "tracked.txt"), "tracked\n");
    writeFileSync(file, readFileSync(file, "utf8").replace("Concise", "Updated"));
    assert.throws(() => requireFreshVerification(paths, slug), /stale/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ignored receipt, lock, and other ignored files do not invalidate freshness", () => {
  const { root, paths, slug } = fixture();
  try {
    writeCurrentEvidence(paths, slug);
    recordVerification(paths, slug);
    writeFileSync(path.join(root, "ignored.txt"), "ignored\n");
    writeFileSync(paths.lock, "ignored lock content\n");
    assert.equal(requireFreshVerification(paths, slug).slug, slug);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a receipt whose evidence identity fields were tampered", () => {
  const { root, paths, slug } = fixture();
  const receiptFile = path.join(paths.receipts, `${slug}.json`);
  try {
    writeCurrentEvidence(paths, slug);
    recordVerification(paths, slug);
    const receipt = JSON.parse(readFileSync(receiptFile, "utf8"));
    receipt.reviewer = "different-reviewer";
    writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
    assert.throws(() => requireFreshVerification(paths, slug), /stale or does not match/i);
    receipt.reviewer = "review-task-1";
    receipt.iterations = 2;
    writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
    assert.throws(() => requireFreshVerification(paths, slug), /stale or does not match/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects incomplete, malformed, incorrect, and stale evidence without leaving a receipt", () => {
  const { root, paths, slug } = fixture();
  const file = path.join(paths.activeChanges, slug, "verification.md");
  try {
    writeFileSync(file, "# Missing front matter\n");
    assert.throws(() => recordVerification(paths, slug), /YAML front matter/i);
    writeFileSync(file, evidence({ reviewer: "" }));
    assert.throws(() => recordVerification(paths, slug), /reviewer identity/i);
    const commands = Object.fromEntries(REQUIRED_VERIFICATION_COMMANDS.slice(1).map((command) => [command, "pass"]));
    writeFileSync(file, evidence({ commands }));
    assert.throws(() => recordVerification(paths, slug), /every required command/i);
    writeFileSync(file, evidence({ fingerprint: `sha256:${"0".repeat(64)}` }));
    assert.throws(() => recordVerification(paths, slug), /stale or incorrect/i);
    assert.equal(existsSync(path.join(paths.receipts, `${slug}.json`)), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
