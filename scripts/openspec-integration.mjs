import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const approved = ["explore", "propose", "apply", "verify", "archive"];
const excluded = ["new", "continue", "update", "ff", "sync", "bulk-archive", "onboard"];
const skillDirectoryByWorkflow = {
  explore: "openspec-explore",
  propose: "openspec-propose",
  apply: "openspec-apply-change",
  verify: "openspec-verify-change",
  archive: "openspec-archive-change",
};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "node_modules", "@fission-ai", "openspec", "bin", "openspec.js");
const workflowConfig = JSON.parse(readFileSync(path.join(root, "openspec", "workflows.json"), "utf8"));

function run(args, cwd, xdgConfigHome) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    env: {
      ...process.env,
      OPENSPEC_TELEMETRY: "0",
      XDG_CONFIG_HOME: xdgConfigHome,
    },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`OpenSpec command failed: ${args.join(" ")}`);
  }
  return result.stdout;
}

function withIsolatedConfig(callback) {
  const temporary = mkdtempSync(path.join(os.tmpdir(), "zippin-openspec-"));
  try {
    const configDir = path.join(temporary, "config", "openspec");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(path.join(configDir, "config.json"), `${JSON.stringify(workflowConfig, null, 2)}\n`);
    return callback(temporary, path.join(temporary, "config"));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function skillNames(project) {
  const directory = path.join(project, ".codex", "skills");
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("openspec-"))
    .map((entry) => entry.name)
    .sort();
}

function assertSurface(project) {
  const names = skillNames(project);
  const expected = approved.map((name) => skillDirectoryByWorkflow[name]).sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`Generated OpenSpec skills differ from allowlist. Expected ${expected.join(", ")}; found ${names.join(", ")}.`);
  }
  for (const name of excluded) {
    if (names.some((entry) => entry === `openspec-${name}` || entry.startsWith(`openspec-${name}-`))) {
      throw new Error(`Excluded OpenSpec workflow is exposed: ${name}`);
    }
  }
}

function assertRepositoryContract(project) {
  const instructions = readFileSync(path.join(project, "AGENTS.md"), "utf8");
  const requiredText = [
    "Do not edit them by hand",
    "$openspec-verify-change",
    "independent read-only review",
    "fresh verification receipt",
    "$openspec-archive-change",
    "Raw `openspec",
    "archive` is unsupported",
    "npm run opsx:archive",
  ];
  const missing = requiredText.filter((text) => !instructions.includes(text));
  if (missing.length > 0) {
    throw new Error(`Root AGENTS.md is missing mandatory OpenSpec contract text: ${missing.join(", ")}.`);
  }
}

function compareDirectory(expected, actual, relative = "") {
  const expectedPath = path.join(expected, relative);
  const actualPath = path.join(actual, relative);
  const expectedEntries = readdirSync(expectedPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const actualEntries = readdirSync(actualPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  if (expectedEntries.map((entry) => entry.name).join("\n") !== actualEntries.map((entry) => entry.name).join("\n")) {
    throw new Error(`Generated integration entries differ at ${relative || "."}.`);
  }
  for (let index = 0; index < expectedEntries.length; index += 1) {
    const expectedEntry = expectedEntries[index];
    const actualEntry = actualEntries[index];
    if (expectedEntry.isDirectory() !== actualEntry.isDirectory()) {
      throw new Error(`Generated integration type differs at ${path.join(relative, expectedEntry.name)}.`);
    }
    const child = path.join(relative, expectedEntry.name);
    if (expectedEntry.isDirectory()) compareDirectory(expected, actual, child);
    else if (!readFileSync(path.join(expected, child)).equals(readFileSync(path.join(actual, child)))) {
      throw new Error(`Generated integration content differs at ${child}. Run npm run openspec:update.`);
    }
  }
}

function compareGeneratedSkills(expectedProject, actualProject) {
  for (const directory of approved.map((workflow) => skillDirectoryByWorkflow[workflow])) {
    compareDirectory(
      path.join(expectedProject, ".codex", "skills", directory),
      path.join(actualProject, ".codex", "skills", directory),
    );
  }
}

const mode = process.argv[2];
if (!new Set(["init", "update", "check"]).has(mode)) {
  throw new Error("Usage: node scripts/openspec-integration.mjs <init|update|check>");
}

withIsolatedConfig((temporary, xdgConfigHome) => {
  if (mode === "init") {
    run(["init", "--tools", "codex", "--profile", "custom", "--no-animation", root], root, xdgConfigHome);
    assertSurface(root);
    assertRepositoryContract(root);
    return;
  }
  if (mode === "update") {
    run(["update", "--force", root], root, xdgConfigHome);
    assertSurface(root);
    assertRepositoryContract(root);
    return;
  }

  const project = path.join(temporary, "project");
  mkdirSync(path.join(project, "openspec"), { recursive: true });
  cpSync(path.join(root, "openspec", "config.yaml"), path.join(project, "openspec", "config.yaml"));
  run(["init", "--tools", "codex", "--profile", "custom", "--no-animation", project], project, xdgConfigHome);
  assertSurface(project);
  compareGeneratedSkills(root, project);
  assertRepositoryContract(root);
  process.stdout.write("OpenSpec generated integration is reproducible.\n");
});
