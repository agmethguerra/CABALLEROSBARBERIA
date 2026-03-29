// admin/js/admin-app.js — versión mejorada

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  checkAdmin();
  await loadBarbers();
  await loadInvoices();
  await renderSavedPayrolls();
  await renderSavedBalances();
  await renderKPIs();
  bindPayrollAction();
  bindBalanceAction();
  bindAddBarber();
  setDefaultDates();
});

/* ── AUTH ──────────────────────────────────────────────────── */
function checkAdmin() {
  const u = auth.currentUser();
  if (!u || u.role !== 'admin') { location.href = '../login.html'; return; }
  const el = document.getElementById('adminNameDisplay');
  if (el) el.textContent = u.name || u.username;
}

/* ── TABS ──────────────────────────────────────────────────── */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

/* ── SET DEFAULT DATES (hoy) ───────────────────────────────── */
function setDefaultDates() {
  const today = new Date().toISOString().slice(0,10);
  const month = today.slice(0,8) + '01';
  ['p_from','b_from'].forEach(id => { const el = document.getElementById(id); if(el) el.value = month; });
  ['p_to','b_to'].forEach(id => { const el = document.getElementById(id); if(el) el.value = today; });
}

/* ── KPIs GLOBALES ─────────────────────────────────────────── */
async function renderKPIs() {
  const all    = await getAll('invoices');
  const today  = new Date().toDateString();
  const month  = new Date().getMonth();
  const year   = new Date().getFullYear();

  const todayInv = all.filter(i => new Date(i.date).toDateString() === today);
  const monthInv = all.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const todayBarberia = todayInv.reduce((a,b) => a+Number(b.barberia), 0);
  const monthBarberia = monthInv.reduce((a,b) => a+Number(b.barberia), 0);
  const monthTotal    = monthInv.reduce((a,b) => a+Number(b.gross), 0);
  const todayCuts     = todayInv.length;

  document.getElementById('kpiRow').innerHTML = `
    <div class="kpi-card accent">
      <div class="kpi-label">Cortes hoy</div>
      <div class="kpi-value text-gold">${todayCuts}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Barbería hoy</div>
      <div class="kpi-value">${utils.formatCurrency(todayBarberia)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total mes</div>
      <div class="kpi-value">${utils.formatCurrency(monthTotal)}</div>
    </div>
    <div class="kpi-card accent">
      <div class="kpi-label">Barbería mes</div>
      <div class="kpi-value text-gold">${utils.formatCurrency(monthBarberia)}</div>
    </div>
  `;
}

/* ── BARBERS SELECT ────────────────────────────────────────── */
async function loadBarbers() {
  const barbers = await getAll('barbers');

  const selects = ['p_barber', 'f_barber'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const allOption = id === 'f_barber' ? '<option value="">Todos los barberos</option>' : '<option value="">Selecciona barbero</option>';
    el.innerHTML = allOption + barbers
      .filter(b => b.role === 'barber')
      .map(b => `<option value="${b.username}">${b.name || b.username}</option>`)
      .join('');
  });

  renderBarbersAdmin(barbers);
}

