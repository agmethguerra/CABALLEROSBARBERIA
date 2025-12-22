// barber/js/barber-app.js

document.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await auth.seedDefaultUsers();
  checkBarber();
  bindInvoiceAction();
  loadMyInvoices();
});

/* ===================== VALIDAR BARBERO ===================== */

function checkBarber() {
  const u = auth.currentUser();
  if (!u || u.role !== "barber") {
    location.href = "../login.html";
    return;
  }
  document.getElementById("barberName").innerText =
    u.name || u.username;
  document.getElementById("welcomeBarber").innerText =
  `Hola ${u.name || u.username}, Bienvenid@`;
}

/* ===================== REGISTRAR FACTURA ===================== */

function bindInvoiceAction() {
  const btn = document.getElementById("btnInvoice");

  btn.onclick = async () => {

    const barber = auth.currentUser().username;

    // 🔹 DATOS DEL CLIENTE
    const clientName = document.getElementById("clientName").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!clientName) return alert("Debes ingresar el nombre del cliente");
    if (!description) return alert("Debes ingresar la descripción del corte");

    // 🔹 CORTE
    const price = Number(document.getElementById("price").value);
    if (!price || price <= 0) return alert("Precio del corte inválido");

    const method = document.getElementById("method").value;

    // 🔹 EXTRAS
    const extras = [];
    document.querySelectorAll(".extra-row").forEach(row => {
      const name = row.querySelector(".extra-name").value.trim();
      const value = Number(row.querySelector(".extra-value").value);

      if (name && value > 0) {
        extras.push({ name, value });
      }
    });

    const extrasSum = extras.reduce((a, b) => a + b.value, 0);

    /* ===================== LÓGICA FINANCIERA (NO TOCAR) ===================== */
    
    let barbero = 0;
    let barberia = 0;

    if (price < 20000) {
      const FIXED_FEE = 11000;

      barberia = FIXED_FEE + extrasSum;
      barbero = price - FIXED_FEE;

      if (barbero < 0) {
        alert("El precio del corte no cubre el servicio");
        return;
      }

    } else {
      const SERVICE_FEE = 2000;

      const netCut = price - SERVICE_FEE;
      if (netCut < 0) {
        alert("El precio del corte no cubre el servicio");
        return;
      }

      const half = netCut / 2;

      barbero = half;
      barberia = half + extrasSum + SERVICE_FEE;
    }

    /* ===================== FACTURA ===================== */

    const invoice = {
      id: Date.now(),
      date: new Date().toISOString(),

      barber,
      clientName,
      description,

      price,
      gross: price,

      extras,
      extrasSum,

      barbero,
      barberia,

      method
    };

    await add("invoices", invoice);

    clearForm();
    loadMyInvoices();
  };
}

/* ===================== LIMPIAR FORM ===================== */

function clearForm() {
  document.getElementById("clientName").value = "";
  document.getElementById("description").value = "";
  document.getElementById("price").value = "";

  document.querySelectorAll(".extra-row").forEach(row => row.remove());
}

/* ===================== MIS FACTURAS ===================== */

async function loadMyInvoices() {
  const barber = auth.currentUser().username;
  const all = await getAll("invoices");

  const mine = all
    .filter(i => i.barber === barber)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const tbody = document.getElementById("myInvoices");

  tbody.innerHTML = mine.map(i => `
    <tr>
      <td>${new Date(i.date).toLocaleString()}</td>
      <td>${i.clientName}</td>
      <td>${i.description}</td>
      <td>${utils.formatCurrency(i.gross)}</td>
      <td>${utils.formatCurrency(i.barbero)}</td>
    </tr>
  `).join("");
}
