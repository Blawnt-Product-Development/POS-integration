# POS Integration Mocks (Prism + Fixture-First Gateway)

This repository provides a reusable mock framework to integrate multiple restaurant POS systems **without requiring real POS sandbox credentials**.

It is designed so an intern or new developer can:
- Mock a POS vendor API locally
- Control responses deterministically using fixtures (JSON files)
- Reuse the same framework to add new POS vendors quickly
- Unblock connector development and testing

---

## High-level Architecture

For each POS (example: Lightspeed), we run **two containers**:

### 1. Prism (OpenAPI Mock Server)
- Loads a POS OpenAPI specification
- Automatically mocks endpoints and schemas
- Acts as a fallback when no fixture exists

### 2. POS Mock Gateway (Fixture-first Proxy)
- Receives client calls (your connector calls the gateway)
- If a **fixture** exists for the request, returns it (deterministic)
- Otherwise, proxies the request to Prism (automatic mock fallback)
- Supports querystring variants (optionally ignoring volatile query keys)

```
Connector / Client
        |
        v
POS Mock Gateway  --->  Fixtures (JSON)
        |
        v
      Prism  ---> OpenAPI Spec
```

**Why this design?**
- Fast bootstrap from OpenAPI
- Deterministic testing via fixtures
- Same architecture reused for all POS vendors
- Close parity with real POS APIs

---

## Repository Structure

```
mocks/
  lightspeed/
    docker-compose.yml
    openapi.json
    fixtures/
      GET/
      POST/
    gateway/
      Dockerfile
      package.json
      src/
docs/
  ARCHITECTURE.md
  INTERN_PLAYBOOK.md
  NEW_POS_CHECKLIST.md
README.md
```

> Note: Each POS mock is self-contained under `mocks/<posName>/`.

---

## Prerequisites

You must have installed:
- Docker + Docker Compose (Docker Desktop)
- Node.js (recommended v20) — only needed if you run utilities outside Docker

---

## Quick Start (Lightspeed Example)

From the repository root:

```bash
docker compose -f mocks/lightspeed/docker-compose.yml up --build
```

Expected logs:
- `pos-mock-gateway listening on http://0.0.0.0:4020`
- `Prism is listening on http://0.0.0.0:4010`

### URLs
| Component | URL |
|---------|-----|
| Gateway | http://localhost:4020 |
| Prism (internal) | http://localhost:4010 |

> All connector calls must target the **gateway**, not Prism directly.

### Health check

Open:
- http://localhost:4020/__health

---

## How the Mock Gateway Works

