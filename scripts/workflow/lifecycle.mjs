import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parseDocument, isMap, isSeq } from "yaml";

export const BOOTSTRAP_SLUG = "migrate-agentic-flow-to-open-spec";
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AREA_KEYS = new Set(["description", "items"]);
const ITEM_KEYS = new Set(["slug", "prerequisites", "description"]);

export function repositoryPaths(root = process.cwd()) {
  return {
    root,
    roadmap: path.join(root, "specs", "roadmap.yml"),
    legacyRoadmap: path.join(root, "specs", "roadmap-legacy.md"),
    openspec: path.join(root, "openspec"),
    activeChanges: path.join(root, "openspec", "changes"),
    archives: path.join(root, "openspec", "changes", "archive"),
    currentSpecs: path.join(root, "openspec", "specs"),
    receipts: path.join(root, "openspec", ".verification"),
    lock: path.join(root, "openspec", ".lifecycle-lock"),
  };
}

function keysOf(map) {
  return map.items.map((pair) => String(pair.key?.value ?? pair.key));
}

function assertExactKeys(map, allowed, label) {
  const unknown = keysOf(map).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`${label} has unknown fields: ${unknown.join(", ")}.`);
}

function sequenceValues(node, label) {
  if (!isSeq(node)) throw new Error(`${label} must be a YAML sequence.`);
  return node.items.map((item) => String(item?.value ?? item));
}

export function parseRoadmap(file) {
  const source = readFileSync(file, "utf8");
  const document = parseDocument(source, { keepSourceTokens: true });
  if (document.errors.length > 0) throw new Error(document.errors.map((error) => error.message).join("\n"));
  return { source, document };
}

export function activeChangeSlugs(paths) {
  if (!existsSync(paths.activeChanges)) return [];
  return readdirSync(paths.activeChanges, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => entry.name);
}

export function archivedChangeSlugs(paths) {
  if (!existsSync(paths.archives)) return [];
  return readdirSync(paths.archives, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name.replace(/^\d{4}-\d{2}-\d{2}-/, ""));
}

