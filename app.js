// JSONBin.io config — auto-sync quiz results to cloud
const JSONBIN_BIN_ID = "6a678c96f5f4af5e29c8ccd2";
const JSONBIN_API_KEY = "$2a$10$41Iw7PMalAC3GKnXkL.jn.N29Emw7PWJik2wHFL2uRC8qMKwpoH2O";
const JSONBIN_BASE = "https://api.jsonbin.io/v3/b";

let cards = [];
let currentIndex = 0;
let selectedChoice = null;
let sessionAnswers = [];   // { card_id, topic, correct: bool, chosen, answer, difficulty, question_type, timestamp }

// DOM refs — quiz view
const quizView     = document.getElementById("quiz-view");
const topicEl      = document.getElementById("question-topic");
const difficultyEl = document.getElementById("question-difficulty");
const textEl       = document.getElementById("question-text");
const choicesEl    = document.getElementById("choices");
const revealBtn    = document.getElementById("reveal-btn");
const nextBtn      = document.getElementById("next-btn");
const feedbackEl   = document.getElementById("feedback");
const resultLabelEl    = document.getElementById("result-label");
const explanationCorrectEl = document.getElementById("explanation-correct");
const explanationWrongEl   = document.getElementById("explanation-wrong");
const progressEl   = document.getElementById("progress");
const metaEl       = document.getElementById("meta");

// DOM refs — results view
const resultsView      = document.getElementById("results-view");
const scoreCorrectEl   = document.getElementById("score-correct");
const scoreIncorrectEl  = document.getElementById("score-incorrect");
const scorePercentEl    = document.getElementById("score-percent");
const topicBreakdownEl = document.getElementById("topic-breakdown");
const retryBtn          = document.getElementById("retry-btn");
const exportBtn         = document.getElementById("export-btn");

// ──────────────────────────────────────────────
//  Load quiz cards
// ──────────────────────────────────────────────
async function loadCards() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    cards = data.cards || [];
    currentIndex = 0;
    sessionAnswers = [];
    metaEl.textContent = `${cards.length} questions loaded`;
    if (cards.length) {
      showQuizView();
      renderCurrentCard();
    } else {
      textEl.textContent = "No questions available.";
      choicesEl.innerHTML = "";
    }
  } catch (err) {
    console.error("Failed to load questions.json", err);
    metaEl.textContent = "Error loading questions.json";
  }
}

// ──────────────────────────────────────────────
//  Render a single card
// ──────────────────────────────────────────────
function renderCurrentCard() {
  const card = cards[currentIndex];

  topicEl.textContent     = card.topic || "Unknown topic";
  difficultyEl.textContent = card.difficulty || "unknown";
  textEl.textContent       = card.question_text || "";

  choicesEl.innerHTML = "";
  selectedChoice = null;
  feedbackEl.classList.add("hidden");
  resultLabelEl.textContent       = "";
  explanationCorrectEl.textContent = "";
  explanationWrongEl.textContent   = "";

  if (Array.isArray(card.choices) && card.choices.length > 0) {
    card.choices.forEach((choice) => {
      const li  = document.createElement("li");
      li.className = "choice-item";
      const btn = document.createElement("button");
      btn.className   = "choice-button";
      btn.textContent  = choice;
      btn.dataset.value = choice;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".choice-button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedChoice = choice;
      });
      li.appendChild(btn);
      choicesEl.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.className = "choice-item";
    const span = document.createElement("span");
    span.textContent = "(Open-ended question. Think of your answer, then click Check Answer.)";
    li.appendChild(span);
    choicesEl.appendChild(li);
  }

  revealBtn.disabled = false;
  nextBtn.disabled   = true;
  updateProgress();
}

function updateProgress() {
  progressEl.textContent = `Question ${currentIndex + 1} of ${cards.length}`;
}

// ──────────────────────────────────────────────
//  Check answer — record result
// ──────────────────────────────────────────────
revealBtn.addEventListener("click", () => {
  const card = cards[currentIndex];
  const isCorrect = selectedChoice && selectedChoice === card.answer;

  feedbackEl.classList.remove("hidden");

  if (isCorrect) {
    resultLabelEl.innerHTML = "✅ Correct";
  } else if (selectedChoice) {
    resultLabelEl.innerHTML = `❌ Incorrect (Correct: ${card.answer})`;
  } else {
    resultLabelEl.innerHTML = `ℹ️ Correct answer: ${card.answer}`;
  }

  explanationCorrectEl.innerHTML = `<strong>Why this is correct:</strong> ${card.explanation_correct || ""}`;
  explanationWrongEl.innerHTML   = `<strong>Why other options are wrong:</strong> ${card.explanation_wrong_common || ""}`;

  // Record the answer
  sessionAnswers.push({
    card_id:       card.card_id,
    topic:         card.topic,
    difficulty:    card.difficulty,
    question_type: card.question_type,
    correct:       !!isCorrect,
    chosen:        selectedChoice || null,
    answer:        card.answer,
    timestamp:      new Date().toISOString()
  });

  revealBtn.disabled = true;
  nextBtn.disabled = currentIndex >= cards.length - 1;

  // If last question, enable next to show results
  if (currentIndex >= cards.length - 1) {
    nextBtn.textContent = "View Results";
    nextBtn.disabled = false;
  }
});

