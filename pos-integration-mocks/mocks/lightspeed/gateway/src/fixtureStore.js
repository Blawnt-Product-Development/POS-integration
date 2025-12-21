import fs from "node:fs";
import path from "node:path";
import { URLSearchParams } from "node:url";

function sanitizePath(p) {
  return p
    .replace(/^\/+/, "")
    .replace(/[\/]/g, "__")
    .replace(/[^a-zA-Z0-9_\-__.]/g, "_");
}

function normalizeQuery(rawQuery, ignoreKeys) {
  const sp = new URLSearchParams(rawQuery || "");
  const entries = [];

  for (const [k, v] of sp.entries()) {
    if (ignoreKeys.has(k)) continue;
    entries.push([k, v]);
  }

  entries.sort(([ak, av], [bk, bv]) => (ak === bk ? av.localeCompare(bv) : ak.localeCompare(bk)));

  const normalized = new URLSearchParams();
  for (const [k, v] of entries) normalized.append(k, v);

  return normalized.toString();
}

export function getCandidateFixtureFiles({ fixturesDir, method, requestPath, rawQuery, ignoreQueryKeys }) {
  const methodDir = path.join(fixturesDir, method.toUpperCase());
  const base = sanitizePath(requestPath);

  const normalized = normalizeQuery(rawQuery, ignoreQueryKeys);
  const candidates = [];

  if (normalized) candidates.push(path.join(methodDir, `${base}__q__${normalized}.json`));
  candidates.push(path.join(methodDir, `${base}.json`));

  return candidates;
}

export function tryLoadFixture({ fixturesDir, method, requestPath, rawQuery, ignoreQueryKeys }) {
  const candidates = getCandidateFixtureFiles({ fixturesDir, method, requestPath, rawQuery, ignoreQueryKeys });

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf-8");
    return { file, json: JSON.parse(raw) };
  }
  return null;
}
