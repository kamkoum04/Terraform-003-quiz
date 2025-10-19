// State management
let allQuestions = []
let filteredQuestions = []
let currentPage = 1
const questionsPerPage = 10
let answeredQuestions = new Set()
const viewMode = "card" // 'card' or 'list'
let filterMode = "all" // 'all' or 'unanswered'

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      allQuestions = data
      filteredQuestions = [...allQuestions]

      // Load saved progress from localStorage
      const saved = localStorage.getItem("terraform-progress")
      if (saved) {
        answeredQuestions = new Set(JSON.parse(saved))
      }

      renderQuestions()
      updateStats()
    } catch (error) {
      console.error("[v0] Error parsing JSON:", error)
      document.getElementById("questionsContainer").innerHTML = `
        <div class="empty-state">
          <h2>Error Parsing JSON File</h2>
          <p>The file you selected is not a valid JSON file.</p>
          <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">Error: ${error.message}</p>
        </div>
      `
    }
  }
  reader.readAsText(file)
}

// Load questions from JSON file
async function loadQuestions() {
  try {
    const response = await fetch("terraform_questions_20251015_233257.json")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    //
    allQuestions = await response.json()
    filteredQuestions = [...allQuestions]

    // Load saved progress from localStorage
    const saved = localStorage.getItem("terraform-progress")
    if (saved) {
      answeredQuestions = new Set(JSON.parse(saved))
    }

    renderQuestions()
    updateStats()
  } catch (error) {
    console.error("[v0] Error loading questions:", error)
    document.getElementById("questionsContainer").innerHTML = `
      <div class="empty-state">
        <h2>Unable to Load Questions Automatically</h2>
        <p>Please click the "📁 Load JSON File" button above to select your JSON file.</p>
        <p style="color: hsl(var(--muted-foreground)); font-size: 0.875rem; margin-top: 1rem;">
          Note: Due to browser security restrictions, you need to manually select the file when opening this page directly from your file system.
        </p>
      </div>
    `
    //
  }
}

