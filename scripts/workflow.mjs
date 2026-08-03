import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "yaml";
import {
  BOOTSTRAP_SLUG,
  repositoryPaths,
  validateRoadmap,
  withLifecycleTransaction,
} from "./workflow/lifecycle.mjs";
import { runOpenSpec } from "./workflow/openspec.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_AGENT_CONTRACT = [
  "$openspec-verify-change",
  "independent read-only review",
  "fresh verification receipt",
  "$openspec-archive-change",
  "npm run opsx:archive",
];

function taskFiles(changeDirectory) {
  return readdirSync(changeDirectory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name === "tasks.md")
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
}

function hasUncheckedTasks(changeDirectory) {
  return taskFiles(changeDirectory).some((file) => /^\s*- \[ \]/m.test(readFileSync(file, "utf8")));
}

function validateAgentContract(paths) {
  const source = readFileSync(path.join(paths.root, "AGENTS.md"), "utf8");
  const missing = REQUIRED_AGENT_CONTRACT.filter((text) => !source.includes(text));
  if (missing.length > 0) throw new Error(`Root AGENTS.md is missing OpenSpec mandates: ${missing.join(", ")}.`);
}

function validateBootstrapState(paths, state) {
  const legacySpec = path.join(paths.root, "specs", `${BOOTSTRAP_SLUG}.md`);
  const legacyTasks = path.join(paths.root, "specs", `${BOOTSTRAP_SLUG}.tasks.md`);
  const pieces = [paths.legacyRoadmap, legacySpec, legacyTasks];
  const count = pieces.filter(existsSync).length;
  if (count === 0) return;
  if (count !== pieces.length) throw new Error("Legacy bootstrap workflow state is incomplete or contradictory.");
  const bootstrapItem = state.bySlug.get(BOOTSTRAP_SLUG);
  if (!bootstrapItem) throw new Error("Legacy bootstrap files exist without the canonical YAML roadmap item.");
  if (bootstrapItem.prerequisites.length > 0) throw new Error("Canonical YAML bootstrap item must remain unblocked.");
  if (state.active.includes(BOOTSTRAP_SLUG)) throw new Error("The legacy bootstrap must not be duplicated as an OpenSpec change.");
  const legacySource = readFileSync(paths.legacyRoadmap, "utf8");
  const heading = `### \`${BOOTSTRAP_SLUG}\``;
  const start = legacySource.indexOf(heading);
  const next = start < 0 ? -1 : legacySource.indexOf("\n### ", start + heading.length);
  const section = start < 0 ? "" : legacySource.slice(start, next < 0 ? undefined : next);
  if (!/^Status: in-progress\s*$/m.test(section) || !/^Prerequisite: none\s*$/m.test(section)) {
    throw new Error("Frozen legacy roadmap does not authorize the bootstrap migration.");
  }
}

