import * as z from "zod/v4";

const handoffStateSchema = z.object({
  schemaVersion: z.literal(1),
  cycle: z.number().int().min(0),
  phase: z.string().min(1).max(64),
  lastWriter: z.enum(["onboarding", "reviewer", "implementer"]),
  nextTaskStatus: z.string().min(1).max(64),
  resultStatus: z.string().min(1).max(64),
  reviewStatus: z.string().min(1).max(64),
  repositoryRevision: z.string().min(1).max(256).nullable().optional(),
  updatedAt: z.string().min(1).max(128).optional(),
}).strict();

export type HandoffState = z.infer<typeof handoffStateSchema>;

export function validateAndNormalizeHandoffState(content: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("STATE.json content must be valid JSON.");
  }

  const result = handoffStateSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? issue.path.join(".") : "STATE.json";
    throw new Error(`STATE.json does not match the handoff schema at ${path}: ${issue?.message ?? "invalid state"}.`);
  }

  return `${JSON.stringify(result.data, null, 2)}\n`;
}
