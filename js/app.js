'use strict';

// ─── Splash ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  setTimeout(() => splash.classList.add('hidden'), 1800);
  loadSavedScores();
});

// ─── Tab Navigation ──────────────────────────────────────
let currentTab = 'home';

function switchTab(name, liftIndex) {
  if (name === currentTab && liftIndex === undefined) return;

  // Hide all tabs
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  // Show selected tab
  const tab = document.getElementById('tab-' + name);
  const btn = document.getElementById('nav-' + name);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');

  // Scroll to top of content
  document.getElementById('app-main').scrollTop = 0;
  window.scrollTo(0, 0);

  currentTab = name;

  // Optionally open a specific lift accordion
  if (liftIndex !== undefined) {
    setTimeout(() => openLift(liftIndex), 250);
  }
}

// ─── Lift Accordion ───────────────────────────────────────
const openLifts = new Set();

function toggleLift(index) {
  if (openLifts.has(index)) {
    closeLift(index);
  } else {
    openLift(index);
  }
}

function openLift(index) {
  const card   = document.getElementById('lift-' + index);
  const body   = document.getElementById('lift-body-' + index);
  const btn    = card.querySelector('.lift-header');

  if (!body.querySelector('.lift-body-inner')) {
    // Wrap contents in inner div for padding
    const inner = document.createElement('div');
    inner.className = 'lift-body-inner';
    while (body.firstChild) inner.appendChild(body.firstChild);
    body.appendChild(inner);
  }

  card.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  body.style.maxHeight = body.scrollHeight + 'px';
  openLifts.add(index);
}

function closeLift(index) {
  const card   = document.getElementById('lift-' + index);
  const body   = document.getElementById('lift-body-' + index);
  const btn    = card.querySelector('.lift-header');

  card.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  body.style.maxHeight = '0';
  openLifts.delete(index);
}

// ─── Score Calculator ─────────────────────────────────────
let lastCalcResult = null;

function updateWeightLabel() {
  const movement = document.getElementById('calc-movement').value;
  const label = document.getElementById('weight-label');
  const armSelector = document.getElementById('arm-selector');

  if (movement === 'chest') {
    label.textContent = 'Weight — each dumbbell (lbs)';
  } else if (movement === 'row') {
    label.textContent = 'Weight — dumbbell (lbs)';
  } else if (movement === 'squat') {
    label.textContent = 'Total weight held (lbs)';
  } else {
    label.textContent = 'Total weight held (lbs)';
  }

  // Show/hide arm selector for SA Low Row
  if (armSelector) {
    armSelector.style.display = (movement === 'row') ? 'flex' : 'none';
  }

  // Hide result when movement changes
  document.getElementById('calc-result').style.display = 'none';
  lastCalcResult = null;
}

function calculateScore() {
  const movement = document.getElementById('calc-movement').value;
  const weightInput = parseFloat(document.getElementById('calc-weight').value);
  const repsInput = parseInt(document.getElementById('calc-reps').value);

  if (!weightInput || !repsInput || weightInput <= 0 || repsInput <= 0) {
    shakeField();
    return;
  }

  let totalWeight, score, movementLabel, mathString;
  const arm = getSelectedArm();

  switch (movement) {
    case 'chest':
      totalWeight = weightInput * 2;
      score = totalWeight * repsInput;
      movementLabel = 'CHEST PRESS';
      mathString = `${weightInput} lb × 2 dumbbells × ${repsInput} reps = ${totalWeight} × ${repsInput}`;
      break;
    case 'row':
      totalWeight = weightInput;
      score = totalWeight * repsInput;
      movementLabel = `SA LOW ROW — ${arm.toUpperCase()} ARM`;
      mathString = `${weightInput} lb × ${repsInput} reps`;
      break;
    case 'squat':
      totalWeight = weightInput;
      score = totalWeight * repsInput;
      movementLabel = 'SQUAT';
      mathString = `${weightInput} lb × ${repsInput} reps`;
      break;
    case 'deadlift':
      totalWeight = weightInput;
      score = totalWeight * repsInput;
      movementLabel = 'DEADLIFT';
      mathString = `${weightInput} lb × ${repsInput} reps`;
      break;
  }

  lastCalcResult = { movement, movementLabel, score, totalWeight, repsInput, arm };

  document.getElementById('result-movement').textContent = movementLabel;
  document.getElementById('result-score-num').textContent = score.toLocaleString();
  document.getElementById('result-math').textContent = mathString;

  const resultEl = document.getElementById('calc-result');
  resultEl.style.display = 'block';
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function shakeField() {
  const btn = document.querySelector('.calc-btn');
  btn.style.animation = 'none';
  btn.offsetHeight; // reflow
  btn.style.background = '#ff444422';
  btn.style.borderColor = '#ff4444';
  btn.textContent = 'Enter weight & reps';
  setTimeout(() => {
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.textContent = 'Calculate Score';
  }, 1500);
}

// ─── Arm Selector ─────────────────────────────────────────
function getSelectedArm() {
  const active = document.querySelector('.arm-btn.active');
  return active ? active.dataset.arm : 'left';
}

// Inject arm selector into the score tab on page load
document.addEventListener('DOMContentLoaded', () => {
  const moveField = document.getElementById('calc-movement');
  if (!moveField) return;

  const armDiv = document.createElement('div');
  armDiv.className = 'arm-selector';
  armDiv.id = 'arm-selector';
  armDiv.style.display = 'none';
  armDiv.innerHTML = `
    <button class="arm-btn active" data-arm="left" onclick="selectArm(this)">Left Arm</button>
    <button class="arm-btn" data-arm="right" onclick="selectArm(this)">Right Arm</button>
  `;
  // Insert after weight field
  const weightField = document.getElementById('calc-weight').closest('.field-group');
  weightField.after(armDiv);
});

function selectArm(btn) {
  document.querySelectorAll('.arm-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── Save Scores ───────────────────────────────────────────
const STORAGE_KEY = 'sos_best_scores_v2';

function loadSavedScores() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  updateScoreDisplay(saved);
}

function saveScore() {
  if (!lastCalcResult) return;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const key = getScoreKey(lastCalcResult.movement, lastCalcResult.arm);
  const existing = saved[key] || 0;

  if (lastCalcResult.score >= existing) {
    saved[key] = lastCalcResult.score;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    updateScoreDisplay(saved);
    showToast(lastCalcResult.score > existing ? '🏆 New best score saved!' : '✓ Score saved');
  } else {
    showToast('Your best is still ' + existing.toLocaleString());
  }
}

function getScoreKey(movement, arm) {
  if (movement === 'row') return 'row-' + (arm || 'left');
  return movement;
}

function updateScoreDisplay(saved) {
  const updates = {
    'best-chest':   saved['chest']   || null,
    'best-row-l':   saved['row-left']|| null,
    'best-row-r':   saved['row-right']|| null,
    'best-squat':   saved['squat']   || null,
    'best-deadlift':saved['deadlift']|| null,
  };

  for (const [id, val] of Object.entries(updates)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (val) {
      el.textContent = val.toLocaleString();
      el.className = 'score-val';
    } else {
      el.textContent = '—';
      el.className = 'score-val empty';
    }
  }
}

function clearScores() {
  if (!confirm('Clear all saved scores?')) return;
  localStorage.removeItem(STORAGE_KEY);
  loadSavedScores();
  showToast('Scores cleared');
}

// ─── Toast ─────────────────────────────────────────────────
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