function validateActiveScaffold(paths, slug) {
  const directory = path.join(paths.activeChanges, slug);
  const metadataFile = path.join(directory, ".openspec.yaml");
  if (!existsSync(metadataFile)) throw new Error(`Active change ${slug} is missing .openspec.yaml.`);
  let metadata;
  try {
    metadata = parse(readFileSync(metadataFile, "utf8"));
  } catch (error) {
    throw new Error(`Active change ${slug} has invalid .openspec.yaml: ${error.message}`);
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error(`Active change ${slug} metadata must be a mapping.`);
  const allowed = new Set(["schema", "created", "goal", "affected_areas", "initiative", "skip_specs"]);
  const unknown = Object.keys(metadata).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`Active change ${slug} metadata has unknown fields: ${unknown.join(", ")}.`);
  if (metadata.schema !== "spec-driven") throw new Error(`Active change ${slug} must use the spec-driven schema.`);
  if (metadata.created !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.created)) {
    throw new Error(`Active change ${slug} has invalid created metadata.`);
  }
  if (metadata.skip_specs !== undefined && typeof metadata.skip_specs !== "boolean") {
    throw new Error(`Active change ${slug} has invalid skip_specs metadata.`);
  }
  if (metadata.goal !== undefined && (typeof metadata.goal !== "string" || metadata.goal.trim() === "")) {
    throw new Error(`Active change ${slug} has invalid goal metadata.`);
  }
  if (metadata.affected_areas !== undefined && (
    !Array.isArray(metadata.affected_areas)
    || metadata.affected_areas.some((area) => typeof area !== "string" || area.trim() === "")
  )) {
    throw new Error(`Active change ${slug} has invalid affected_areas metadata.`);
  }
  if (metadata.initiative !== undefined) {
    const initiative = metadata.initiative;
    const valid = initiative
      && typeof initiative === "object"
      && !Array.isArray(initiative)
      && Object.keys(initiative).length === 2
      && typeof initiative.store === "string"
      && typeof initiative.id === "string"
      && /^([a-z0-9]+)(?:-[a-z0-9]+)*$/.test(initiative.store)
      && /^([a-z0-9]+)(?:-[a-z0-9]+)*$/.test(initiative.id);
    if (!valid) throw new Error(`Active change ${slug} has invalid initiative metadata.`);
  }
}

export function validateWorkflow(paths = repositoryPaths(), options = {}) {
  if (existsSync(paths.lock) && !options.allowLifecycleLock) {
    throw new Error(`Lifecycle lock exists at ${paths.lock}; inspect recorded state before validation or mutation.`);
  }
  const state = validateRoadmap(paths);
  validateAgentContract(paths);
  validateBootstrapState(paths, state);
  for (const slug of state.active) {
    const directory = path.join(paths.activeChanges, slug);
    validateActiveScaffold(paths, slug);
    if (hasUncheckedTasks(directory) && options.requireCompletedTasks) {
      throw new Error(`Active change ${slug} has unchecked implementation tasks.`);
    }
  }
  if (existsSync(paths.archives)) {
    for (const entry of readdirSync(paths.archives, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name.replace(/^\d{4}-\d{2}-\d{2}-/, "");
      const evidence = path.join(paths.archives, entry.name, "verification.md");
      if (slug !== BOOTSTRAP_SLUG && !existsSync(evidence)) {
        throw new Error(`Archived OpenSpec change ${slug} is missing verification.md.`);
      }
    }
  }
  return state;
}

export async function selectChange(paths, slug, options = {}) {
  const target = path.join(paths.activeChanges, slug);
  return withLifecycleTransaction(paths, `opsx:select:${slug}`, [target], () => {
    const state = validateWorkflow(paths, { allowLifecycleLock: true });
    const item = state.bySlug.get(slug);
    if (!item) throw new Error(`Roadmap item not found: ${slug}.`);
    if (item.prerequisites.length > 0) throw new Error(`Roadmap item ${slug} is blocked by: ${item.prerequisites.join(", ")}.`);
    if (state.active.includes(slug) || state.archived.includes(slug) || existsSync(target)) {
      throw new Error(`OpenSpec change identity is already active or reserved: ${slug}.`);
    }
    const createChange = options.createChange ?? ((changeSlug) => runOpenSpec(paths.root, ["new", "change", changeSlug, "--schema", "spec-driven", "--json"]));
    createChange(slug);
    if (!existsSync(target)) throw new Error(`OpenSpec did not create expected change directory: ${target}.`);
    validateWorkflow(paths, { allowLifecycleLock: true });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, slug] = process.argv.slice(2);
  const paths = repositoryPaths(root);
  try {
    if (command === "validate") {
      const state = validateWorkflow(paths);
      process.stdout.write(`Workflow valid: ${state.items.length} roadmap items, ${state.active.length} active changes.\n`);
    } else if (command === "select" && slug) {
      await selectChange(paths, slug);
      process.stdout.write(`Selected ${slug} as an active OpenSpec change.\n`);
    } else {
      throw new Error("Usage: node scripts/workflow.mjs <validate|select <slug>>");
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
