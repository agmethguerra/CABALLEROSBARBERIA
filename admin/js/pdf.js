// admin/js/pdf.js
// usa html2canvas + jspdf (incluye enlaces en index.html si las añades)
async function exportInvoicesPDF(data){
  const w = document.createElement('div');
  w.style.width = '800px'; w.style.padding = '18px'; w.style.background = '#fff';
  w.innerHTML = `<h2>Reporte Facturas — Caballeros Barbería</h2><p>${new Date().toLocaleString()}</p>
    <table style="width:100%;border-collapse:collapse"><thead><tr><th>Fecha</th><th>Barbero</th><th>Total</th><th>Barbero</th><th>Barbería</th></tr></thead>
    <tbody>${data.map(i=>`<tr><td>${new Date(i.date).toLocaleString()}</td><td>${i.barber}</td><td>${utils.formatCurrency(i.gross)}</td><td>${utils.formatCurrency(i.barbero)}</td><td>${utils.formatCurrency(i.barberia)}</td></tr>`).join('')}</tbody></table>`;
  document.body.appendChild(w);
  const canvas = await html2canvas(w, {scale:2});
  const img = canvas.toDataURL('image/png');
  const pdf = new jspdf.jsPDF('p','pt','a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(img,'PNG',0,0,width,height);
  pdf.save(`facturas_${Date.now()}.pdf`);
  document.body.removeChild(w);
}

async function exportPayrollToPDF(payroll){
  const w = document.createElement('div');
  w.style.width = '700px'; w.style.padding='18px'; w.style.background='#fff';
  w.innerHTML = `<h2>Nómina — ${payroll.barber}</h2>
    <p>Periodo: ${payroll.from} → ${payroll.to}</p>
    <p>Total a pagar: ${utils.formatCurrency(payroll.total)}</p>
    <table style="width:100%;border-collapse:collapse"><thead><tr><th>Fecha</th><th>Total</th><th>Mi gana</th></tr></thead>
    <tbody>${payroll.items.map(i=>`<tr><td>${new Date(i.date).toLocaleString()}</td><td>${utils.formatCurrency(i.gross)}</td><td>${utils.formatCurrency(i.barbero)}</td></tr>`).join('')}</tbody></table>`;
  document.body.appendChild(w);
  const canvas = await html2canvas(w, {scale:2});
  const img = canvas.toDataURL('image/png');
  const pdf = new jspdf.jsPDF('p','pt','a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(img,'PNG',0,0,width,height);
  pdf.save(`nomina_${payroll.barber}_${Date.now()}.pdf`);
  document.body.removeChild(w);
}
