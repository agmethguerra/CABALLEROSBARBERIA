// shared/db.js

const DB_NAME = "caballeros_finanzas_v1";
const DB_VERSION = 2;

const STORE_BALANCES = "balances";
const STORE_INVOICES = "invoices";
const STORE_BARBERS  = "barbers";
const STORE_PAYROLLS = "payrolls";

let _db = null;

/* ===================== OPEN DB ===================== */

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      if (!db.objectStoreNames.contains("balances")) {
        db.createObjectStore("balances", {
          keyPath: "id",
          autoIncrement: true
        });
      }

      /* ---------- INVOICES ---------- */
      if (!db.objectStoreNames.contains(STORE_INVOICES)) {
        const s = db.createObjectStore(STORE_INVOICES, {
          keyPath: "id",
          autoIncrement: true
        });
        s.createIndex("date", "date", { unique: false });
        s.createIndex("barber", "barber", { unique: false });
      }

      /* ---------- BARBERS ---------- */
      if (!db.objectStoreNames.contains(STORE_BARBERS)) {
        const s = db.createObjectStore(STORE_BARBERS, {
          keyPath: "id",
          autoIncrement: true
        });
        s.createIndex("username", "username", { unique: true });
      }

      /* ---------- PAYROLLS ---------- */
      if (!db.objectStoreNames.contains(STORE_PAYROLLS)) {
        db.createObjectStore(STORE_PAYROLLS, {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = (e) => reject(e);
  });
}

/* ===================== TRANSACTION HELPER ===================== */

function tx(storeName, mode = "readonly") {
  return openDB().then(db =>
    db.transaction(storeName, mode).objectStore(storeName)
  );
}

/* ===================== CRUD HELPERS ===================== */

async function add(storeName, obj) {
  const store = await tx(storeName, "readwrite");
  return new Promise((res, rej) => {
    const r = store.add(obj);
    r.onsuccess = () => res(r.result);
    r.onerror = (e) => rej(e);
  });
}

async function put(storeName, obj) {
  const store = await tx(storeName, "readwrite");
  return new Promise((res, rej) => {
    const r = store.put(obj);
    r.onsuccess = () => res(r.result);
    r.onerror = (e) => rej(e);
  });
}

async function getAll(storeName) {
  const store = await tx(storeName, "readonly");
  return new Promise((res, rej) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = (e) => rej(e);
  });
}

async function getByIndex(storeName, indexName, value) {
  const store = await tx(storeName, "readonly");
  return new Promise((res, rej) => {
    const idx = store.index(indexName);
    const r = idx.getAll(value);
    r.onsuccess = () => res(r.result || []);
    r.onerror = (e) => rej(e);
  });
}

async function getOne(storeName, id) {
  const store = await tx(storeName, "readonly");
  return new Promise((res, rej) => {
    const r = store.get(Number(id));
    r.onsuccess = () => res(r.result);
    r.onerror = (e) => rej(e);
  });
}

async function remove(storeName, id) {
  const store = await tx(storeName, "readwrite");
  return new Promise((res, rej) => {
    const r = store.delete(Number(id));
    r.onsuccess = () => res(true);
    r.onerror = (e) => rej(e);
  });
}

/* ===================== EXPORTS GLOBALES ===================== */

window.db = {
  openDB,
  add,
  put,
  getAll,
  getByIndex,
  getOne,
  remove,

  STORE_INVOICES,
  STORE_BARBERS,
  STORE_PAYROLLS,
  STORE_BALANCES
};
