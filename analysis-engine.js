export const scenarios = {
  season: {
    label: "New season launch",
    note: "Acquisition is strong, but new players are not reaching the second session.",
    metrics: { dau: 128400, retention: 24, conversion: 3.8, sentiment: 61, crashRate: 1.4 }
  },
  backlash: {
    label: "Monetization backlash",
    note: "A limited-time bundle is converting, while negative community sentiment is accelerating.",
    metrics: { dau: 109200, retention: 31, conversion: 6.9, sentiment: 29, crashRate: 0.8 }
  },
  stability: {
    label: "Stability incident",
    note: "The latest client build increased crashes and interrupted high-value sessions.",
    metrics: { dau: 96400, retention: 27, conversion: 2.6, sentiment: 42, crashRate: 5.9 }
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function validateMetrics(metrics) {
  const errors = [];
  const checks = [
    ["dau", 1, 10000000, "DAU"],
    ["retention", 0, 100, "D1 retention"],
    ["conversion", 0, 100, "payer conversion"],
    ["sentiment", 0, 100, "player sentiment"],
    ["crashRate", 0, 100, "crash rate"]
  ];

  for (const [key, min, max, label] of checks) {
    const value = Number(metrics[key]);
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push(`${label} must be between ${min} and ${max}.`);
    }
  }
  return errors;
}

function severity(metrics) {
  const retentionRisk = clamp((32 - metrics.retention) * 2.2, 0, 50);
  const sentimentRisk = clamp((55 - metrics.sentiment) * 0.8, 0, 35);
  const stabilityRisk = clamp((metrics.crashRate - 1) * 10.5, 0, 55);
  return Math.round(clamp(retentionRisk + sentimentRisk + stabilityRisk, 8, 96));
}

export function analyzeScenario(metrics, scenarioKey = "season") {
  const parsed = Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [key, Number(value)])
  );
  const errors = validateMetrics(parsed);
  if (errors.length) throw new Error(errors.join(" "));

  const risk = severity(parsed);
  const stabilityFirst = parsed.crashRate >= 3;
  const trustFirst = parsed.sentiment < 40;
  const retentionFirst = parsed.retention < 28;

  let northStar = "Protect player trust while converting launch traffic into durable cohorts.";
  if (stabilityFirst) northStar = "Stabilize the client before spending more acquisition or monetization budget.";
  else if (trustFirst) northStar = "Recover player trust before extending the monetization campaign.";

  const actions = [];
  if (stabilityFirst) actions.push({ owner: "Release", action: "Start a 10% rollback and isolate crash-heavy device cohorts.", impact: "-35% crash sessions", confidence: 92 });
  if (trustFirst) actions.push({ owner: "Community", action: "Pause scarcity messaging and publish a value breakdown with a make-good.", impact: "+12 sentiment pts", confidence: 84 });
  if (retentionFirst) actions.push({ owner: "LiveOps", action: "Launch a 72-hour second-session quest for tutorial completers.", impact: "+4.8 D1 pts", confidence: 81 });
  if (parsed.conversion < 4) actions.push({ owner: "Economy", action: "Test a low-friction starter offer after the first mastery moment.", impact: "+0.9 payer pts", confidence: 76 });
  actions.push({ owner: "Analytics", action: "Hold out 10% of eligible players and review lift after 72 hours.", impact: "Causal readout", confidence: 95 });

  const opportunity = Math.round(parsed.dau * Math.max(0.01, (32 - parsed.retention) / 100));
  return {
    id: `PS-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    scenarioKey,
    risk,
    decision: risk >= 70 ? "Intervene now" : risk >= 42 ? "Run controlled response" : "Monitor and optimize",
    northStar,
    opportunity,
    actions: actions.slice(0, 4),
    segments: [
      { name: "New players", signal: `${parsed.retention}% D1 retention`, status: parsed.retention < 28 ? "At risk" : "Watch" },
      { name: "Paying players", signal: `${parsed.conversion}% conversion`, status: parsed.sentiment < 40 ? "Trust risk" : "Stable" },
      { name: "Crash-exposed", signal: `${parsed.crashRate}% crash rate`, status: stabilityFirst ? "Critical" : "Stable" }
    ],
    evidence: [
      `Telemetry agent scored retention and stability across ${parsed.dau.toLocaleString()} daily players.`,
      `Community agent classified sentiment at ${parsed.sentiment}/100.`,
      `Strategy agent ranked interventions by reversibility and estimated lift.`,
      "Risk agent required a holdout cohort and human approval before activation."
    ],
    metrics: parsed
  };
}
