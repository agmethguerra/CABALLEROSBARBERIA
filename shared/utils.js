// shared/utils.js
function formatCurrency(n){ return new Intl.NumberFormat('es-CO').format(Number(n||0)); }
function nowISO(){ return new Date().toISOString(); }
function parseStart(d){ if(!d) return null; const t = new Date(d); t.setHours(0,0,0,0); return t; }
function parseEnd(d){ if(!d) return null; const t = new Date(d); t.setHours(23,59,59,999); return t; }
window.utils = { formatCurrency, nowISO, parseStart, parseEnd };
