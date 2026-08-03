import { spawnSync } from "node:child_process";
import path from "node:path";

export function runOpenSpec(root, args, options = {}) {
  const cli = path.join(root, "node_modules", "@fission-ai", "openspec", "bin", "openspec.js");
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd ?? root,
    env: { ...process.env, OPENSPEC_TELEMETRY: "0", ...options.env },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`OpenSpec command failed (${args.join(" ")}):\n${result.stdout ?? ""}${result.stderr ?? ""}`.trim());
  }
  return result.stdout;
}
