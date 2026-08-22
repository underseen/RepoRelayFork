import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readReviewTextRange } from "./review-output.js";

const workspace = await mkdtemp(join(tmpdir(), "reporelay-review-output-test-"));
await writeFile(join(workspace, "sample.txt"), "one\ntwo\nthree\nfour\n", "utf8");

assert.equal(await readReviewTextRange(workspace, "sample.txt"), "one\ntwo\nthree\nfour\n");
assert.equal(await readReviewTextRange(workspace, "sample.txt", { startLine: 2, endLine: 3 }), "two\nthree");
await assert.rejects(() => readReviewTextRange(workspace, "sample.txt", { startLine: 99 }), /exceeds file length/);

await writeFile(join(workspace, "large.txt"), "x".repeat(10_000), "utf8");
const limited = await readReviewTextRange(workspace, "large.txt", { maxBytes: 1_024 });
assert.ok(Buffer.byteLength(limited, "utf8") < 1_300);
assert.match(limited, /output truncated at 1024 bytes/);

console.log(`Review output fixture preserved at ${workspace}`);
