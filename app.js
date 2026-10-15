import { analyzeScenario, scenarios, validateMetrics } from "./analysis-engine.js";

const $ = (selector) => document.querySelector(selector);
const fields = ["dau", "retention", "conversion", "sentiment", "crashRate"];
let currentReport = null;

function loadScenario(key) {
  const scenario = scenarios[key];
  fields.forEach((field) => { $(`#${field}`).value = scenario.metrics[field]; });
  $("#scenarioNote").textContent = scenario.note;
  $("#formError").textContent = "";
}

function readMetrics() {
  return Object.fromEntries(fields.map((field) => [field, Number($(`#${field}`).value)]));
}

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
}

function renderDecision(report) {
  $("#decisionEmpty").classList.add("hidden");
  $("#decisionContent").classList.remove("hidden");
  $("#actionList").innerHTML = report.actions.map((item) => `<li><div><strong>${item.owner}</strong><p>${item.action}</p></div><span class="impact">${item.impact}</span></li>`).join("");
  $("#segmentList").innerHTML = report.segments.map((segment) => `<div class="segment"><div><strong>${segment.name}</strong><b>${segment.status}</b></div><p>${segment.signal}</p></div>`).join("");
  $("#evidenceList").innerHTML = report.evidence.map((item) => `<li>${item}</li>`).join("");
  $("#approveButton").textContent = "Mark reviewed";
  $("#approveButton").classList.remove("approved");
}

function saveReport(report) {
  const history = JSON.parse(localStorage.getItem("playseer-history") || "[]");
  localStorage.setItem("playseer-history", JSON.stringify([report, ...history].slice(0, 5)));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("playseer-history") || "[]");
  $("#historyList").innerHTML = history.length ? history.map((item) => `<div class="history-item"><span>${new Date(item.createdAt).toLocaleString()}</span><strong>${scenarios[item.scenarioKey]?.label || "Custom scenario"} · ${item.decision}</strong><small class="history-risk">Risk ${item.risk}</small></div>`).join("") : "<p>No saved runs yet.</p>";
}

async function runAnalysis() {
  const metrics = readMetrics();
  const errors = validateMetrics(metrics);
  if (errors.length) { $("#formError").textContent = errors[0]; return; }
  $("#formError").textContent = "";
  $("#analyzeButton").disabled = true;
  $("#analyzeButton span:first-child").textContent = "Agents are evaluating signals…";
  const cards = [...document.querySelectorAll(".agent-card")];
  cards.forEach((card) => { card.classList.remove("done"); card.querySelector("small").textContent = "WAITING"; });
  for (const card of cards) {
    card.classList.add("running"); card.querySelector("small").textContent = "ANALYZING";
    await new Promise((resolve) => setTimeout(resolve, 230));
    card.classList.remove("running"); card.classList.add("done"); card.querySelector("small").textContent = "EVIDENCE READY";
  }
  currentReport = analyzeScenario(metrics, $("#scenario").value);
  updatePulse(currentReport); renderDecision(currentReport); saveReport(currentReport);
  $("#exportButton").disabled = false;
  $("#analyzeButton").disabled = false;
  $("#analyzeButton span:first-child").textContent = "Run private agent analysis";
}

function exportReport() {
  if (!currentReport) return;
  const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${currentReport.id}-decision.json`; link.click(); URL.revokeObjectURL(link.href);
}

$("#scenario").addEventListener("change", (event) => loadScenario(event.target.value));
$("#analyzeButton").addEventListener("click", runAnalysis);
$("#exportButton").addEventListener("click", exportReport);
$("#approveButton").addEventListener("click", (event) => { event.currentTarget.textContent = "Reviewed ✓"; event.currentTarget.classList.add("approved"); });
$("#clearHistory").addEventListener("click", () => { localStorage.removeItem("playseer-history"); renderHistory(); });
loadScenario("season"); renderHistory();