### Request Flow
1. Gateway receives request (ex : GET http://localhost:4020/o/op/data/businesses?limit=50&cursor=abc )
2. Gateway checks if a matching fixture exists (method + path + query)
3. If found → returns fixture JSON with header:
	- x-mock-fixture: <fixture_file_path>
4. If not found → proxies request to Prism

### Fixture Priority
- Exact path + normalized querystring
- Path-only fixture (query ignored)
- Prism fallback

---

## Fixture Naming Convention

Fixtures are stored under:

```
fixtures/<METHOD>/<SANITIZED_PATH>.json
fixtures/<METHOD>/<SANITIZED_PATH>__q__<NORMALIZED_QUERY>.json
```
Where:
- METHOD is GET, POST, etc.
- SANITIZED_PATH replaces / with __

### Path Sanitization
- `/o/op/data/businesses`
- becomes
- `o__op__data__businesses`

Example:
```
mocks/lightspeed/fixtures/GET/o__op__data__businesses.json
```

### Querystring Fixtures
If you want query-specific fixtures, the gateway can match a query-based fixture too:

```
fixtures/GET/o__op__data__businesses__q__from=2025-01-01&to=2025-01-31.json
```

Query params are:
- URL-decoded
- Sorted alphabetically
- Filtered to remove ignored keys

---

## Ignored Query Parameters

Some query params are volatile (pagination tokens, limits).  
They are ignored when matching fixtures using:

```
IGNORE_QUERY_KEYS=cursor,pageToken,limit,offset
```

This allows multiple paginated requests to reuse one fixture.

So these requests map to the same fixture:
- ?cursor=a&limit=50
- ?cursor=b&limit=200

---

## Helper Endpoints

### `__health`
Shows gateway configuration and status :
- port
- prismUrl
- fixturesDir
- ignoreQueryKeys

```
GET /__health
```

### `__fixture_hint`
his endpoint tells you exactly which fixture filenames the gateway will search for.

```
GET /__fixture_hint?method=GET&path=/o/op/data/businesses&query=limit=50&cursor=abc
```
Response will include:
- candidates: an ordered list of filenames

**Workflow tip**: Use this first when adding a fixture.

---

## Creating a Fixture (Step-by-Step)

1. Identify the endpoint you want to control (method + path + query).
2. Open fixture hint:
```
http://localhost:4020/__fixture_hint?method=GET&path=/o/op/data/businesses&query=
```
3. Copy the first suggested filename
4. Create that file under `mocks/<pos>/fixtures/...`
5. Put valid JSON response content in it.
6. Re-run the request via gateway:
`http://localhost:4020/o/op/data/businesses`
7. Confirm response header:
   - Response matches your JSON
   - Header includes `x-mock-fixture`

---

## Adding a New POS Mock (Reusable Pattern)

### 1. Create Folder structure
```
mocks/<newPos>/
  docker-compose.yml
  openapi.json
  fixtures/
    GET/
    POST/
  gateway/
    Dockerfile
    package.json
    src/
```


### 2. Copy Gateway
Reuse the existing gateway folder (it is POS-agnostic).
Best practice: Copy `mocks/lightspeed/gateway/` as-is. The gateway is generic.

### 3. Add OpenAPI Spec
Place `openapi.json` in the POS folder.
`mocks/<newPos>/openapi.json`
This can be:
- Real POS OpenAPI if available
- Simplified OpenAPI with only endpoints we need for sales extraction

### 4. Create docker-compose.yml
Use this template:
```
services:
  prism:
    image: stoplight/prism:4
    command: mock -h 0.0.0.0 /tmp/openapi.json
    ports:
      - "4011:4010" # choose unique host port per POS to avoid conflicts
    volumes:
      - ./openapi.json:/tmp/openapi.json:ro

  gateway:
    build:
      context: ./gateway
    environment:
      - PORT=4021 # choose unique host port per POS
      - PRISM_URL=http://prism:4010
      - FIXTURES_DIR=/fixtures
      - IGNORE_QUERY_KEYS=cursor,pageToken,limit,offset
      - LOG_LEVEL=dev
    volumes:
      - ./fixtures:/fixtures
    ports:
      - "4021:4020" # host:container
    depends_on:
      - prism
```
Assign **unique ports** per POS.

Choose unique ports:
- Prism host port: 4010, 4011, 4012...
- Gateway host port: 4020, 4021, 4022...

### 5. Run
From repo root:
```bash
docker compose -f mocks/<new-pos>/docker-compose.yml up --build
```

### 6. Add Fixtures
Use `__fixture_hint` and create deterministic responses `fixtures/GET/...json`.

---

## Definition of Done (POS Mock)

A POS mock is complete when:
- Docker compose runs cleanly
- Gateway responds on expected port (`__health` returns OK)
- At least one sales endpoint is mocked
- Fixtures override Prism responses
- Connector team can develop without vendor access

---

## Troubleshooting

### Gateway up, but always returning random mocked data
That means no fixture matched and requests are being proxied to Prism.

Fix:
- Use `__fixture_hint` and create the suggested fixture file.
- Confirm `x-mock-fixture` header appears.

### Port already in use

Change host ports in docker-compose:
- `4010:4010` -> `4011:4010`
- `4020:4020` -> `4021:4020`

### Fixture not being picked up
Common reasons:
-Wrong method folder (GET vs POST)
-Incorrect sanitized filename (use `__fixture_hint`)
-JSON is invalid (must be valid JSON)
-You created the fixture in the wrong POS folder

---

## Best Practices

- Always add fixtures for business-critical endpoints
- Use path-only fixtures unless query behavior matters
- Simulate error responses (401, 429, 500)
- Keep fixtures realistic and minimal

---

## Resetting the Environment

```bash
docker compose -f mocks/<pos>/docker-compose.yml down -v
docker compose -f mocks/<pos>/docker-compose.yml up --build
```

---

## Connector Integration Rule

🚫 Do NOT call Prism directly  
✅ ALWAYS call the Gateway

This guarantees deterministic behavior and future production parity.

---

## Next Steps

- Implement real POS connectors using the same endpoint contracts
- Replace gateway with live POS adapter in production
- Keep fixtures for regression testing
