import { readReviewTextFile } from "./review-files.js";

export const DEFAULT_REVIEW_OUTPUT_BYTES = 64 * 1024;
export const MAX_REVIEW_OUTPUT_BYTES = 256 * 1024;

export interface ReviewReadOptions {
  startLine?: number;
  endLine?: number;
  maxBytes?: number;
}

function truncateUtf8(value: string, maxBytes: number): { text: string; truncated: boolean } {
  const buffer = Buffer.from(value, "utf8");
  if (buffer.length <= maxBytes) return { text: value, truncated: false };

  let end = maxBytes;
  while (end > 0 && end < buffer.length && (buffer[end] & 0xc0) === 0x80) end -= 1;
  return { text: buffer.subarray(0, end).toString("utf8"), truncated: true };
}

export async function readReviewTextRange(
  workspaceRoot: string,
  inputPath: string,
  options: ReviewReadOptions = {},
): Promise<string> {
  const content = await readReviewTextFile(workspaceRoot, inputPath);
  const startLine = options.startLine ?? 1;
  const maxBytes = Math.min(options.maxBytes ?? DEFAULT_REVIEW_OUTPUT_BYTES, MAX_REVIEW_OUTPUT_BYTES);

  if (!Number.isInteger(startLine) || startLine < 1) throw new Error("startLine must be a positive integer.");
  if (!Number.isInteger(maxBytes) || maxBytes < 1) throw new Error("maxBytes must be a positive integer.");

  const ranged = options.startLine !== undefined || options.endLine !== undefined;
  let selected = content;
  let rangeDescription = "";

  if (ranged) {
    const lines = content.split(/\r?\n/);
    const endLine = options.endLine ?? lines.length;
    if (!Number.isInteger(endLine) || endLine < startLine) {
      throw new Error("endLine must be an integer greater than or equal to startLine.");
    }
    if (startLine > lines.length) {
      throw new Error(`startLine ${startLine} exceeds file length (${lines.length} lines).`);
    }
    const boundedEnd = Math.min(endLine, lines.length);
    selected = lines.slice(startLine - 1, boundedEnd).join("\n");
    rangeDescription = `lines ${startLine}-${boundedEnd} of ${lines.length}`;
  }

  const limited = truncateUtf8(selected, maxBytes);
  if (!limited.truncated) return limited.text;

  const scope = rangeDescription ? `${rangeDescription}; ` : "";
  return `${limited.text}\n\n[RepoRelay: ${scope}output truncated at ${maxBytes} bytes. Use startLine/endLine to continue.]`;
}
