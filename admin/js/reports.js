// admin/js/reports.js

document.addEventListener("DOMContentLoaded", () => {
  bindBalanceAction();
});

/* ===================== BALANCE GENERAL ===================== */

function bindBalanceAction() {

  // Se asume que tienes estos inputs en admin/index.html:
  // #r_from, #r_to, #btnGenerateBalance

  const btn = document.getElementById("btnGenerateBalance");
  if (!btn) return; // por si aún no existe el módulo visual

  btn.onclick = async () => {

    const from = document.getElementById("r_from").value;
    const to = document.getElementById("r_to").value;

    if (!from || !to) return alert("Selecciona el rango de fechas");

    // 🔹 Fechas correctas (00:00 → 00:00)
    const fromDate = new Date(from + "T00:00:00");
    const toDate = new Date(to + "T00:00:00");

    const invoices = await getAll("invoices");

    const data = invoices
      .filter(i =>
        new Date(i.date) >= fromDate &&
        new Date(i.date) < toDate
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!data.length) {
      document.getElementById("balanceResult").innerHTML =
        `<p class="small-muted">No hay registros en este rango</p>`;
      return;
    }

    renderBalance(data, from, to);
  };
}

/* ===================== RENDER BALANCE ===================== */

function renderBalance(items, from, to) {

  let totalBarbero = 0;
  let totalBarberia = 0;

  items.forEach(i => {
    totalBarbero += Number(i.barbero);
    totalBarberia += Number(i.barberia);
  });

  const rows = items.map(i => {

    let extrasText = "—";
    if (i.extras && i.extras.length) {
      extrasText = i.extras
        .map(e => `${e.name}: ${utils.formatCurrency(e.value)}`)
        .join("<br>");
    }

    return `
      <tr>
        <td>${new Date(i.date).toLocaleString()}</td>
        <td>${i.barber}</td>
        <td>${i.clientName}</td>
        <td>${i.description}</td>
        <td>${utils.formatCurrency(i.gross)}</td>
        <td>${extrasText}</td>
        <td>${utils.formatCurrency(i.barbero)}</td>
        <td>${utils.formatCurrency(i.barberia)}</td>
      </tr>
    `;
  }).join("");

  const html = `
    <div class="card" style="margin-top:12px">
      <h4>Balance general</h4>
      <p class="small-muted">
        Desde ${from} 00:00 → Hasta ${to} 00:00
      </p>

      <div style="overflow:auto;max-height:400px">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Barbero</th>
              <th>Cliente</th>
              <th>Descripción</th>
              <th>Corte</th>
              <th>Extras</th>
              <th>Barbero</th>
              <th>Barbería</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div style="display:flex;gap:20px;margin-top:10px">
        <h3>🔵 Total Barberos: ${utils.formatCurrency(totalBarbero)}</h3>
        <h3>🔴 Total Barbería: ${utils.formatCurrency(totalBarberia)}</h3>
      </div>

      <button class="btn"
        onclick='exportBalancePDF(${JSON.stringify({ items, from, to, totalBarbero, totalBarberia })})'>
        Exportar PDF
      </button>
    </div>
  `;

  document.getElementById("balanceResult").innerHTML = html;
}
