import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeScenario, scenarios, validateMetrics } from "./analysis-engine.js";
import { localModelConfigured, runLocalAgents } from "./local-ai.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const mimeTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json; charset=utf-8" };

function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 32_768) throw new Error("Request body is too large.");
  }
  return JSON.parse(body || "{}");
}

export function createAppServer({ config = process.env, fetchImpl = fetch } = {}) {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (request.method === "GET" && pathname === "/api/runtime") {
      sendJson(response, 200, {
        mode: localModelConfigured(config) ? "local-model" : "deterministic",
        model: localModelConfigured(config) ? config.LOCAL_AI_MODEL : null,
        hardwareVerified: false
      });
      return;
    }
    if (request.method === "POST" && pathname === "/api/analyze") {
      try {
        const input = await readJson(request);
        const metrics = input.metrics;
        const errors = validateMetrics(metrics || {});
        if (errors.length) {
          sendJson(response, 400, { error: errors[0] });
          return;
        }
        const scenarioKey = scenarios[input.scenarioKey] ? input.scenarioKey : "season";
        const report = analyzeScenario(metrics, scenarioKey);
        if (!localModelConfigured(config)) {
          report.engine = "deterministic";
          report.engineNotice = "Deterministic demo engine; no local model or ASUS hardware is connected.";
          sendJson(response, 200, report);
          return;
        }
        try {
          const local = await runLocalAgents({ metrics: report.metrics, scenario: scenarios[scenarioKey].label, config, fetchImpl });
          report.engine = "local-model";
          report.model = local.model;
          report.agentLatencyMs = local.latencyMs;
          report.agents = local.agents;
          report.evidence = [
            ...local.agents.map((agent) => `${agent.name}: ${agent.summary}`),
            "Risk agent requires a holdout cohort and human approval before activation."
          ];
        } catch (error) {
          report.engine = "deterministic-fallback";
          report.engineNotice = `Local model unavailable; deterministic demo result shown (${error.name === "AbortError" ? "request timed out" : error.message}).`;
        }
        sendJson(response, 200, report);
      } catch (error) {
        sendJson(response, 400, { error: error instanceof SyntaxError ? "Request body must be valid JSON." : error.message });
      }
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }
    let requestedPath;
    try { requestedPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname); }
    catch { sendJson(response, 400, { error: "Invalid path." }); return; }
    const filePath = path.resolve(root, `.${requestedPath}`);
    if (!filePath.startsWith(`${root}${path.sep}`) || filePath === root) {
      sendJson(response, 403, { error: "Forbidden." });
      return;
    }
    try {
      const content = await readFile(filePath);
      response.writeHead(200, { "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream", "x-content-type-options": "nosniff" });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch {
      sendJson(response, 404, { error: "Not found." });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 4173;
  createAppServer().listen(port, "0.0.0.0", () => console.log(`PlaySeer AI listening on http://0.0.0.0:${port}`));
}
