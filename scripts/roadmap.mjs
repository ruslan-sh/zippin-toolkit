import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  repositoryPaths,
  validateRoadmap,
  validateRoadmapDocument,
  withLifecycleTransaction,
  writeDocument,
} from "./workflow/lifecycle.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseAddArguments(args) {
  const result = { prerequisites: [] };
  const allowed = new Set(["--area", "--slug", "--description", "--prerequisite"]);
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (!allowed.has(flag) || value === undefined || value.startsWith("--")) {
      throw new Error(`Invalid roadmap:add arguments near ${flag ?? "end of command"}.`);
    }
    index += 1;
    if (flag === "--prerequisite") result.prerequisites.push(value);
    else result[flag.slice(2)] = value;
  }
  for (const required of ["area", "slug", "description"]) {
    if (!result[required]) throw new Error(`roadmap:add requires --${required}.`);
  }
  return result;
}

export async function addRoadmapItem(paths, input, options = {}) {
  return withLifecycleTransaction(paths, `roadmap:add:${input.slug}`, [paths.roadmap], () => {
    const state = validateRoadmap(paths);
    const area = state.areas.find((candidate) => candidate.key === input.area);
    if (!area) throw new Error(`Unknown roadmap area: ${input.area}.`);
    if (state.bySlug.has(input.slug) || state.active.includes(input.slug) || state.archived.includes(input.slug)) {
      throw new Error(`OpenSpec slug is already live or reserved: ${input.slug}.`);
    }
    if (new Set(input.prerequisites).size !== input.prerequisites.length) throw new Error(`Duplicate prerequisite for ${input.slug}.`);
    if (input.prerequisites.includes(input.slug)) throw new Error(`Roadmap item ${input.slug} cannot depend on itself.`);
    for (const prerequisite of input.prerequisites) {
      if (!state.bySlug.has(prerequisite)) throw new Error(`Unknown prerequisite: ${prerequisite}.`);
    }
    area.itemsNode.add(state.document.createNode({
      slug: input.slug,
      prerequisites: input.prerequisites,
      description: input.description,
    }));
    validateRoadmapDocument(state.document, paths);
    writeDocument(paths.roadmap, state.document);
    options.afterWrite?.();
    validateRoadmap(paths);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  const paths = repositoryPaths(root);
  try {
    if (command === "validate") {
      const state = validateRoadmap(paths);
      process.stdout.write(`Roadmap valid: ${state.items.length} items in ${state.areas.length} areas.\n`);
    } else if (command === "add") {
      const input = parseAddArguments(args);
      await addRoadmapItem(paths, input);
      process.stdout.write(`Added roadmap item ${input.slug} to ${input.area}.\n`);
    } else {
      throw new Error("Usage: node scripts/roadmap.mjs <validate|add> [arguments]");
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
