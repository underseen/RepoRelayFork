import assert from "node:assert/strict";
import { validateAndNormalizeHandoffState } from "./handoff-state.js";

const valid = validateAndNormalizeHandoffState(JSON.stringify({
  schemaVersion: 1,
  cycle: 2,
  phase: "ready_for_review",
  lastWriter: "implementer",
  nextTaskStatus: "complete",
  resultStatus: "complete",
  reviewStatus: "pending",
  repositoryRevision: "abc123",
  updatedAt: "2026-08-22T08:00:00.000Z",
}));
const parsed = JSON.parse(valid) as Record<string, unknown>;
assert.equal(parsed.schemaVersion, 1);
assert.equal(parsed.phase, "ready_for_review");

assert.throws(() => validateAndNormalizeHandoffState("{}"), /handoff schema/);
assert.throws(() => validateAndNormalizeHandoffState(JSON.stringify({
  schemaVersion: 1,
  cycle: 0,
  phase: "setup_required",
  lastWriter: "reviewer",
  nextTaskStatus: "pending",
  resultStatus: "pending",
  reviewStatus: "pending",
  unexpected: true,
})), /handoff schema/);

console.log("Handoff state schema checks passed");
