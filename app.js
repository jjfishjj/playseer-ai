import { scenarios, validateMetrics } from "./analysis-engine.js";
const $ = (selector) => document.querySelector(selector);
const fields = ["dau", "retention", "conversion", "sentiment", "crashRate"];
const agentLabels = { telemetry: "Telemetry analyst", community: "Community analyst", strategy: "LiveOps strategist", risk: "Risk reviewer" };
let currentReport = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function loadScenario(key) {
  const scenario = scenarios[key];
  fields.forEach((field) => { $(`#${field}`).value = scenario.metrics[field]; });
  $("#scenarioNote").textContent = scenario.note;
  $("#formError").textContent = "";
}
function readMetrics() { return Object.fromEntries(fields.map((field) => [field, Number($(`#${field}`).value)])); }
function updatePulse(report) {
  $("#riskScore").textContent = report.risk;
  $("#decisionLabel").textContent = report.decision;
  $("#riskBadge").textContent = report.risk >= 70 ? "HIGH PRIORITY" : report.risk >= 42 ? "CONTROLLED RESPONSE" : "OPTIMIZE";
  $("#retentionBar").style.width = `${report.metrics.retention}%`;
  $("#sentimentBar").style.width = `${report.metrics.sentiment}%`;
  $("#stabilityBar").style.width = `${Math.max(0, 100 - report.metrics.crashRate * 10)}%`;
  $("#retentionValue").textContent = `${report.metrics.retention}%`;
  $("#sentimentValue").textContent = `${report.metrics.sentiment}`;
  $("#stabilityValue").textContent = `${report.metrics.crashRate}%`;
  $("#emptyState").classList.add("hidden");
  $("#northStar").classList.remove("hidden");
  $("#northStarText").textContent = report.northStar;
  $("#opportunity").textContent = report.opportunity.toLocaleString();
  const local = report.engine === "local-model";
  $("#analysisSource").textContent = local ? `LOCAL MODEL · ${report.model} · ${report.agentLatencyMs} ms` : "DETERMINISTIC POLICY BASELINE · NO HARDWARE CONNECTED";
  $("#analysisSource").classList.toggle("local-source", local);
  $("#engineNotice").textContent = report.engineNotice || (local ? "Four local agents ran in parallel. Review their evidence before approving any action." : "Reproducible demo result. Configure a local model to run inference on the designated environment.");
  $("#hardwareNotice").textContent = "Hardware validation: not verified. Thunderstorm finals require operation on the organizer-provided VM or SDV system.";
}
function renderDecision(report) {
  $("#decisionEmpty").classList.add("hidden");
  $("#decisionContent").classList.remove("hidden");
  $("#actionList").innerHTML = report.actions.map((item) => `<li><div><strong>${escapeHtml(item.owner)}</strong><p>${escapeHtml(item.action)}</p></div><span class="impact">${escapeHtml(item.impact)}</span></li>`).join("");
  $("#segmentList").innerHTML = report.segments.map((segment) => `<div class="segment"><div><strong>${escapeHtml(segment.name)}</strong><b>${escapeHtml(segment.status)}</b></div><p>${escapeHtml(segment.signal)}</p></div>`).join("");
  $("#evidenceList").innerHTML = (report.evidence || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  for (const card of document.querySelectorAll(".agent-card")) {
    const id = card.dataset.agent;
    const result = report.agents?.find((agent) => agent.id === id);
    card.classList.remove("running");
    card.classList.add("done");
    card.querySelector("small").textContent = report.engine === "local-model" ? `${report.agentLatencyMs} ms` : "BASELINE READY";
    card.querySelector("p").textContent = result?.summary || agentLabels[id];
    card.title = result?.recommendation || "Deterministic rule-based specialist baseline";
  }
  $("#approveButton").textContent = "Mark reviewed";
  $("#approveButton").classList.remove("approved");
}
function saveReport(report) {
  const history = JSON.parse(localStorage.getItem("playseer-history") || "[]");
  const compact = { id: report.id, createdAt: report.createdAt, scenarioKey: report.scenarioKey, risk: report.risk, decision: report.decision, engine: report.engine };
  localStorage.setItem("playseer-history", JSON.stringify([compact, ...history].slice(0, 5)));
  renderHistory();
}
function renderHistory() {
  let history = [];
  try { history = JSON.parse(localStorage.getItem("playseer-history") || "[]"); } catch { localStorage.removeItem("playseer-history"); }
  $("#historyList").innerHTML = history.length ? history.map((item) => `<div class="history-item"><span>${escapeHtml(new Date(item.createdAt).toLocaleString())}</span><strong>${escapeHtml(scenarios[item.scenarioKey]?.label || "Custom scenario")} · ${escapeHtml(item.decision)}</strong><small class="history-risk">Risk ${escapeHtml(item.risk)} · ${escapeHtml(item.engine || "demo")}</small></div>`).join("") : "<p>No saved runs yet.</p>";
}
async function loadRuntime() {
  try {
    const response = await fetch("/api/runtime");
    const runtime = await response.json();
    const local = runtime.mode === "local-model";
    $("#runtimeLabel").textContent = local ? `Local model configured · ${runtime.model}` : "Deterministic demo · local model not configured";
    $("#runtimeDot").classList.toggle("local-dot", local);
  } catch {
    $("#runtimeLabel").textContent = "Demo server status unavailable";
  }
}
async function runAnalysis() {
  const metrics = readMetrics();
  const errors = validateMetrics(metrics);
  if (errors.length) { $("#formError").textContent = errors[0]; return; }
  $("#formError").textContent = "";
  $("#analyzeButton").disabled = true;
  $("#analyzeButton span:first-child").textContent = "Running parallel agent analysis…";
  const cards = [...document.querySelectorAll(".agent-card")];
  cards.forEach((card) => { card.classList.remove("done"); card.classList.add("running"); card.querySelector("small").textContent = "ANALYZING"; });
  try {
    const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ metrics, scenarioKey: $("#scenario").value }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Analysis request failed.");
    currentReport = payload;
    updatePulse(currentReport); renderDecision(currentReport); saveReport(currentReport);
    $("#exportButton").disabled = false;
    await loadRuntime();
  } catch (error) {
    $("#formError").textContent = error.message;
    cards.forEach((card) => { card.classList.remove("running"); card.querySelector("small").textContent = "READY"; });
  } finally {
    $("#analyzeButton").disabled = false;
    $("#analyzeButton span:first-child").textContent = "Run private agent analysis";
  }
}
function exportReport() {
  if (!currentReport) return;
  const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${currentReport.id}-decision.json`; link.click(); URL.revokeObjectURL(link.href);
}
$("#scenario").addEventListener("change", (event) => loadScenario(event.target.value));
$("#analyzeButton").addEventListener("click", runAnalysis);
$("#exportButton").addEventListener("click", exportReport);
$("#approveButton").addEventListener("click", (event) => { event.currentTarget.textContent = "Reviewed"; event.currentTarget.classList.add("approved"); });
$("#clearHistory").addEventListener("click", () => { localStorage.removeItem("playseer-history"); renderHistory(); });
loadScenario("season"); renderHistory(); loadRuntime();
