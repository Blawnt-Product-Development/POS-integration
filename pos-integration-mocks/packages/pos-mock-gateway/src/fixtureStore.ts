import fs from "node:fs";
import path from "node:path";
import { URLSearchParams } from "node:url";

export type FixtureMatch = { file: string; json: unknown };

function sanitizePath(p: string): string {
  // "/o/op/data/businesses" -> "o__op__data__businesses"
  return p
    .replace(/^\/+/, "")
    .replace(/[\/]/g, "__")
    .replace(/[^a-zA-Z0-9_\-__.]/g, "_");
}

function normalizeQuery(rawQuery: string, ignoreKeys: Set<string>): string {
  const sp = new URLSearchParams(rawQuery || "");
  const entries: Array<[string, string]> = [];

  for (const [k, v] of sp.entries()) {
    if (ignoreKeys.has(k)) continue;
    entries.push([k, v]);
  }

  // stable ordering: key then value
  entries.sort(([ak, av], [bk, bv]) => (ak === bk ? av.localeCompare(bv) : ak.localeCompare(bk)));

  const normalized = new URLSearchParams();
  for (const [k, v] of entries) normalized.append(k, v);

  return normalized.toString();
}

export function getCandidateFixtureFiles(params: {
  fixturesDir: string;
  method: string;
  requestPath: string;
  rawQuery: string;
  ignoreQueryKeys: Set<string>;
}): string[] {
  const methodDir = path.join(params.fixturesDir, params.method.toUpperCase());
  const base = sanitizePath(params.requestPath);

  const normalized = normalizeQuery(params.rawQuery, params.ignoreQueryKeys);
  const candidates: string[] = [];

  if (normalized) candidates.push(path.join(methodDir, `${base}__q__${normalized}.json`));
  candidates.push(path.join(methodDir, `${base}.json`));

  return candidates;
}

export function tryLoadFixture(params: {
  fixturesDir: string;
  method: string;
  requestPath: string;
  rawQuery: string;
  ignoreQueryKeys: Set<string>;
}): FixtureMatch | null {
  const candidates = getCandidateFixtureFiles(params);

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf-8");
    return { file, json: JSON.parse(raw) };
  }
  return null;
}
