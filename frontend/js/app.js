'use strict';
// CloudNova Frontend – lädt alle Produkte über die API (/api via Nginx-Reverse-Proxy).
const grid = document.getElementById('grid');
const statusBox = document.getElementById('status');
const chips = document.getElementById('chips');
const countEl = document.getElementById('result-count');
const badge = document.getElementById('instance-badge');
const form = document.getElementById('search-form');
const input = document.getElementById('search');

let activeCategory = '';
let requestId = 0;
const priceFmt = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' });

function showStatus(message, kind = 'info', retry = false) {
  statusBox.className = `status ${kind}`;
  statusBox.textContent = message;
  if (retry) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Erneut versuchen';
    btn.addEventListener('click', loadProducts);
    statusBox.append(' ', btn);
  }
  statusBox.hidden = false;
}

function hideStatus() { statusBox.hidden = true; }

function skeletons() {
  grid.setAttribute('aria-busy', 'true');
  grid.replaceChildren(...Array.from({ length: 6 }, () => {
    const d = document.createElement('div');
    d.className = 'card skeleton';
    return d;
  }));
}

function renderProducts(products) {
  grid.setAttribute('aria-busy', 'false');
  grid.replaceChildren(...products.map((p) => {
    const card = document.createElement('article');
    card.className = 'card';
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = p.category;
    const h = document.createElement('h2'); h.textContent = p.name;
    const desc = document.createElement('p'); desc.textContent = p.description;
    const price = document.createElement('div'); price.className = 'price';
    price.textContent = priceFmt.format(p.price);
    const per = document.createElement('small'); per.textContent = ' / Monat';
    price.append(per);
    card.append(tag, h, desc, price);
    return card;
  }));
}

async function api(path) {
  let res;
  try {
    res = await fetch(path, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error('Der Server ist nicht erreichbar. Bitte prüfen Sie Ihre Verbindung.');
  }
  const served = res.headers.get('X-Served-By');
  if (served) { badge.textContent = `Backend: ${served}`; badge.hidden = false; }
  let body = null;
  try { body = await res.json(); } catch { /* keine JSON-Antwort */ }
  if (!res.ok) {
    const msg = body && body.error ? body.error
      : res.status === 502 || res.status === 504 ? 'Das Backend antwortet nicht. Bitte später erneut versuchen.'
      : `Unerwarteter Fehler (HTTP ${res.status}).`;
    throw new Error(msg);
  }
  return body;
}

async function loadProducts() {
  const id = ++requestId;
  hideStatus();
  skeletons();
  const params = new URLSearchParams();
  if (input.value.trim()) params.set('search', input.value.trim());
  if (activeCategory) params.set('category', activeCategory);
  const qs = params.toString();
  try {
    const data = await api(`/api/products${qs ? '?' + qs : ''}`);
    if (id !== requestId) return; // veraltete Antwort ignorieren
    countEl.textContent = `${data.count} ${data.count === 1 ? 'Produkt' : 'Produkte'}`;
    if (data.count === 0) {
      grid.replaceChildren();
      grid.setAttribute('aria-busy', 'false');
      showStatus('Keine Produkte gefunden. Versuchen Sie einen anderen Suchbegriff.');
      return;
    }
    renderProducts(data.products);
  } catch (err) {
    if (id !== requestId) return;
    grid.replaceChildren();
    grid.setAttribute('aria-busy', 'false');
    countEl.textContent = '';
    showStatus(err.message, 'error', true);
  }
}

function renderChips(categories) {
  const make = (label, value) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (value === activeCategory ? ' active' : '');
    b.textContent = label;
    b.setAttribute('aria-pressed', String(value === activeCategory));
    b.addEventListener('click', () => { activeCategory = value; renderChips(categories); loadProducts(); });
    return b;
  };
  chips.replaceChildren(make('Alle', ''), ...categories.map((c) => make(c, c)));
}

form.addEventListener('submit', (e) => { e.preventDefault(); loadProducts(); });
let timer;
input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadProducts, 300); });

(async () => {
  try { renderChips((await api('/api/products/categories')).categories); } catch { /* Filter ist optional */ }
  loadProducts();
})();