/* ── FACTURACIÓN ───────────────────────────────────────────── */
async function loadInvoices() {
  const tbody    = document.getElementById('invoiceList');
  const footer   = document.getElementById('invoiceFooter');
  if (!tbody) return;

  const all       = await getAll('invoices');
  const barberVal = document.getElementById('f_barber')?.value || '';
  const fromVal   = document.getElementById('f_from')?.value;
  const toVal     = document.getElementById('f_to')?.value;

  let items = all.sort((a,b) => new Date(b.date) - new Date(a.date));

  if (barberVal) items = items.filter(i => i.barber === barberVal);
  if (fromVal)   items = items.filter(i => new Date(i.date) >= new Date(fromVal + 'T00:00:00'));
  if (toVal)     items = items.filter(i => new Date(i.date) <= new Date(toVal + 'T23:59:59'));

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><span class="icon">📋</span><p>Sin registros para este filtro</p></div></td></tr>`;
    footer.innerHTML = '';
    return;
  }

  const methodBadge = (m) => {
    const map = { 'Efectivo':'badge-success', 'Transferencia':'badge-warning', 'Nequi':'badge-gold' };
    return `<span class="badge ${map[m] || 'badge-muted'}">${m || '—'}</span>`;
  };

  tbody.innerHTML = items.map(i => `
    <tr>
      <td class="small-muted" style="white-space:nowrap">${utils.formatDateTime(i.date)}</td>
      <td><span class="badge badge-muted">${i.barber}</span></td>
      <td class="fw-600">${i.clientName}</td>
      <td style="max-width:160px">${i.description}${i.extras && i.extras.length ? '<br><span class="small-muted">+'+i.extras.map(e=>e.name).join(', ')+'</span>' : ''}</td>
      <td>${utils.formatCurrency(i.gross)}</td>
      <td>${methodBadge(i.method)}</td>
      <td class="text-success">${utils.formatCurrency(i.barbero)}</td>
      <td class="text-gold">${utils.formatCurrency(i.barberia)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteInvoice(${i.id})">✕</button>
      </td>
    </tr>
  `).join('');

  const totalBruto    = items.reduce((a,b) => a+Number(b.gross), 0);
  const totalBarberos = items.reduce((a,b) => a+Number(b.barbero), 0);
  const totalBarberia = items.reduce((a,b) => a+Number(b.barberia), 0);

  footer.innerHTML = `
    <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:12px 0;border-top:1px solid var(--border)">
      <span class="small-muted">${items.length} registros</span>
      <span>Total bruto: <strong>${utils.formatCurrency(totalBruto)}</strong></span>
      <span class="text-success">Barberos: <strong>${utils.formatCurrency(totalBarberos)}</strong></span>
      <span class="text-gold">Barbería: <strong>${utils.formatCurrency(totalBarberia)}</strong></span>
    </div>
  `;
}

function clearInvoiceFilter() {
  document.getElementById('f_barber').value = '';
  document.getElementById('f_from').value   = '';
  document.getElementById('f_to').value     = '';
  loadInvoices();
}

async function deleteInvoice(id) {
  const ok = await utils.confirmDialog('¿Eliminar esta facturación?');
  if (!ok) return;
  await remove('invoices', id);
  await loadInvoices();
  await renderKPIs();
  utils.showToast('Registro eliminado', 'info');
}

/* ── NÓMINAS ───────────────────────────────────────────────── */
function bindPayrollAction() {
  const btn = document.getElementById('btnGeneratePayroll');
  if (!btn) return;

  btn.onclick = async () => {
    const barber = document.getElementById('p_barber').value;
    const from   = document.getElementById('p_from').value;
    const to     = document.getElementById('p_to').value;
    if (!barber || !from || !to) { utils.showToast('Completa todos los campos', 'error'); return; }

    const fromDate = new Date(from + 'T00:00:00');
    const toDate   = new Date(to   + 'T23:59:59');
    const invoices = await getAll('invoices');
    const items    = invoices.filter(i => i.barber === barber && new Date(i.date) >= fromDate && new Date(i.date) <= toDate);

    if (!items.length) { utils.showToast('No hay cortes en ese rango', 'error'); return; }

    const total = items.reduce((a,b) => a+Number(b.barbero), 0);
    const payroll = { barber, from, to, items, total, createdAt: new Date().toISOString() };
    await add('payrolls', payroll);
    await renderSavedPayrolls();
    utils.showToast('Nómina generada 💰', 'success');
  };
}

async function renderSavedPayrolls() {
  const container = document.getElementById('payrollList');
  if (!container) return;

  const payrolls = await getAll('payrolls');
  if (!payrolls.length) {
    container.innerHTML = `<div class="card"><div class="empty-state"><span class="icon">📄</span><p>No hay nóminas generadas</p></div></div>`;
    return;
  }

  payrolls.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = payrolls.map(p => `
    <div class="payroll-card">
      <div>
        <div class="fw-600" style="font-size:15px">Nómina — ${p.barber}</div>
        <div class="small-muted">${p.from} → ${p.to} · ${p.items.length} cortes</div>
        <div style="margin-top:6px;font-family:var(--font-display);font-size:18px;color:var(--gold)">${utils.formatCurrency(p.total)}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick='exportPayrollToPDF(${JSON.stringify(p)})'>📄 PDF</button>
        <button class="btn btn-danger btn-sm" onclick="deletePayroll(${p.id})">Eliminar</button>
      </div>
    </div>
  `).join('');
}

async function deletePayroll(id) {
  const ok = await utils.confirmDialog('¿Eliminar esta nómina?');
  if (!ok) return;
  await remove('payrolls', id);
  await renderSavedPayrolls();
  utils.showToast('Nómina eliminada', 'info');
}

/* ── BALANCE ───────────────────────────────────────────────── */
function bindBalanceAction() {
  const btn = document.getElementById('btnGenerateBalance');
  if (!btn) return;

  btn.onclick = async () => {
    const from = document.getElementById('b_from').value;
    const to   = document.getElementById('b_to').value;
    if (!from || !to) { utils.showToast('Completa el rango de fechas', 'error'); return; }

    const fromDate = new Date(from + 'T00:00:00');
    const toDate   = new Date(to   + 'T23:59:59');
    const invoices = await getAll('invoices');
    const items    = invoices.filter(i => new Date(i.date) >= fromDate && new Date(i.date) <= toDate);

    if (!items.length) { utils.showToast('No hay datos en este rango', 'error'); return; }

    const totalBarberos = items.reduce((a,b) => a+Number(b.barbero), 0);
    const totalBarberia = items.reduce((a,b) => a+Number(b.barberia), 0);
    const balance = { from, to, items, totalBarberos, totalBarberia, createdAt: new Date().toISOString() };
    await add('balances', balance);
    await renderSavedBalances();
    utils.showToast('Balance generado 📊', 'success');
  };
}

async function renderSavedBalances() {
  const container = document.getElementById('balanceList');
  if (!container) return;

  const balances = await getAll('balances');
  if (!balances.length) {
    container.innerHTML = `<div class="card"><div class="empty-state"><span class="icon">📊</span><p>No hay balances generados</p></div></div>`;
    return;
  }

  balances.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = balances.map(b => {
    // desglose por barbero
    const byBarber = {};
    b.items.forEach(i => {
      if (!byBarber[i.barber]) byBarber[i.barber] = { cuts:0, barbero:0 };
      byBarber[i.barber].cuts++;
      byBarber[i.barber].barbero += Number(i.barbero);
    });
    const barberRows = Object.entries(byBarber).map(([name, data]) =>
      `<div class="barber-row-summary">
        <span class="fw-600">${name} <span class="small-muted">(${data.cuts} cortes)</span></span>
        <span class="text-success">${utils.formatCurrency(data.barbero)}</span>
      </div>`
    ).join('');

    return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div>
          <div class="card-title mb-0" style="margin-bottom:4px">Balance general</div>
          <div class="small-muted">${b.from} → ${b.to} · ${b.items.length} cortes</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick='exportBalanceToPDF(${JSON.stringify(b)})'>📄 PDF</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBalance(${b.id})">Eliminar</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="stat-card">
          <div class="stat-label">Total barberos</div>
          <div class="stat-value text-success">${utils.formatCurrency(b.totalBarberos)}</div>
        </div>
        <div class="stat-card gold-accent">
          <div class="stat-label">Total barbería</div>
          <div class="stat-value gold">${utils.formatCurrency(b.totalBarberia)}</div>
        </div>
      </div>

      <div class="form-label" style="margin-bottom:8px">Por barbero</div>
      ${barberRows}
    </div>
  `;
  }).join('');
}

