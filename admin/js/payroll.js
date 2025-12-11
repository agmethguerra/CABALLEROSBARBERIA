// admin/js/payroll.js
async function loadPayrolls(){
  const p = await getAll('payrolls');
  const container = document.getElementById('payrollList');
  if(!p || p.length === 0){ container.innerHTML = '<div class="small-muted">No hay nóminas generadas.</div>'; return; }
  container.innerHTML = p.map(r=>`
    <div style="padding:8px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div><strong>${r.barber}</strong> — ${new Date(r.createdAt).toLocaleString()}</div>
        <div class="small-muted">Rango: ${r.from} → ${r.to} • Total: ${utils.formatCurrency(r.total)}</div>
      </div>
      <div>
        <button class="btn" onclick="exportPayrollPDF(${r.id})">Exportar</button>
        <button class="btn" style="${r.paid ? 'background:#4caf50;color:white' : ''}" onclick="togglePayrollPaid(${r.id})">${r.paid ? 'Pagada' : 'Marcar pagada'}</button>
      </div>
    </div>
  `).join('');
}

document.getElementById('btnGeneratePayroll').addEventListener('click', async ()=>{
  const barber = document.getElementById('p_barber').value;
  const from = document.getElementById('p_from').value;
  const to = document.getElementById('p_to').value;
  if(!barber || !from || !to) return alert('Selecciona barbero y rango');

  const invoices = await getAll('invoices');
  const s = utils.parseStart(from);
  const e = utils.parseEnd(to);
  const items = invoices.filter(i => i.barber === barber && new Date(i.date) >= s && new Date(i.date) <= e);
  if(items.length === 0) return alert('No hay cortes en el periodo');

  const total = items.reduce((a,b)=> a + Number(b.barbero || 0), 0);
  const payroll = {
    barber, from, to, items, total, paid:false, createdAt: new Date().toISOString()
  };
  await add('payrolls', payroll);
  await loadPayrolls();
  alert('Nómina generada');
});

async function togglePayrollPaid(id){
  const p = await getOne('payrolls', id);
  p.paid = !p.paid;
  await put('payrolls', p);
  await loadPayrolls();
}

async function exportPayrollPDF(id){
  const p = await getOne('payrolls', id);
  if(!p) return;
  // reutiliza admin/js/pdf.js export function
  exportPayrollToPDF(p);
}
