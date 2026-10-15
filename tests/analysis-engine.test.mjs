import test from "node:test";
import assert from "node:assert/strict";
import { analyzeScenario, scenarios, validateMetrics } from "../analysis-engine.js";

test("valid scenario produces an accountable action plan", () => {
  const report = analyzeScenario(scenarios.stability.metrics, "stability");
  assert.ok(report.risk >= 70);
  assert.match(report.actions[0].action, /rollback/i);
  assert.equal(report.evidence.length, 4);
  assert.equal(report.metrics.crashRate, 5.9);
});

test("retention risk creates a second-session intervention", () => {
  const report = analyzeScenario(scenarios.season.metrics, "season");
  assert.ok(report.actions.some((item) => /second-session/i.test(item.action)));
});

test("invalid metrics are rejected", () => {
  const bad = { ...scenarios.season.metrics, sentiment: 130 };
  assert.match(validateMetrics(bad)[0], /player sentiment/i);
  assert.throws(() => analyzeScenario(bad), /player sentiment/i);
});
