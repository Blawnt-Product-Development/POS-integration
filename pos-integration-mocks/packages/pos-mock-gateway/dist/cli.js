import path from "node:path";
import process from "node:process";
import { createGatewayServer } from "./server.js";
function env(name, fallback) {
    return process.env[name] ?? fallback;
}
function parseCsv(val) {
    if (!val)
        return [];
    return val.split(",").map(s => s.trim()).filter(Boolean);
}
const port = Number(env("PORT", "4020"));
const prismUrl = String(env("PRISM_URL", "http://localhost:4010"));
const fixturesDir = String(env("FIXTURES_DIR", path.resolve(process.cwd(), "fixtures")));
const ignoreQueryKeys = parseCsv(env("IGNORE_QUERY_KEYS", "cursor,pageToken,limit,offset"));
const logLevel = env("LOG_LEVEL", "dev");
const app = createGatewayServer({
    port,
    prismUrl,
    fixturesDir,
    ignoreQueryKeys,
    logLevel
});
app.listen(port, () => {
    console.log(`pos-mock-gateway listening on http://localhost:${port}`);
    console.log(`proxying to Prism: ${prismUrl}`);
    console.log(`fixtures: ${fixturesDir}`);
    console.log(`ignore query keys: ${ignoreQueryKeys.join(",")}`);
    console.log(`hint: GET /__fixture_hint?method=GET&path=/x&query=a=1&b=2`);
});