// Render questions
function renderQuestions() {
  const container = document.getElementById("questionsContainer")
  const start = (currentPage - 1) * questionsPerPage
  const end = start + questionsPerPage
  const questionsToShow = filteredQuestions.slice(start, end)

  if (questionsToShow.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>No Questions Found</h2>
        <p>Try adjusting your filters or search terms.</p>
      </div>
    `
    return
  }

  container.innerHTML = questionsToShow.map((q) => createQuestionCard(q)).join("")
  renderPagination()
  attachEventListeners()
}

// Create question card HTML
function createQuestionCard(question) {
  const isAnswered = answeredQuestions.has(question.question_id)
  const totalVotes = question.voting_data.reduce((sum, v) => sum + v.vote_count, 0)

  return `
    <div class="question-card" data-id="${question.question_id}">
      <div class="question-header">
        <span class="question-number">Question ${question.question_number} of 359</span>
        <div class="question-actions">
          <button class="icon-btn" onclick="toggleBookmark('${question.question_id}')" title="Bookmark">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="question-text">${question.question_text}</div>
      
      <div class="choices">
        ${question.choices
          .map(
            (choice) => `
          <div class="choice" data-letter="${choice.letter}">
            <span class="choice-letter">${choice.letter}.</span>
            <span class="choice-text">${choice.text.replace("Most Voted", "")}</span>
          </div>
        `,
          )
          .join("")}
      </div>
      
      <button class="btn btn-primary" onclick="showAnswer('${question.question_id}')">
        ${isAnswered ? "Show Answer Again" : "Show Answer"}
      </button>
      
      <div class="answer-section" id="answer-${question.question_id}">
        <div class="correct-answer">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Correct Answer: ${question.correct_answer}
        </div>
        
        ${
          question.voting_data.length > 0
            ? `
          <div class="voting-data">
            <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem;">
              Community Votes:
            </p>
            ${question.voting_data
              .map(
                (vote) => `
              <div class="vote-item ${vote.is_most_voted ? "most-voted" : ""}">
                <span>${vote.voted_answers}</span>
                <div class="vote-bar">
                  <div class="vote-fill" style="width: ${((vote.vote_count / totalVotes) * 100).toFixed(1)}%"></div>
                </div>
                <span>${vote.vote_count} votes (${((vote.vote_count / totalVotes) * 100).toFixed(1)}%)</span>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    </div>
  `
}

// Show answer and mark as answered
function showAnswer(questionId) {
  const answerSection = document.getElementById(`answer-${questionId}`)
  const card = document.querySelector(`[data-id="${questionId}"]`)
  const question = allQuestions.find((q) => q.question_id === questionId)

  answerSection.classList.add("visible")

  // Highlight correct and incorrect answers
  const choices = card.querySelectorAll(".choice")
  choices.forEach((choice) => {
    const letter = choice.dataset.letter
    if (letter === question.correct_answer) {
      choice.classList.add("correct")
    }
  })

  // Mark as answered
  answeredQuestions.add(questionId)
  localStorage.setItem("terraform-progress", JSON.stringify([...answeredQuestions]))
  updateStats()
}

// Toggle bookmark (placeholder - could be extended)
function toggleBookmark(questionId) {
  console.log("Bookmark toggled for question:", questionId)
  // Could implement bookmark functionality with localStorage
}

// Render pagination
function renderPagination() {
  const pagination = document.getElementById("pagination")
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage)

  if (totalPages <= 1) {
    pagination.innerHTML = ""
    return
  }

  let html = `
    <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>
      ←
    </button>
  `

  // Show first page
  if (currentPage > 3) {
    html += `<button class="page-btn" onclick="changePage(1)">1</button>`
    if (currentPage > 4) {
      html += `<span style="padding: 0 0.5rem; color: hsl(var(--muted-foreground));">...</span>`
    }
  }

  // Show pages around current
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    html += `
      <button class="page-btn ${i === currentPage ? "active" : ""}" onclick="changePage(${i})">
        ${i}
      </button>
    `
  }

  // Show last page
  if (currentPage < totalPages - 2) {
    if (currentPage < totalPages - 3) {
      html += `<span style="padding: 0 0.5rem; color: hsl(var(--muted-foreground));">...</span>`
    }
    html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`
  }

  html += `
    <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>
      →
    </button>
  `

  pagination.innerHTML = html
}

// Change page
function changePage(page) {
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage)
  if (page < 1 || page > totalPages) return

  currentPage = page
  renderQuestions()
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// Update stats
function updateStats() {
  document.getElementById("progressText").textContent =
    `${currentPage} / ${Math.ceil(filteredQuestions.length / questionsPerPage)}`
  document.getElementById("answeredText").textContent = `${answeredQuestions.size} answered`
}

// Search functionality
function handleSearch(searchTerm) {
  const term = searchTerm.toLowerCase().trim()

  if (!term) {
    filteredQuestions = [...allQuestions]
  } else {
    filteredQuestions = allQuestions.filter(
      (q) => q.question_text.toLowerCase().includes(term) || q.choices.some((c) => c.text.toLowerCase().includes(term)),
    )
  }

  applyFilters()
  currentPage = 1
  renderQuestions()
  updateStats()
}

// Apply filters
function applyFilters() {
  if (filterMode === "unanswered") {
    filteredQuestions = filteredQuestions.filter((q) => !answeredQuestions.has(q.question_id))
  }
}

// Shuffle questions
function shuffleQuestions() {
  filteredQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5)
  currentPage = 1
  renderQuestions()
}

// Reset progress
function resetProgress() {
  if (confirm("Are you sure you want to reset all progress?")) {
    answeredQuestions.clear()
    localStorage.removeItem("terraform-progress")
    updateStats()
    renderQuestions()
  }
}

// Toggle filter
function toggleFilter() {
  const btn = document.getElementById("filterUnanswered")
  filterMode = filterMode === "all" ? "unanswered" : "all"

  if (filterMode === "unanswered") {
    btn.classList.add("active")
    btn.textContent = "Show All"
  } else {
    btn.classList.remove("active")
    btn.textContent = "Show Unanswered"
  }

  const searchTerm = document.getElementById("searchInput").value
  handleSearch(searchTerm)
}

// Attach event listeners
function attachEventListeners() {
  // Event listeners are attached via onclick in HTML for simplicity
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadQuestions()

  document.getElementById("fileInput").addEventListener("change", handleFileUpload)
  //

  // Search input
  const searchInput = document.getElementById("searchInput")
  let searchTimeout
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => handleSearch(e.target.value), 300)
  })

  // Control buttons
  document.getElementById("shuffleBtn").addEventListener("click", shuffleQuestions)
  document.getElementById("resetBtn").addEventListener("click", resetProgress)
  document.getElementById("filterUnanswered").addEventListener("click", toggleFilter)
})

// Make functions globally available
window.showAnswer = showAnswer
window.toggleBookmark = toggleBookmark
window.changePage = changePage