async function deleteBalance(id) {
  const ok = await utils.confirmDialog('¿Eliminar este balance?');
  if (!ok) return;
  await remove('balances', id);
  await renderSavedBalances();
  utils.showToast('Balance eliminado', 'info');
}

/* ── BARBEROS CRUD ─────────────────────────────────────────── */
function renderBarbersAdmin(list) {
  const container = document.getElementById('barbersList');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><span class="icon">👥</span><p>No hay barberos registrados</p></div>`;
    return;
  }

  container.innerHTML = list.map(b => `
    <div class="barber-item">
      <div class="barber-avatar">${(b.name || b.username).charAt(0).toUpperCase()}</div>
      <div class="barber-info">
        <div class="barber-name">${b.name || b.username}</div>
        <div class="barber-meta">@${b.username} · <span class="badge badge-${b.role === 'admin' ? 'gold' : 'muted'}">${b.role}</span></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="openEditModal(${b.id})">✏️ Editar</button>
        ${b.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteBarber(${b.id})">Eliminar</button>` : ''}
      </div>
    </div>
  `).join('');
}

function bindAddBarber() {
  const btn = document.getElementById('btnAddBarber');
  if (!btn) return;
  btn.onclick = async () => {
    const username = document.getElementById('b_username').value.trim();
    const pass     = document.getElementById('b_pass').value.trim();
    const name     = document.getElementById('b_name').value.trim();
    if (!username || !pass) { utils.showToast('Usuario y contraseña obligatorios', 'error'); return; }
    try {
      await add('barbers', { username, pass, role:'barber', name });
      document.getElementById('b_username').value = '';
      document.getElementById('b_pass').value     = '';
      document.getElementById('b_name').value     = '';
      await loadBarbers();
      utils.showToast(`Barbero ${name || username} creado`, 'success');
    } catch(e) {
      utils.showToast('Error: usuario posiblemente duplicado', 'error');
    }
  };
}

async function openEditModal(id) {
  const b = await getOne('barbers', id);
  document.getElementById('editBarberId').value   = id;
  document.getElementById('editBarberName').value = b.name || '';
  document.getElementById('editBarberPass').value = '';
  document.getElementById('editBarberModal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('editBarberModal').classList.add('hidden');
}

async function saveEditBarber() {
  const id   = Number(document.getElementById('editBarberId').value);
  const b    = await getOne('barbers', id);
  b.name     = document.getElementById('editBarberName').value.trim() || b.name;
  const pass = document.getElementById('editBarberPass').value.trim();
  if (pass) b.pass = pass;
  await put('barbers', b);
  closeEditModal();
  await loadBarbers();
  utils.showToast('Barbero actualizado', 'success');
}

async function deleteBarber(id) {
  const ok = await utils.confirmDialog('¿Eliminar este barbero? (Las facturas no se eliminarán)');
  if (!ok) return;
  await remove('barbers', id);
  await loadBarbers();
  utils.showToast('Barbero eliminado', 'info');
}

/* ── PDF NÓMINA ────────────────────────────────────────────── */
function exportPayrollToPDF(payroll) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  // Header
  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(20);
  doc.text('Caballeros Barbería', 105, 14, { align:'center' });
  doc.setFontSize(11);
  doc.setTextColor(255,255,255);
  doc.text('NÓMINA DE BARBERO', 105, 24, { align:'center' });
  y = 48;

  doc.setTextColor(30,30,30);
  doc.setFontSize(12);
  doc.text(`Barbero: ${payroll.barber}`, 14, y); y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Período: ${payroll.from} — ${payroll.to}`, 14, y); y += 7;
  doc.text(`Generada: ${new Date(payroll.createdAt).toLocaleString('es-CO')}`, 14, y); y += 14;

  // Table header
  doc.setFillColor(240,240,240);
  doc.rect(10, y-5, 190, 9, 'F');
  doc.setFontSize(9); doc.setTextColor(80);
  doc.text('Fecha',       12, y);
  doc.text('Cliente',     48, y);
  doc.text('Servicio',    88, y);
  doc.text('Corte',      140, y, {align:'right'});
  doc.text('Ganancia',   198, y, {align:'right'});
  y += 7;

  doc.setFontSize(9); doc.setTextColor(30);
  payroll.items.forEach(i => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(new Date(i.date).toLocaleDateString('es-CO'), 12, y);
    doc.text((i.clientName||'').substring(0,18), 48, y);
    doc.text((i.description||'').substring(0,30), 88, y);
    doc.text(utils.formatCurrency(i.gross).replace('$ ',''), 140, y, {align:'right'});
    doc.text(utils.formatCurrency(i.barbero).replace('$ ',''), 198, y, {align:'right'});
    y += 6;
  });

  // Total
  y += 4;
  doc.setLineWidth(0.5); doc.setDrawColor(200); doc.line(10, y, 200, y); y += 8;
  doc.setFontSize(13); doc.setTextColor(30);
  doc.text(`TOTAL A PAGAR: ${utils.formatCurrency(payroll.total)}`, 105, y, {align:'center'});

  doc.save(`nomina_${payroll.barber}_${payroll.from}_${payroll.to}.pdf`);
  utils.showToast('PDF generado', 'success');
}

