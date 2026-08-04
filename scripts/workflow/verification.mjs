import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { hashContent, SLUG_PATTERN } from "./lifecycle.mjs";

export const REQUIRED_VERIFICATION_COMMANDS = [
  "npm run roadmap:validate",
  "npm run workflow:validate",
  "npm run openspec:check",
  "npm run openspec -- validate --all --strict",
  "npm test",
  "npm run lint",
  "npm run lint:styles",
  "npm run build",
  "git diff --check",
];

function git(paths, args) {
  const result = spawnSync("git", args, { cwd: paths.root, encoding: null });
  if (result.status !== 0) {
    throw new Error(`Git command failed (${args.join(" ")}): ${result.stderr?.toString("utf8").trim() ?? "unknown error"}`);
  }
  return result.stdout;
}

function evidencePath(paths, slug) {
  return path.join(paths.activeChanges, slug, "verification.md");
}

function receiptPath(paths, slug) {
  return path.join(paths.receipts, `${slug}.json`);
}

function parseEvidence(source, slug) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) throw new Error(`${slug}/verification.md requires YAML front matter.`);
  let value;
  try {
    value = parse(match[1]);
  } catch (error) {
    throw new Error(`${slug}/verification.md has invalid YAML: ${error.message}`);
  }
  const exactKeys = ["version", "reviewer", "iterations", "outcome", "findings", "commands", "fingerprint"];
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Verification evidence must be a mapping.");
  const unknown = Object.keys(value).filter((key) => !exactKeys.includes(key));
  const missing = exactKeys.filter((key) => !(key in value));
  if (unknown.length || missing.length) throw new Error(`Verification evidence fields are invalid (missing: ${missing.join(", ") || "none"}; unknown: ${unknown.join(", ") || "none"}).`);
  if (value.version !== 1) throw new Error("Verification evidence version must be 1.");
  if (typeof value.reviewer !== "string" || value.reviewer.trim() === "") throw new Error("Verification reviewer identity is required.");
  if (!Number.isInteger(value.iterations) || value.iterations < 1 || value.iterations > 3) throw new Error("Verification iterations must be an integer from 1 to 3.");
  if (value.outcome !== "clean") throw new Error("Verification outcome must be clean.");
  if (!Array.isArray(value.findings) || value.findings.length === 0 || value.findings.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error("Verification findings must be a non-empty string sequence; use 'none' for a clean first review.");
  }
  if (!value.commands || typeof value.commands !== "object" || Array.isArray(value.commands)) throw new Error("Verification commands must be a mapping.");
  const commandKeys = Object.keys(value.commands);
  if (commandKeys.length !== REQUIRED_VERIFICATION_COMMANDS.length || REQUIRED_VERIFICATION_COMMANDS.some((command) => value.commands[command] !== "pass")) {
    throw new Error("Verification evidence must record every required command exactly once with result 'pass'.");
  }
  if (typeof value.fingerprint !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value.fingerprint)) throw new Error("Verification fingerprint must use sha256:<64 lowercase hex>.");
  return value;
}

function trackedAndUntracked(paths) {
  const output = git(paths, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  return output.toString("utf8").split("\0").filter(Boolean).sort();
}

export function computeRepositoryFingerprint(paths, slug, source = readFileSync(evidencePath(paths, slug), "utf8")) {
  const relativeEvidence = path.relative(paths.root, evidencePath(paths, slug)).replaceAll("\\", "/");
  const relativeReceipt = path.relative(paths.root, receiptPath(paths, slug)).replaceAll("\\", "/");
  const relativeLock = path.relative(paths.root, paths.lock).replaceAll("\\", "/");
  const files = trackedAndUntracked(paths).filter((file) => {
    const normalized = file.replaceAll("\\", "/");
    return normalized !== relativeEvidence && normalized !== relativeReceipt && normalized !== relativeLock;
  });
  const head = git(paths, ["rev-parse", "HEAD"]).toString("utf8").trim();
  const summary = source.replace(/^(fingerprint:\s*).+$/m, "$1sha256:<computed>");
  const parts = [`head\0${head}\0`, `verification\0${hashContent(summary)}\0`];
  for (const file of files) {
    const absolute = path.join(paths.root, file);
    const digest = existsSync(absolute) ? hashContent(readFileSync(absolute)) : "<deleted>";
    parts.push(`file\0${file.replaceAll("\\", "/")}\0${digest}\0`);
  }
  return `sha256:${hashContent(parts.join(""))}`;
}

export function clearVerificationReceipt(paths, slug) {
  rmSync(receiptPath(paths, slug), { force: true });
}

export function recordVerification(paths, slug) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid change slug: ${slug}.`);
  const change = path.join(paths.activeChanges, slug);
  if (!existsSync(change)) throw new Error(`Active OpenSpec change not found: ${slug}.`);
  clearVerificationReceipt(paths, slug);
  const file = evidencePath(paths, slug);
  if (!existsSync(file)) throw new Error(`Verification evidence not found: ${file}.`);
  const source = readFileSync(file, "utf8");
  const evidence = parseEvidence(source, slug);
  const fingerprint = computeRepositoryFingerprint(paths, slug, source);
  if (evidence.fingerprint !== fingerprint) throw new Error(`Verification fingerprint is stale or incorrect; expected ${fingerprint}.`);
  const receipt = {
    version: 1,
    slug,
    reviewer: evidence.reviewer,
    iterations: evidence.iterations,
    fingerprint,
    evidenceHash: hashContent(source),
  };
  mkdirSync(paths.receipts, { recursive: true });
  writeFileSync(receiptPath(paths, slug), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return receipt;
}

export function requireFreshVerification(paths, slug) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid change slug: ${slug}.`);
  const file = receiptPath(paths, slug);
  if (!existsSync(file)) throw new Error(`Fresh verification receipt is missing for ${slug}.`);
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Verification receipt for ${slug} is malformed: ${error.message}`);
  }
  const source = readFileSync(evidencePath(paths, slug), "utf8");
  const evidence = parseEvidence(source, slug);
  const current = computeRepositoryFingerprint(paths, slug, source);
  if (
    receipt.version !== 1
    || receipt.slug !== slug
    || receipt.reviewer !== evidence.reviewer
    || receipt.iterations !== evidence.iterations
    || receipt.fingerprint !== current
    || evidence.fingerprint !== current
    || receipt.evidenceHash !== hashContent(source)
  ) {
    throw new Error(`Verification receipt for ${slug} is stale or does not match its evidence.`);
  }
  return receipt;
}
