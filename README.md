# PlaySeer AI

**Private multi-agent LiveOps intelligence for game teams.**

PlaySeer AI turns fragmented telemetry, community sentiment, monetization and release-health signals into an evidence-backed response plan. Four specialist agents analyze the situation, rank reversible interventions and require human approval before activation.

![PlaySeer AI architecture](assets/architecture.svg)

## Why it matters

Live game teams often react to dashboards, social posts and incidents in separate tools. This slows decisions and makes it difficult to explain why an intervention was chosen. PlaySeer creates one accountable workflow from signal to decision while keeping sensitive operational data local.

## Current prototype

- Three realistic LiveOps scenarios: season launch, monetization backlash and stability incident
- Editable DAU, retention, conversion, sentiment and crash-rate inputs
- Four-step agent workflow: Telemetry, Community, Strategy and Risk
- Prioritized action plan, segment watchlist and evidence trail
- Human approval gate
- Local run history and downloadable JSON decision report
- Responsive UI and validation for invalid operational inputs
- No cloud call or API key required

The current Stage I prototype uses a deterministic local decision engine so that every demo is reproducible. It does **not** claim to run a production model or Intel hardware yet.

## Stage II plan for ASUS UGen Intel Arc Pro B70 32GB

The deterministic engine becomes the fallback and test oracle. The four agents will run through an OpenAI-compatible local inference adapter on the organizer-provided environment. Planned validation includes:

1. Concurrent-agent latency and throughput under representative context sizes
2. INT8 model quality versus the deterministic policy baseline
3. Fully local processing of aggregated game-operation signals
4. Structured-output adherence, risk-gate pass rate and reproducible audit logs
5. Comparison of sequential and batched agent execution

## Run locally

```bash
cd /Users/junbinkuo/Documents/Development/playseer-ai
npm start
```

Open <http://localhost:4173>.

## Test

```bash
npm test
```

## Submission positioning

- **Competition track:** Battlefield Thunderstorm — High-Performance Development, Onsite
- **Theme:** Workplace AI
- **Primary users:** LiveOps producers, game product managers, analysts and community leads
- **Core value:** Faster cross-functional decisions without sending sensitive operational data to a public AI service
- **Human-in-the-loop:** Recommendations are never activated autonomously

## Repository status

This is a new hackathon prototype. Before public submission, add the final license, team information, deployment URL and organizer-specific runtime integration notes.
