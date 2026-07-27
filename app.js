let cards = [];
let currentIndex = 0;
let selectedChoice = null;

const topicEl = document.getElementById("question-topic");
const difficultyEl = document.getElementById("question-difficulty");
const textEl = document.getElementById("question-text");
const choicesEl = document.getElementById("choices");
const revealBtn = document.getElementById("reveal-btn");
const nextBtn = document.getElementById("next-btn");
const feedbackEl = document.getElementById("feedback");
const resultLabelEl = document.getElementById("result-label");
const explanationCorrectEl = document.getElementById("explanation-correct");
const explanationWrongEl = document.getElementById("explanation-wrong");
const progressEl = document.getElementById("progress");
const metaEl = document.getElementById("meta");

async function loadCards() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    cards = data.cards || [];
    currentIndex = 0;
    metaEl.textContent = `${cards.length} questions loaded`;
    renderCurrentCard();
  } catch (err) {
    console.error("Failed to load questions.json", err);
    metaEl.textContent = "Error loading questions.json";
  }
}

function renderCurrentCard() {
  if (!cards.length) {
    textEl.textContent = "No questions available.";
    choicesEl.innerHTML = "";
    return;
  }

  const card = cards[currentIndex];

  topicEl.textContent = card.topic || "Unknown topic";
  difficultyEl.textContent = card.difficulty || "unknown";
  textEl.textContent = card.question_text || "";

  choicesEl.innerHTML = "";
  selectedChoice = null;
  feedbackEl.classList.add("hidden");
  resultLabelEl.textContent = "";
  explanationCorrectEl.textContent = "";
  explanationWrongEl.textContent = "";

  if (Array.isArray(card.choices) && card.choices.length > 0) {
    card.choices.forEach((choice, index) => {
      const li = document.createElement("li");
      li.className = "choice-item";

      const btn = document.createElement("button");
      btn.className = "choice-button";
      btn.textContent = choice;
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
    // fallback: open-ended question (no choices)
    const li = document.createElement("li");
    li.className = "choice-item";
    const span = document.createElement("span");
    span.textContent = "(Open-ended question. Think of your answer, then click Check Answer.)";
    li.appendChild(span);
    choicesEl.appendChild(li);
  }

  revealBtn.disabled = false;
  nextBtn.disabled = true;
  updateProgress();
}

function updateProgress() {
  progressEl.textContent = `Question ${currentIndex + 1} of ${cards.length}`;
}

revealBtn.addEventListener("click", () => {
  const card = cards[currentIndex];

  feedbackEl.classList.remove("hidden");

  if (selectedChoice && selectedChoice === card.answer) {
    resultLabelEl.innerHTML = "✅ Correct";
  } else if (selectedChoice) {
    resultLabelEl.innerHTML = `❌ Incorrect (Correct: ${card.answer})`;
  } else {
    resultLabelEl.innerHTML = `ℹ️ Correct answer: ${card.answer}`;
  }

  explanationCorrectEl.innerHTML = `<strong>Why this is correct:</strong> ${card.explanation_correct || ""}`;
  explanationWrongEl.innerHTML = `<strong>Why other options are wrong:</strong> ${card.explanation_wrong_common || ""}`;

  revealBtn.disabled = true;
  nextBtn.disabled = currentIndex >= cards.length - 1;
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < cards.length - 1) {
    currentIndex += 1;
    renderCurrentCard();
  }
});

loadCards();