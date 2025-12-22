// admin/js/admin-app.js

document.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  checkAdmin();

  await loadBarbers();
  await loadInvoices();

  await renderSavedPayrolls();
  await renderSavedBalances();

  bindPayrollAction();
  bindBalanceAction();
});

/* ===================== AUTH ===================== */

function checkAdmin() {
  const u = auth.currentUser();
  if (!u || u.role !== "admin") {
    location.href = "../login.html";
  }
}

/* ===================== BARBERS ===================== */

async function loadBarbers() {
  const select = document.getElementById("p_barber");
  if (!select) return;

  const barbers = await getAll("barbers");

  select.innerHTML =
    `<option value="">Selecciona barbero</option>` +
    barbers.map(b =>
      `<option value="${b.username}">${b.username}</option>`
    ).join("");
}

/* ===================== FACTURACIÓN ===================== */

async function loadInvoices() {
  const tbody = document.getElementById("invoiceList");
  if (!tbody) return;

  const invoices = await getAll("invoices");

  invoices.sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  tbody.innerHTML = invoices.map(i => `
    <tr>
      <td>${new Date(i.date).toLocaleString()}</td>
      <td>${i.barber}</td>
      <td>${i.clientName}</td>
      <td>${i.description}</td>
      <td>${utils.formatCurrency(i.gross)}</td>
      <td>
        ${
          i.extras && i.extras.length
            ? i.extras.map(e =>
                `${e.name} (${utils.formatCurrency(e.value)})`
              ).join("<br>")
            : "-"
        }
      </td>
      <td>${utils.formatCurrency(i.barbero)}</td>
      <td>${utils.formatCurrency(i.barberia)}</td>
      <td>
        <button
          class="btn"
          style="background:#e53935;color:white"
          onclick="deleteInvoice(${i.id})">
          Eliminar
        </button>
      </td>
    </tr>
  `).join("");
}
async function deleteInvoice(id) {
  if (!confirm("¿Eliminar esta facturación?")) return;
  await remove("invoices", id);
  await loadInvoices();
}

/* ===================== NÓMINAS ===================== */