/* ── PDF BALANCE ───────────────────────────────────────────── */
function exportBalanceToPDF(balance) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 20;

  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(20);
  doc.text('Caballeros Barbería', 105, 14, {align:'center'});
  doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text('BALANCE GENERAL', 105, 24, {align:'center'});
  y = 48;

  doc.setTextColor(30); doc.setFontSize(10); doc.setTextColor(100);
  doc.text(`Período: ${balance.from} — ${balance.to}`, 14, y); y += 7;
  doc.text(`Generado: ${new Date(balance.createdAt).toLocaleString('es-CO')}`, 14, y); y += 14;

  // Resumen
  doc.setFillColor(250,248,240);
  doc.rect(10, y-5, 90, 22, 'F');
  doc.rect(110, y-5, 90, 22, 'F');
  doc.setFontSize(9); doc.setTextColor(100);
  doc.text('Total barberos', 14, y); doc.text('Total barbería', 114, y);
  y += 7;
  doc.setFontSize(13); doc.setTextColor(30);
  doc.text(utils.formatCurrency(balance.totalBarberos), 14, y);
  doc.text(utils.formatCurrency(balance.totalBarberia), 114, y);
  y += 18;

  // Tabla
  doc.setFillColor(240,240,240);
  doc.rect(10, y-5, 190, 9, 'F');
  doc.setFontSize(9); doc.setTextColor(80);
  doc.text('Fecha',   12, y);
  doc.text('Barbero', 38, y);
  doc.text('Cliente', 62, y);
  doc.text('Corte',  118, y, {align:'right'});
  doc.text('Barbero $', 150, y, {align:'right'});
  doc.text('Barbería $', 198, y, {align:'right'});
  y += 7;

  doc.setFontSize(9); doc.setTextColor(30);
  balance.items.sort((a,b) => new Date(a.date)-new Date(b.date)).forEach(i => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(new Date(i.date).toLocaleDateString('es-CO'), 12, y);
    doc.text((i.barber||'').substring(0,12), 38, y);
    doc.text((i.clientName||'').substring(0,16), 62, y);
    doc.text(utils.formatCurrency(i.gross).replace('$ ',''), 118, y, {align:'right'});
    doc.text(utils.formatCurrency(i.barbero).replace('$ ',''), 150, y, {align:'right'});
    doc.text(utils.formatCurrency(i.barberia).replace('$ ',''), 198, y, {align:'right'});
    y += 6;
  });

  doc.save(`balance_${balance.from}_${balance.to}.pdf`);
  utils.showToast('PDF generado', 'success');
}
