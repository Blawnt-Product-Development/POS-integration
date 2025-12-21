import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import { getCandidateFixtureFiles, tryLoadFixture } from "./fixtureStore.js";

export type GatewayConfig = {
  port: number;
  prismUrl: string;
  fixturesDir: string;
  ignoreQueryKeys: string[];
  logLevel: "dev" | "combined" | "tiny";
};

function parseRawQueryFromOriginalUrl(originalUrl: string): string {
  const idx = originalUrl.indexOf("?");
  return idx >= 0 ? originalUrl.slice(idx + 1) : "";
}

export function createGatewayServer(cfg: GatewayConfig) {
  const app = express();
  app.use(express.json({ limit: "4mb" }));
  app.use(morgan(cfg.logLevel));

  const ignoreSet = new Set(cfg.ignoreQueryKeys);

  app.get("/__health", (_req, res) => {
    res.json({
      ok: true,
      port: cfg.port,
      prismUrl: cfg.prismUrl,
      fixturesDir: cfg.fixturesDir,
      ignoreQueryKeys: cfg.ignoreQueryKeys
    });
  });

  // Developer UX: tells the intern exactly what filename(s) to create
  // Example:
  // /__fixture_hint?method=GET&path=/financialv2/sales&query=from=2025-12-01&to=2025-12-02&locationId=123
  app.get("/__fixture_hint", (req, res) => {
    const method = String(req.query.method || "GET").toUpperCase();
    const requestPath = String(req.query.path || "/");
    const rawQuery = String(req.query.query || "");
    const candidates = getCandidateFixtureFiles({
      fixturesDir: cfg.fixturesDir,
      method,
      requestPath,
      rawQuery,
      ignoreQueryKeys: ignoreSet
    });
    res.json({ method, path: requestPath, query: rawQuery, candidates });
  });

  // Fixture match (exact query first, then path-only)
  app.use((req, res, next) => {
    if (req.path.startsWith("/__")) return next();

    const rawQuery = parseRawQueryFromOriginalUrl(req.originalUrl);

    const hit = tryLoadFixture({
      fixturesDir: cfg.fixturesDir,
      method: req.method,
      requestPath: req.path,
      rawQuery,
      ignoreQueryKeys: ignoreSet
    });

    if (!hit) return next();

    res.setHeader("x-mock-fixture", hit.file);
    return res.status(200).json(hit.json);
  });

  // Fallback proxy to Prism (OpenAPI mock)
  app.use(
    "/",
    createProxyMiddleware({
      target: cfg.prismUrl,
      changeOrigin: true
    })
  );

  return app;
}
