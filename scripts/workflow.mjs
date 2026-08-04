import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "yaml";
import {
  BOOTSTRAP_SLUG,
  archivedChangeSlugs,
  repositoryPaths,
  validateRoadmap,
  writeDocument,
  withLifecycleTransaction,
} from "./workflow/lifecycle.mjs";
import { runOpenSpec } from "./workflow/openspec.mjs";
import { recordVerification, requireFreshVerification } from "./workflow/verification.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_AGENT_CONTRACT = [
  "$openspec-verify-change",
  "independent read-only review",
  "fresh verification receipt",
  "$openspec-archive-change",
  "npm run opsx:archive",
  "Raw OpenSpec archival is unsupported",
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

export function removeRoadmapItemAndPrerequisites(paths, slug, options = {}) {
  const archived = options.allowArchivedSlug
    ? archivedChangeSlugs(paths).filter((entry) => entry !== slug)
    : undefined;
  const state = validateRoadmap(paths, archived ? { archived } : {});
  const item = state.bySlug.get(slug);
  if (!item) throw new Error(`Roadmap item not found: ${slug}.`);
  const area = state.areas.find((entry) => entry.key === item.area);
  area.itemsNode.items = area.itemsNode.items.filter((node) => node !== item.node);
  for (const candidate of state.items) {
    if (!candidate.prerequisites.includes(slug)) continue;
    candidate.prerequisitesNode.items = candidate.prerequisitesNode.items.filter((node) => String(node?.value ?? node) !== slug);
  }
  writeDocument(paths.roadmap, state.document);
}

function assertArtifactsComplete(paths, slug, options) {
  const getStatus = options.getStatus ?? (() => JSON.parse(runOpenSpec(paths.root, ["status", "--change", slug, "--json"])));
  const status = getStatus(slug);
  const artifacts = status?.artifacts;
  if (!Array.isArray(artifacts) || artifacts.length === 0) throw new Error(`OpenSpec status for ${slug} did not report artifacts.`);
  const incomplete = artifacts.filter((artifact) => !["done", "skipped"].includes(artifact.status));
  if (incomplete.length > 0) throw new Error(`OpenSpec change ${slug} has incomplete artifacts: ${incomplete.map((artifact) => artifact.id ?? artifact.name ?? "unknown").join(", ")}.`);
}

function runDiffCheck(paths) {
  const result = spawnSync("git", ["diff", "--check"], { cwd: paths.root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git diff --check failed:\n${result.stdout}${result.stderr}`.trim());
}

export async function archiveChange(paths, slug, options = {}) {
  const target = path.join(paths.activeChanges, slug);
  const receipt = path.join(paths.receipts, `${slug}.json`);
  const snapshots = [paths.roadmap, target, paths.archives, paths.currentSpecs, receipt];
  return withLifecycleTransaction(paths, `opsx:archive:${slug}`, snapshots, () => {
    const state = validateWorkflow(paths, { allowLifecycleLock: true, requireCompletedTasks: true });
    if (!state.active.includes(slug)) throw new Error(`Active OpenSpec change not found: ${slug}.`);
    assertArtifactsComplete(paths, slug, options);
    requireFreshVerification(paths, slug);
    const strictValidate = options.strictValidate ?? ((args) => runOpenSpec(paths.root, args));
    strictValidate(["validate", slug, "--strict"]);
    const hasDeltaSpecs = existsSync(path.join(target, "specs"));
    const archive = options.archive ?? ((args) => runOpenSpec(paths.root, args));
    archive(["archive", slug, "--yes", "--json", ...(hasDeltaSpecs ? [] : ["--skip-specs"])]);
    if (existsSync(target)) throw new Error(`OpenSpec archive left the active change in place: ${slug}.`);
    const matches = readdirSync(paths.archives, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.replace(/^\d{4}-\d{2}-\d{2}-/, "") === slug);
    if (matches.length !== 1) throw new Error(`OpenSpec archive did not create exactly one archive for ${slug}.`);
    removeRoadmapItemAndPrerequisites(paths, slug, { allowArchivedSlug: true });
    validateRoadmap(paths);
    validateWorkflow(paths, { allowLifecycleLock: true });
    strictValidate(["validate", "--all", "--strict"]);
    (options.diffCheck ?? (() => runDiffCheck(paths)))();
    rmSync(receipt, { force: true });
  });
}

export async function finalizeBootstrapRoadmap(paths) {
  return withLifecycleTransaction(paths, "opsx:finalize-bootstrap", [paths.roadmap, paths.legacyRoadmap], () => {
    const state = validateRoadmap(paths);
    if (!state.bySlug.has(BOOTSTRAP_SLUG)) throw new Error(`Bootstrap roadmap item not found: ${BOOTSTRAP_SLUG}.`);
    if (!existsSync(paths.legacyRoadmap)) throw new Error("Frozen legacy bootstrap roadmap is missing.");
    removeRoadmapItemAndPrerequisites(paths, BOOTSTRAP_SLUG);
    rmSync(paths.legacyRoadmap);
    validateRoadmap(paths);
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
    } else if (command === "record-verification" && slug) {
      const receipt = recordVerification(paths, slug);
      process.stdout.write(`Recorded fresh verification for ${slug}: ${receipt.fingerprint}.\n`);
    } else if (command === "archive" && slug) {
      await archiveChange(paths, slug);
      process.stdout.write(`Archived verified OpenSpec change ${slug}.\n`);
    } else if (command === "finalize-bootstrap" && !slug) {
      await finalizeBootstrapRoadmap(paths);
      process.stdout.write("Removed the legacy bootstrap from the canonical roadmap.\n");
    } else {
      throw new Error("Usage: node scripts/workflow.mjs <validate|select <slug>|record-verification <slug>|archive <slug>|finalize-bootstrap>");
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
