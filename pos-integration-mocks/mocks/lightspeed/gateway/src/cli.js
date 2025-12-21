import path from "node:path";
import process from "node:process";
import { createGatewayServer } from "./server.js";

function parseCsv(v) {
  return (v || "").split(",").map(s => s.trim()).filter(Boolean);
}

const port = Number(process.env.PORT || "4020");
const prismUrl = String(process.env.PRISM_URL || "http://prism:4010");
const fixturesDir = String(process.env.FIXTURES_DIR || path.resolve(process.cwd(), "fixtures"));
const ignoreQueryKeys = parseCsv(process.env.IGNORE_QUERY_KEYS || "cursor,pageToken,limit,offset");
const logLevel = String(process.env.LOG_LEVEL || "dev");

const app = createGatewayServer({
  port,
  prismUrl,
  fixturesDir,
  ignoreQueryKeys,
  logLevel
});

app.listen(port, () => {
  console.log(`pos-mock-gateway listening on http://0.0.0.0:${port}`);
  console.log(`proxying to Prism: ${prismUrl}`);
  console.log(`fixtures: ${fixturesDir}`);
  console.log(`ignore query keys: ${ignoreQueryKeys.join(",")}`);
});
