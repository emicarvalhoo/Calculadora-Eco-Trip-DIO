/**********************************************************************
 * script.js - script externo para EcoTrip
 * - Contém dados, constantes, lógica, manipulação de DOM e eventos
 * - Comentários descritivos em português para cada passo
 **********************************************************************/

/* 1) Dados e constantes (fatores de emissão) */
const EMISSION_FACTORS = {
  bicicleta: 0.01,
  carro: 0.192,
  onibus: 0.089,
  caminhao: 0.62
};

const CARBON_CREDIT = {
  kg_per_credito: 100,
  preco_min_BRL: 50,
  preco_max_BRL: 150
};

/* 2) Estado da aplicação */
const state = { legs: [] };
let nextLegId = 1;

/* 3) UI mapping */
const ui = {
  presetRoute: document.getElementById('preset-route'),
  origin: document.getElementById('origin'),
  destination: document.getElementById('destination'),
  distance: document.getElementById('distance'),
  modeButtons: document.querySelectorAll('.mode-btn'),
  addLegBtn: document.getElementById('add-leg'),
  clearLegsBtn: document.getElementById('clear-legs'),
  legsList: document.getElementById('legs-list'),
  totalCo2: document.getElementById('total-co2'),
  creditsNeeded: document.getElementById('credits-needed'),
  costRange: document.getElementById('cost-range'),
  factorsLegend: document.getElementById('factors-legend'),
  kgPerCreditSpan: document.getElementById('kg-per-credit')
};

let selectedMode = null;

/* 4) Utilitários */
function formatNumber(n, decimals = 2) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function calculateCo2ForLeg(km, mode) {
  const factor = EMISSION_FACTORS[mode];
  if (typeof factor !== 'number') return 0;
  return km * factor;
}
function calculateTotals() {
  const totalCo2 = state.legs.reduce((sum, leg) => sum + leg.co2_kg, 0);
  const credits = Math.ceil(totalCo2 / CARBON_CREDIT.kg_per_credito);
  const costMin = credits * CARBON_CREDIT.preco_min_BRL;
  const costMax = credits * CARBON_CREDIT.preco_max_BRL;
  return { totalCo2, credits, costMin, costMax };
}
function createLegListItem(leg) {
  const li = document.createElement('li');
  li.className = 'leg-item';
  li.dataset.id = String(leg.id);
  li.innerHTML = `
    <div class="leg-main">
      <div class="leg-info">
        <strong>${leg.mode.toUpperCase()}</strong>
        <span class="muted"> — ${leg.origin || 'Origem não informada'} → ${leg.destination || 'Destino não informado'}</span>
        <div class="leg-meta">${formatNumber(leg.km, 1)} km · ${formatNumber(leg.co2_kg, 2)} kg CO₂</div>
      </div>
      <div class="leg-actions">
        <button class="remove-leg" data-id="${leg.id}" title="Remover trecho">Remover</button>
      </div>
    </div>
  `;
  return li;
}

/* 5) Renderização */
function renderFactorsLegend() {
  ui.factorsLegend.innerHTML = '';
  for (const [mode, value] of Object.entries(EMISSION_FACTORS)) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${capitalize(mode)}</strong>: ${formatNumber(value, 3)} kg CO₂ / km`;
    ui.factorsLegend.appendChild(li);
  }
  ui.kgPerCreditSpan.textContent = String(CARBON_CREDIT.kg_per_credito);
}
function renderLegsAndTotals() {
  ui.legsList.innerHTML = '';
  state.legs.forEach(leg => ui.legsList.appendChild(createLegListItem(leg)));
  const totals = calculateTotals();
  animateNumber(ui.totalCo2, totals.totalCo2, 800, 2);
  animateNumber(ui.creditsNeeded, totals.credits, 500, 0);
  ui.costRange.textContent = `R$ ${formatNumber(totals.costMin, 2)} — R$ ${formatNumber(totals.costMax, 2)}`;
}
function animateNumber(element, targetValue, duration = 600, decimals = 2) {
  const startValue = parseFloat(element.textContent.replace(',', '.')) || 0;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const current = startValue + (targetValue - startValue) * easeOutCubic(t);
    element.textContent = formatNumber(current, decimals);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

/* 6) Manipulação */
function addLeg() {
  const kmValue = parseFloat(ui.distance.value || '0');
  if (!selectedMode) { flashMessage('Selecione um modo de locomoção antes de adicionar um trecho.', true); return; }
  if (!(kmValue > 0)) { flashMessage('Informe uma distância válida (> 0 km).', true); return; }
  const leg = {
    id: nextLegId++,
    origin: ui.origin.value.trim(),
    destination: ui.destination.value.trim(),
    km: kmValue,
    mode: selectedMode,
    co2_kg: calculateCo2ForLeg(kmValue, selectedMode)
  };
  state.legs.push(leg);
  renderLegsAndTotals();
  flashMessage('Trecho adicionado com sucesso.', false);
  pulseElement(ui.legsList.lastElementChild);
}
function removeLeg(legId) {
  const id = Number(legId);
  const idx = state.legs.findIndex(l => l.id === id);
  if (idx >= 0) { state.legs.splice(idx, 1); renderLegsAndTotals(); flashMessage('Trecho removido.', false); }
}
function clearLegs() {
  if (state.legs.length === 0) { flashMessage('Nenhum trecho para limpar.', true); return; }
  state.legs = [];
  renderLegsAndTotals();
  flashMessage('Todos os trechos foram removidos.', false);
}

/* 7) Eventos e inicialização */
function setupModeButtons() {
  ui.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      ui.modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
      flashMessage(`Modo selecionado: ${capitalize(selectedMode)}`, false);
    });
  });
}
function setupButtons() {
  ui.addLegBtn.addEventListener('click', (e) => { e.preventDefault(); addLeg(); });
  ui.clearLegsBtn.addEventListener('click', (e) => { e.preventDefault(); clearLegs(); });
  ui.legsList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-leg');
    if (removeBtn) { const id = removeBtn.dataset.id; removeLeg(id); }
  });
  ui.presetRoute.addEventListener('change', () => {
    const opt = ui.presetRoute.selectedOptions[0];
    if (opt && opt.value) {
      ui.origin.value = opt.dataset.from || ui.origin.value;
      ui.destination.value = opt.dataset.to || ui.destination.value;
      ui.distance.value = opt.value;
      flashMessage('Rota pré-definida carregada.', false);
    }
  });
  ui.distance.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addLeg(); } });
}

/* 8) UI auxiliares */
function flashMessage(msg, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 20);
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 2200);
}
function pulseElement(el) { if (!el) return; el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 700); }
function capitalize(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

/* 9) Inicialização */
function init() {
  renderFactorsLegend();
  renderLegsAndTotals();
  setupModeButtons();
  setupButtons();
  document.body.classList.add('initialized');
  flashMessage('EcoTrip pronta — selecione um modo e adicione trechos.', false);
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
