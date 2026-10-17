import test from "node:test";
import assert from "node:assert/strict";
import { localModelConfigured, runLocalAgents } from "../local-ai.js";

const agents = ["Telemetry analyst", "Community analyst", "LiveOps strategist", "Risk reviewer"];
const jsonResponse = (agent) => ({
  ok: true,
  json: async () => ({ choices: [{ message: { content: JSON.stringify({ summary: `${agent} summary`, recommendation: `${agent} recommendation`, signals: ["Observed signal"] }) } }] })
});

test("local runtime requires both an endpoint and a model", () => {
  assert.equal(localModelConfigured({ LOCAL_AI_BASE_URL: "http://localhost:8000/v1" }), false);
  assert.equal(localModelConfigured({ LOCAL_AI_BASE_URL: "http://localhost:8000/v1", LOCAL_AI_MODEL: "demo" }), true);
});

test("four local agents run concurrently and return validated structured outputs", async () => {
  const calls = [];
  let active = 0;
  let maximumActive = 0;
  const fetchImpl = async (_url, options) => {
    const request = JSON.parse(options.body);
    calls.push(request);
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return jsonResponse(request.messages[0].content.match(/You are the ([^.]+)/)?.[1] || "Agent");
  };
  const result = await runLocalAgents({
    metrics: { dau: 1000, retention: 24, conversion: 3, sentiment: 50, crashRate: 1 },
    scenario: "New season launch",
    config: { LOCAL_AI_BASE_URL: "http://localhost:8000/v1", LOCAL_AI_MODEL: "test-model", LOCAL_AI_API_KEY: "test-only" },
    fetchImpl
  });
  assert.equal(calls.length, 4);
  assert.equal(maximumActive, 4);
  assert.equal(result.agents.length, 4);
  assert.equal(result.model, "test-model");
  assert.ok(result.agents.every((agent) => agent.summary.length > 0 && agent.recommendation.length > 0));
  assert.ok(calls.every((request) => request.response_format.type === "json_object"));
  assert.ok(agents.every((name) => result.agents.some((agent) => agent.name === name)));
});

test("local agent rejects invalid structured output", async () => {
  await assert.rejects(runLocalAgents({
    metrics: { dau: 1 }, scenario: "Test",
    config: { LOCAL_AI_BASE_URL: "http://localhost:8000/v1", LOCAL_AI_MODEL: "test-model" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "not json" } }] }) })
  }), SyntaxError);
});
