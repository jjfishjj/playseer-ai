const AGENTS = [
  {
    id: "telemetry",
    name: "Telemetry analyst",
    role: "Analyze DAU, D1 retention, payer conversion, and crash rate. Identify the highest-confidence operational anomaly."
  },
  {
    id: "community",
    name: "Community analyst",
    role: "Interpret player sentiment as a trust signal. Recommend a transparent, reversible community response where appropriate."
  },
  {
    id: "strategy",
    name: "LiveOps strategist",
    role: "Recommend a prioritized, reversible LiveOps intervention. Respect the scenario and explain the intended measurable outcome."
  },
  {
    id: "risk",
    name: "Risk reviewer",
    role: "Review proposed actions for operational risk. Require a holdout where practical and human approval before activation."
  }
];

export function localModelConfigured(config = process.env) {
  return Boolean(config.LOCAL_AI_BASE_URL && config.LOCAL_AI_MODEL);
}

function endpointFor(baseUrl) {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("LOCAL_AI_BASE_URL must use http or https.");
  const trimmed = url.href.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function parseAgentOutput(content, agent) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed.summary !== "string" || typeof parsed.recommendation !== "string") {
    throw new Error(`${agent.id} returned an invalid structured response.`);
  }
  const signals = Array.isArray(parsed.signals) ? parsed.signals.filter((item) => typeof item === "string").slice(0, 3) : [];
  return {
    id: agent.id,
    name: agent.name,
    summary: parsed.summary.slice(0, 500),
    recommendation: parsed.recommendation.slice(0, 500),
    signals: signals.map((item) => item.slice(0, 240))
  };
}

export async function runLocalAgents({ metrics, scenario, config = process.env, fetchImpl = fetch }) {
  if (!localModelConfigured(config)) throw new Error("Local model is not configured.");
  const endpoint = endpointFor(config.LOCAL_AI_BASE_URL);
  const timeoutMs = Math.max(1000, Number(config.LOCAL_AI_TIMEOUT_MS) || 45000);
  const startedAt = Date.now();
  const outputs = await Promise.all(AGENTS.map(async (agent) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(config.LOCAL_AI_API_KEY ? { authorization: `Bearer ${config.LOCAL_AI_API_KEY}` } : {})
        },
        body: JSON.stringify({
          model: config.LOCAL_AI_MODEL,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `You are the ${agent.name}. ${agent.role} Return only a JSON object with string fields summary and recommendation, plus a string array signals. Do not invent facts beyond the supplied metrics.` },
            { role: "user", content: JSON.stringify({ scenario, metrics }) }
          ]
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Local model request failed with HTTP ${response.status}.`);
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("Local model returned no chat completion content.");
      return parseAgentOutput(content, agent);
    } finally {
      clearTimeout(timer);
    }
  }));
  return { agents: outputs, latencyMs: Date.now() - startedAt, model: config.LOCAL_AI_MODEL };
}