function bindPayrollAction() {
  const btn = document.getElementById("btnGeneratePayroll");
  if (!btn) return;

  btn.onclick = async () => {
    const barber = document.getElementById("p_barber").value;
    const from = document.getElementById("p_from").value;
    const to = document.getElementById("p_to").value;

    if (!barber || !from || !to) {
      alert("Completa todos los campos de nómina");
      return;
    }

    const fromDate = new Date(from + "T00:00:00");
    const toDate = new Date(to + "T00:00:00");

    const invoices = await getAll("invoices");

    const items = invoices.filter(i =>
      i.barber === barber &&
      new Date(i.date) >= fromDate &&
      new Date(i.date) < toDate
    );

    if (!items.length) {
      alert("No hay cortes en ese rango");
      return;
    }

    const total = items.reduce(
      (a, b) => a + Number(b.barbero), 0
    );

    const payroll = {
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
    <div class="card"
      style="display:flex;justify-content:space-between;align-items:center">

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

async function deletePayroll(id) {
  if (!confirm("¿Eliminar esta nómina?")) return;
  await remove("payrolls", id);
  await renderSavedPayrolls();
}

/* ===================== BALANCE GENERAL ===================== */

function bindBalanceAction() {
  const btn = document.getElementById("btnGenerateBalance");
  if (!btn) return;

  btn.onclick = async () => {
    const from = document.getElementById("b_from").value;
    const to = document.getElementById("b_to").value;

    if (!from || !to) {
      alert("Completa el rango del balance");
      return;
    }

    const fromDate = new Date(from + "T00:00:00");
    const toDate = new Date(to + "T00:00:00");

    const invoices = await getAll("invoices");

    const items = invoices.filter(i =>
      new Date(i.date) >= fromDate &&
      new Date(i.date) < toDate
    );

    if (!items.length) {
      alert("No hay datos en este rango");
      return;
    }

    const totalBarberos = items.reduce(
      (a, b) => a + Number(b.barbero), 0
    );

    const totalBarberia = items.reduce(
      (a, b) => a + Number(b.barberia), 0
    );

    const balance = {
      from,
      to,
      items,
      totalBarberos,
      totalBarberia,
      createdAt: new Date().toISOString()
    };

    await add("balances", balance);
    await renderSavedBalances();
  };
}

async function renderSavedBalances() {
  const container = document.getElementById("balanceList");
  if (!container) return;

  const balances = await getAll("balances");

  if (!balances.length) {
    container.innerHTML =
      `<p class="small-muted">No hay balances generados</p>`;
    return;
  }

  balances.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  container.innerHTML = balances.map(b => `
    <div class="card"
      style="display:flex;justify-content:space-between;align-items:center">

      <div>
        <strong>Balance general</strong><br>
        <span class="small-muted">
          ${b.from} 00:00 → ${b.to} 00:00
        </span><br>
        <strong>Barberos: ${utils.formatCurrency(b.totalBarberos)}</strong><br>
        <strong>Barbería: ${utils.formatCurrency(b.totalBarberia)}</strong>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn"
          onclick='exportBalanceToPDF(${JSON.stringify(b)})'>
          PDF
        </button>
        <button class="btn"
          style="background:#e53935;color:white"
          onclick="deleteBalance(${b.id})">
          Eliminar
        </button>
      </div>
    </div>
  `).join("");
}

async function deleteBalance(id) {
  if (!confirm("¿Eliminar este balance?")) return;
  await remove("balances", id);
  await renderSavedBalances();
}

/* ===================== PDF — NÓMINA ===================== */

async function exportPayrollToPDF(payroll) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  let y = 15;

  /* ===================== HEADER ===================== */
  doc.setFontSize(18);
  doc.text("Nómina de Barbero", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(12);
  doc.text(`Barbero: ${payroll.barber}`, 105, y, { align: "center" });
  y += 6;

  doc.setFontSize(10);
  doc.text(
    `${payroll.from}  -  ${payroll.to}`,
    105,
    y,
    { align: "center" }
  );
  y += 20;

  /* ===================== TABLE HEADER ===================== */
  doc.setFontSize(10);
  doc.setFillColor(230, 230, 230);
  doc.rect(10, y - 5, 190, 8, "F");

  doc.text("Fecha", 12, y);
  doc.text("Cliente", 40, y);
  doc.text("Descripción", 85, y);
  doc.text("Corte", 135, y, { align: "right" });
  doc.text("Ganancia", 190, y, { align: "right" });

  y += 6;

  /* ===================== TABLE BODY ===================== */
  doc.setFontSize(9);

  payroll.items.forEach(i => {
    if (y > 280) {
      doc.addPage();
      y = 15;
    }

    const fecha = new Date(i.date).toLocaleDateString();
    const cliente = i.clientName || "—";
    const desc = i.description || "—";

    doc.text(fecha, 12, y);
    doc.text(cliente, 40, y);
    doc.text(desc, 85, y, { maxWidth: 45 });
    doc.text(utils.formatCurrency(i.gross), 135, y, { align: "right" });
    doc.text(utils.formatCurrency(i.barbero), 190, y, { align: "right" });

    y += 5;
  });

  /* ===================== FOOTER ===================== */
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(10, y, 200, y);
  y += 6;

  doc.setFontSize(12);
  doc.text(
    `TOTAL A PAGAR: ${utils.formatCurrency(payroll.total)}`,
    105,
    y,
    { align: "center" }
  );

  /* ===================== SAVE ===================== */
  doc.save(`nomina_${payroll.barber}_${payroll.from}_${payroll.to}.pdf`);
}

/* ===================== PDF — BALANCE ===================== */

async function exportBalanceToPDF(balance) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  let y = 15;

  /* ===================== HEADER ===================== */
  doc.setFontSize(18);
  doc.text("Balance General", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.text(
    `Periodo: ${balance.from} -  ${balance.to}`,
    105,
    y,
    { align: "center" }
  );
  y += 20;

  /* ===================== TABLE HEADER ===================== */
  doc.setFontSize(10);
  doc.setFillColor(230, 230, 230);
  doc.rect(10, y - 5, 190, 8, "F");

  doc.text("Fecha", 12, y);
  doc.text("Barbero", 35, y);
  doc.text("Cliente", 60, y);
  doc.text("Corte", 115, y, { align: "right" });
  doc.text("Barbero $", 145, y, { align: "right" });
  doc.text("Barbería $", 190, y, { align: "right" });

  y += 6;

  /* ===================== TABLE BODY ===================== */
  doc.setFontSize(9);

  balance.items.forEach(i => {
    if (y > 280) {
      doc.addPage();
      y = 15;
    }

    const fecha = new Date(i.date).toLocaleDateString();
    const cliente = i.clientName || "—";
    const barbero = i.barber || "—";

    doc.text(fecha, 12, y);
    doc.text(barbero, 35, y);
    doc.text(cliente, 60, y);
    doc.text(utils.formatCurrency(i.gross), 115, y, { align: "right" });
    doc.text(utils.formatCurrency(i.barbero), 145, y, { align: "right" });
    doc.text(utils.formatCurrency(i.barberia), 190, y, { align: "right" });

    y += 5;
  });

  /* ===================== FOOTER ===================== */
  y += 6;
  doc.setLineWidth(0.5);
  doc.line(10, y, 200, y);
  y += 6;

  doc.setFontSize(11);
  doc.text(
    `TOTAL BARBEROS: ${utils.formatCurrency(balance.totalBarberos)}`,
    20,
    y
  );
  doc.text(
    `TOTAL BARBERÍA: ${utils.formatCurrency(balance.totalBarberia)}`,
    120,
    y
  );

  /* ===================== SAVE ===================== */
  doc.save(`balance_${balance.from}_${balance.to}.pdf`);
}