export function validateRoadmapDocument(document, paths, options = {}) {
  const root = document.contents;
  if (!isMap(root)) throw new Error("Roadmap root must be a YAML mapping.");
  const rootKeys = keysOf(root);
  if (!rootKeys.includes("version")) throw new Error("Roadmap requires version.");
  const version = document.get("version", true);
  if (version?.value !== 1) throw new Error("Roadmap version must be exactly 1.");

  const areas = [];
  const items = [];
  const bySlug = new Map();
  for (const key of rootKeys.filter((key) => key !== "version")) {
    if (!SLUG_PATTERN.test(key)) throw new Error(`Area key must be kebab-case: ${key}.`);
    const area = document.get(key, true);
    if (!isMap(area)) throw new Error(`Area ${key} must be a mapping.`);
    assertExactKeys(area, AREA_KEYS, `Area ${key}`);
    if (typeof area.get("description") !== "string" || area.get("description").trim() === "") {
      throw new Error(`Area ${key} requires a description.`);
    }
    const itemSequence = area.get("items", true);
    if (!isSeq(itemSequence)) throw new Error(`Area ${key} items must be a sequence.`);
    areas.push({ key, node: area, itemsNode: itemSequence });
    for (const node of itemSequence.items) {
      if (!isMap(node)) throw new Error(`Every item in ${key} must be a mapping.`);
      assertExactKeys(node, ITEM_KEYS, `Roadmap item in ${key}`);
      const slug = node.get("slug");
      const description = node.get("description");
      if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) throw new Error(`Invalid roadmap slug: ${String(slug)}.`);
      if (typeof description !== "string" || description.trim() === "") throw new Error(`Roadmap item ${slug} requires a description.`);
      if (bySlug.has(slug)) throw new Error(`Duplicate roadmap slug: ${slug}.`);
      const prerequisitesNode = node.get("prerequisites", true);
      const prerequisites = sequenceValues(prerequisitesNode, `${slug}.prerequisites`);
      if (new Set(prerequisites).size !== prerequisites.length) throw new Error(`Duplicate prerequisite for ${slug}.`);
      if (prerequisites.includes(slug)) throw new Error(`Roadmap item ${slug} cannot depend on itself.`);
      const item = { area: key, node, slug, description, prerequisites, prerequisitesNode };
      items.push(item);
      bySlug.set(slug, item);
    }
  }

  for (const item of items) {
    for (const prerequisite of item.prerequisites) {
      if (!bySlug.has(prerequisite)) throw new Error(`Missing prerequisite ${prerequisite} referenced by ${item.slug}.`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(slug) {
    if (visiting.has(slug)) throw new Error(`Roadmap prerequisite cycle includes ${slug}.`);
    if (visited.has(slug)) return;
    visiting.add(slug);
    for (const dependency of bySlug.get(slug).prerequisites) visit(dependency);
    visiting.delete(slug);
    visited.add(slug);
  }
  for (const item of items) visit(item.slug);

  const active = options.active ?? activeChangeSlugs(paths);
  const archived = options.archived ?? archivedChangeSlugs(paths);
  const activeSet = new Set();
  for (const slug of active) {
    if (activeSet.has(slug)) throw new Error(`Duplicate active OpenSpec change identity: ${slug}.`);
    activeSet.add(slug);
    const item = bySlug.get(slug);
    if (!item && slug !== options.allowActiveWithoutRoadmap) throw new Error(`Active change ${slug} has no roadmap item.`);
    if (item && item.prerequisites.length > 0) throw new Error(`Active change ${slug} still has prerequisites.`);
  }
  const archivedSet = new Set();
  for (const slug of archived) {
    if (archivedSet.has(slug)) throw new Error(`Duplicate archived OpenSpec identity: ${slug}.`);
    if (activeSet.has(slug) || bySlug.has(slug)) throw new Error(`Reserved OpenSpec slug is reused: ${slug}.`);
    archivedSet.add(slug);
  }
  return { document, areas, items, bySlug, active, archived };
}

export function validateRoadmap(paths = repositoryPaths(), options = {}) {
  const { document } = parseRoadmap(paths.roadmap);
  return validateRoadmapDocument(document, paths, options);
}

export function writeDocument(file, document) {
  writeFileSync(file, String(document), "utf8");
}

export function setScalarPreservingStyle(map, key, value) {
  if (!isMap(map)) throw new Error("Scalar parent must be a YAML mapping.");
  const node = map.get(key, true);
  if (!node || typeof node !== "object" || !("value" in node)) throw new Error(`Missing scalar field: ${key}.`);
  node.value = value;
}

export function acquireLifecycleLock(paths, operation, affectedPaths = []) {
  mkdirSync(path.dirname(paths.lock), { recursive: true });
  let descriptor;
  try {
    descriptor = openSync(paths.lock, "wx");
  } catch (error) {
    if (error?.code === "EEXIST") {
      const details = readFileSync(paths.lock, "utf8");
      throw new Error(`Lifecycle operation is locked. Inspect ${paths.lock} before deliberate recovery. Recorded state:\n${details}`);
    }
    throw error;
  }
  const record = {
    version: 1,
    operation,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    affectedPaths: affectedPaths.map((entry) => path.relative(paths.root, entry)),
  };
  writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`);
  closeSync(descriptor);
  return record;
}

export function releaseLifecycleLock(paths) {
  rmSync(paths.lock, { force: true });
}

function captureEntry(target, base = target, result = new Map()) {
  if (!existsSync(target)) return result;
  const relative = path.relative(base, target) || ".";
  const stats = statSync(target);
  if (stats.isDirectory()) {
    result.set(relative, { type: "directory" });
    for (const entry of readdirSync(target)) captureEntry(path.join(target, entry), base, result);
  } else {
    result.set(relative, { type: "file", content: readFileSync(target) });
  }
  return result;
}

export function snapshotPaths(targets) {
  return targets.map((target) => ({ target, entries: captureEntry(target) }));
}

export function restoreSnapshot(snapshot) {
  for (const { target, entries } of snapshot) {
    rmSync(target, { recursive: true, force: true });
    for (const [relative, entry] of entries) {
      const destination = relative === "." ? target : path.join(target, relative);
      if (entry.type === "directory") mkdirSync(destination, { recursive: true });
      else {
        mkdirSync(path.dirname(destination), { recursive: true });
        writeFileSync(destination, entry.content);
      }
    }
  }
}

export async function withLifecycleTransaction(paths, operation, affectedPaths, callback) {
  acquireLifecycleLock(paths, operation, affectedPaths);
  let snapshot;
  try {
    snapshot = snapshotPaths(affectedPaths);
  } catch (error) {
    releaseLifecycleLock(paths);
    throw error;
  }
  try {
    const result = await callback();
    releaseLifecycleLock(paths);
    return result;
  } catch (operationError) {
    try {
      restoreSnapshot(snapshot);
    } catch (rollbackError) {
      throw new AggregateError([operationError, rollbackError], "Lifecycle operation failed and its snapshot could not be restored.");
    } finally {
      releaseLifecycleLock(paths);
    }
    throw operationError;
  }
}

export function hashContent(content) {
  return createHash("sha256").update(content).digest("hex");
}