// ──────────────────────────────────────────────
//  Next / View Results
// ──────────────────────────────────────────────
nextBtn.addEventListener("click", () => {
  if (currentIndex < cards.length - 1) {
    currentIndex += 1;
    nextBtn.textContent = "Next Question";
    renderCurrentCard();
  } else {
    showResults();
  }
});

// ──────────────────────────────────────────────
//  Results screen
// ──────────────────────────────────────────────
function showResults() {
  quizView.classList.add("hidden");
  resultsView.classList.remove("hidden");

  const correct   = sessionAnswers.filter(a => a.correct).length;
  const incorrect = sessionAnswers.length - correct;
  const percent   = Math.round((correct / sessionAnswers.length) * 100);

  scoreCorrectEl.textContent  = correct;
  scoreIncorrectEl.textContent = incorrect;
  scorePercentEl.textContent  = `${percent}%`;

  // Per-topic breakdown
  const topics = {};
  sessionAnswers.forEach(a => {
    if (!topics[a.topic]) topics[a.topic] = { correct: 0, total: 0 };
    topics[a.topic].total += 1;
    if (a.correct) topics[a.topic].correct += 1;
  });

  topicBreakdownEl.innerHTML = "<h3>By Topic</h3>";
  for (const [topic, stats] of Object.entries(topics)) {
    const row = document.createElement("div");
    row.className = "topic-row";
    const pct = Math.round((stats.correct / stats.total) * 100);
    row.innerHTML = `
      <span class="topic-name">${topic}</span>
      <span class="topic-bar"><span class="topic-bar-fill" style="width:${pct}%"></span></span>
      <span class="topic-stat">${stats.correct}/${stats.total} (${pct}%)</span>
    `;
    topicBreakdownEl.appendChild(row);
  }

  progressEl.textContent = "";

  // Persist to localStorage
  saveSessionToStorage();

  // Auto-sync to JSONBin cloud (works from any device)
  syncToCloud();
}

function showQuizView() {
  resultsView.classList.add("hidden");
  quizView.classList.remove("hidden");
}

// ──────────────────────────────────────────────
//  Retry — reshuffle and restart
// ──────────────────────────────────────────────
retryBtn.addEventListener("click", () => {
  // Shuffle cards for retry
  cards = shuffle(cards);
  currentIndex = 0;
  sessionAnswers = [];
  nextBtn.textContent = "Next Question";
  showQuizView();
  renderCurrentCard();
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ──────────────────────────────────────────────
//  Export results as JSON (for SRS daily run)
// ──────────────────────────────────────────────
exportBtn.addEventListener("click", () => {
  const exportData = {
    completed_at: new Date().toISOString(),
    total_questions: sessionAnswers.length,
    correct: sessionAnswers.filter(a => a.correct).length,
    incorrect: sessionAnswers.filter(a => !a.correct).length,
    score_percent: Math.round((sessionAnswers.filter(a => a.correct).length / sessionAnswers.length) * 100),
    answers: sessionAnswers
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href    = url;
  a.download = `quiz-results-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ──────────────────────────────────────────────
//  localStorage persistence
// ──────────────────────────────────────────────
function saveSessionToStorage() {
  const key = "comptia_quiz_history";
  let allHistory = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) allHistory = JSON.parse(raw);
  } catch (e) { /* ignore parse errors */ }

  allHistory.push({
    date: new Date().toISOString().slice(0, 10),
    session: sessionAnswers
  });

  // Keep last 50 sessions to avoid bloat
  if (allHistory.length > 50) allHistory = allHistory.slice(-50);

  try {
    localStorage.setItem(key, JSON.stringify(allHistory));
    metaEl.textContent = `Score saved locally. ${sessionAnswers.filter(a=>a.correct).length}/${sessionAnswers.length} correct.`;
  } catch (e) {
    console.warn("localStorage save failed", e);
  }
}

// ──────────────────────────────────────────────
//  Cloud sync — auto-send results to JSONBin.io
// ──────────────────────────────────────────────
async function syncToCloud() {
  const sessionData = {
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date().toISOString(),
    total_questions: sessionAnswers.length,
    correct: sessionAnswers.filter(a => a.correct).length,
    incorrect: sessionAnswers.filter(a => !a.correct).length,
    score_percent: Math.round((sessionAnswers.filter(a => a.correct).length / sessionAnswers.length) * 100),
    session: sessionAnswers
  };

  try {
    // Read current cloud data
    const readRes = await fetch(`${JSONBIN_BASE}/${JSONBIN_BIN_ID}/latest`, {
      headers: { "X-Master-Key": JSONBIN_API_KEY }
    });
    const cloudData = await readRes.json();
    const sessions = cloudData.record.sessions || [];

    // Append this session
    sessions.push(sessionData);
    if (sessions.length > 100) sessions.slice(-100); // keep last 100

    // Write back
    await fetch(`${JSONBIN_BASE}/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY
      },
      body: JSON.stringify({ sessions })
    });

    metaEl.textContent = `Score synced to cloud. ${sessionData.correct}/${sessionData.total_questions} correct.`;
  } catch (e) {
    console.warn("Cloud sync failed (results still saved locally)", e);
    metaEl.textContent = `Score saved locally (cloud sync failed). ${sessionData.correct}/${sessionData.total_questions} correct.`;
  }
}

// ──────────────────────────────────────────────
//  Init
// ──────────────────────────────────────────────
loadCards();