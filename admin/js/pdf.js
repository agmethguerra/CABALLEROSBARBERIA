// admin/js/pdf.js
// Requiere html2canvas y jsPDF (CDN ya cargados en admin/index.html)

/* ===================== FACTURAS ===================== */

async function exportInvoicesPDF(invoices) {

  const container = document.createElement("div");
  container.style.width = "900px";
  container.style.padding = "16px";
  container.style.background = "#fff";

  container.innerHTML = `
    <h2>Facturación completa — Caballeros Barbería</h2>
    <p>${new Date().toLocaleString()}</p>

    <table style="width:100%;border-collapse:collapse;font-size:12px">
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
        ${invoices.map(i => {
          let extras = "—";
          if (i.extras && i.extras.length) {
            extras = i.extras
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
              <td>${extras}</td>
              <td>${utils.formatCurrency(i.barbero)}</td>
              <td>${utils.formatCurrency(i.barberia)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  await exportHTMLToPDF(container, `facturas_${Date.now()}.pdf`);
}

/* ===================== NÓMINA ===================== */

async function exportPayrollToPDF(payroll) {

  const container = document.createElement("div");
  container.style.width = "800px";
  container.style.padding = "16px";
  container.style.background = "#fff";

  container.innerHTML = `
    <h2>Nómina — ${payroll.barber}</h2>
    <p>Periodo: ${payroll.from} 00:00 → ${payroll.to} 00:00</p>

    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Descripción</th>
          <th>Corte</th>
          <th>Gana barbero</th>
        </tr>
      </thead>
      <tbody>
        ${payroll.items.map(i => `
          <tr>
            <td>${new Date(i.date).toLocaleString()}</td>
            <td>${i.clientName}</td>
            <td>${i.description}</td>
            <td>${utils.formatCurrency(i.gross)}</td>
            <td>${utils.formatCurrency(i.barbero)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h3>Total a pagar: ${utils.formatCurrency(payroll.total)}</h3>
  `;

  await exportHTMLToPDF(
    container,
    `nomina_${payroll.barber}_${Date.now()}.pdf`
  );
}

/* ===================== BALANCE GENERAL ===================== */

async function exportBalancePDF(data) {

  const container = document.createElement("div");
  container.style.width = "900px";
  container.style.padding = "16px";
  container.style.background = "#fff";

  container.innerHTML = `
    <h2>Balance general — Caballeros Barbería</h2>
    <p>Periodo: ${data.from} 00:00 → ${data.to} 00:00</p>

    <table style="width:100%;border-collapse:collapse;font-size:12px">
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
        ${data.items.map(i => {
          let extras = "—";
          if (i.extras && i.extras.length) {
            extras = i.extras
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
              <td>${extras}</td>
              <td>${utils.formatCurrency(i.barbero)}</td>
              <td>${utils.formatCurrency(i.barberia)}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>

    <div style="display:flex;gap:24px;margin-top:12px">
      <h3>🔵 Total Barberos: ${utils.formatCurrency(data.totalBarbero)}</h3>
      <h3>🔴 Total Barbería: ${utils.formatCurrency(data.totalBarberia)}</h3>
    </div>
  `;

  await exportHTMLToPDF(
    container,
    `balance_${Date.now()}.pdf`
  );
}

/* ===================== CORE EXPORT ===================== */

async function exportHTMLToPDF(container, filename) {

  document.body.appendChild(container);

  const canvas = await html2canvas(container, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jspdf.jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = (canvas.height * pageWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  pdf.save(filename);

  document.body.removeChild(container);
}
