// admin/js/payroll.js

document.addEventListener("DOMContentLoaded", async () => {
  await renderSavedPayrolls();
  bindPayrollAction();
});

/* ===================== GENERAR NÓMINA ===================== */

function bindPayrollAction() {

  const btn = document.getElementById("btnGeneratePayroll");
  if (!btn) return;

  btn.onclick = async () => {

    const barber = document.getElementById("p_barber").value;
    const from = document.getElementById("p_from").value;
    const to = document.getElementById("p_to").value;

    if (!barber) return alert("Selecciona un barbero");
    if (!from || !to) return alert("Selecciona el rango de fechas");

    // Fechas 00:00 → 00:00
    const fromDate = new Date(from + "T00:00:00");
    const toDate = new Date(to + "T00:00:00");

    const invoices = await getAll("invoices");

    const items = invoices.filter(i =>
      i.barber === barber &&
      new Date(i.date) >= fromDate &&
      new Date(i.date) < toDate
    );

    if (!items.length) {
      alert("No hay cortes en este rango");
      return;
    }

    const total = items.reduce((a, b) => a + Number(b.barbero), 0);

    const payroll = {
      id: Date.now(),
      barber,
      from,
      to,
      items,
      total,
      createdAt: new Date().toISOString()
    };

    await add("payrolls", payroll);
    await renderSavedPayrolls();
  };
}

/* ===================== LISTAR NÓMINAS ===================== */

async function renderSavedPayrolls() {

  const container = document.getElementById("payrollList");
  if (!container) return;

  const payrolls = await getAll("payrolls");

  if (!payrolls.length) {
    container.innerHTML =
      `<p class="small-muted">No hay nóminas generadas</p>`;
    return;
  }

  payrolls.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  container.innerHTML = payrolls.map(p => `
    <div class="card" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <strong>Nómina — ${p.barber}</strong><br>
        <span class="small-muted">
          ${p.from} 00:00 → ${p.to} 00:00
        </span><br>
        <strong>Total: ${utils.formatCurrency(p.total)}</strong>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn"
          onclick='exportPayrollToPDF(${JSON.stringify(p)})'>
          PDF
        </button>

        <button class="btn"
          style="background:#e53935;color:white"
          onclick="deletePayroll(${p.id})">
          Eliminar
        </button>
      </div>
    </div>
  `).join("");
}

/* ===================== ELIMINAR NÓMINA ===================== */

async function deletePayroll(id) {
  if (!confirm("¿Eliminar esta nómina?")) return;
  await remove("payrolls", id);
  await renderSavedPayrolls();
}
