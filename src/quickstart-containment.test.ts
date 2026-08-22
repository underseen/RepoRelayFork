import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, symlink } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initializeHandoffFiles } from "./quickstart.js";

const runRoot = await mkdtemp(join(tmpdir(), "reporelay-quickstart-containment-test-"));
const workspace = join(runRoot, "workspace");
const outside = join(runRoot, "outside");
await mkdir(workspace, { recursive: true });
await mkdir(outside, { recursive: true });

await symlink(outside, join(workspace, ".ai-handoff"), process.platform === "win32" ? "junction" : "dir");

await assert.rejects(
  () => initializeHandoffFiles(workspace),
  /real directory|link|junction/i,
  "quickstart must reject a redirected .ai-handoff directory before creating handoff files",
);

for (const name of ["NEXT_TASK.md", "REVIEW.md", "RESULT.md", "STATE.json"]) {
  await assert.rejects(
    () => access(join(outside, name), constants.F_OK),
    `quickstart must not write ${name} through a redirected .ai-handoff directory`,
  );
}

console.log(`Quickstart containment fixture preserved at ${runRoot}`);
