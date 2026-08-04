import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { finalizeBootstrapRoadmap } from "../workflow.mjs";
import { repositoryPaths, validateRoadmap } from "../workflow/lifecycle.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const bootstrap = "migrate-agentic-flow-to-open-spec";

test("legacy skills and metadata are visibly restricted to the bootstrap", () => {
  for (const name of ["spec-create", "spec-plan", "spec-implement", "spec-validate", "spec-finalize"]) {
    const skill = readFileSync(path.join(repositoryRoot, ".codex", "skills", name, "SKILL.md"), "utf8");
    const metadata = readFileSync(path.join(repositoryRoot, ".codex", "skills", name, "agents", "openai.yaml"), "utf8");
    assert.match(skill, /Legacy only/i);
    assert.match(skill, /migrate-agentic-flow-to-open-spec/);
    assert.match(metadata, /Legacy bootstrap-only/i);
  }
  const implement = readFileSync(path.join(repositoryRoot, ".codex", "skills", "spec-implement", "SKILL.md"), "utf8");
  const plan = readFileSync(path.join(repositoryRoot, ".codex", "skills", "spec-plan", "SKILL.md"), "utf8");
  const validate = readFileSync(path.join(repositoryRoot, ".codex", "skills", "spec-validate", "SKILL.md"), "utf8");
  for (const source of [implement, plan, validate]) {
    assert.match(source, /specs\/roadmap-legacy\.md/);
    assert.doesNotMatch(source, /specs\/roadmap\.md/);
  }
  const validator = readFileSync(path.join(repositoryRoot, ".codex", "agents", "spec-validator.toml"), "utf8");
  assert.match(validator, /legacy agent/i);
  assert.match(validator, /refuse every other target/i);
});

test("bootstrap finalization cleans only its YAML identity and frozen compatibility copy", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "zippin-bootstrap-finalize-"));
  const paths = repositoryPaths(root);
  try {
    mkdirSync(path.join(root, "specs"), { recursive: true });
    mkdirSync(paths.archives, { recursive: true });
    writeFileSync(paths.legacyRoadmap, `### \`${bootstrap}\`\n\nStatus: in-progress\nPrerequisite: none\n`);
    writeFileSync(paths.roadmap, `version: 1
test-area:
  description: Test.
  items:
    - slug: ${bootstrap}
      prerequisites: []
      description: Bootstrap.
    - slug: first-dependent
      prerequisites:
        - ${bootstrap}
      description: First.
    - slug: second-dependent
      prerequisites:
        - ${bootstrap}
        - unrelated-item
      description: Second.
    - slug: third-dependent
      prerequisites:
        - ${bootstrap}
      description: Third.
    - slug: fourth-dependent
      prerequisites:
        - ${bootstrap}
      description: Fourth.
    - slug: unrelated-item
      prerequisites: []
      description: Preserve me.
`);
    await finalizeBootstrapRoadmap(paths);
    const state = validateRoadmap(paths);
    assert.equal(state.bySlug.has(bootstrap), false);
    assert.deepEqual(state.bySlug.get("first-dependent").prerequisites, []);
    assert.deepEqual(state.bySlug.get("second-dependent").prerequisites, ["unrelated-item"]);
    assert.deepEqual(state.bySlug.get("third-dependent").prerequisites, []);
    assert.deepEqual(state.bySlug.get("fourth-dependent").prerequisites, []);
    assert.equal(state.bySlug.get("unrelated-item").description, "Preserve me.");
    assert.equal(existsSync(paths.legacyRoadmap), false);
    assert.equal(existsSync(paths.lock), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
