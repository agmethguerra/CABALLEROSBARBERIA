// shared/utils.js

function formatCurrency(n) {
  return '$ ' + new Intl.NumberFormat('es-CO').format(Number(n || 0));
}
function nowISO() { return new Date().toISOString(); }
function parseStart(d) { if (!d) return null; const t = new Date(d); t.setHours(0,0,0,0); return t; }
function parseEnd(d)   { if (!d) return null; const t = new Date(d); t.setHours(23,59,59,999); return t; }

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short' }) + ' ' +
         d.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });
}

/* ── TOAST ─────────────────────────────────────────────── */
function showToast(msg, type = 'info', duration = 3200) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '✨' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInToast 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── CONFIRM MODAL ─────────────────────────────────────── */
function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:360px;text-align:center">
        <p style="font-size:15px;color:var(--text);margin:0 0 24px">${msg}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-ghost" id="cCancel">Cancelar</button>
          <button class="btn btn-danger" id="cConfirm">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#cCancel').onclick  = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#cConfirm').onclick = () => { overlay.remove(); resolve(true); };
  });
}

window.utils = { formatCurrency, nowISO, parseStart, parseEnd, formatDate, formatDateTime, showToast, confirmDialog };
