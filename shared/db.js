// shared/db.js — Firebase Firestore backend
// Misma API pública que la versión IndexedDB: add, put, getAll, getByIndex, getOne, remove

/* ── COLECCIONES ─────────────────────────────────────────────────────────── */
const STORE_BALANCES = "balances";
const STORE_INVOICES = "invoices";
const STORE_BARBERS = "barbers";
const STORE_PAYROLLS = "payrolls";

/* ── CONFIGURACIÓN FIREBASE ──────────────────────────────────────────────── */
// 🔧 Reemplaza con los valores de tu proyecto:
//    Firebase Console → Tu proyecto → ⚙️ Configuración → Agregar app web
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDvUbYOOrEQt3TFugP0rbb7T3Ctr2awQis",
  authDomain: "caballerosbarberia-92083.firebaseapp.com",
  projectId: "caballerosbarberia-92083",
  storageBucket: "caballerosbarberia-92083.firebasestorage.app",
  messagingSenderId: "61416009825",
  appId: "1:61416009825:web:e38cc895752408e026fa20",
  measurementId: "G-GP3SFS5J4M",
};
/* ── INICIALIZACIÓN ──────────────────────────────────────────────────────── */
let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    if (typeof firebase === "undefined") {
      reject(
        new Error(
          "Firebase SDK no cargado. Verifica los <script> en los HTML.",
        ),
      );
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db = firebase.firestore();
    resolve(_db);
  });
}

/* ── HELPERS INTERNOS ────────────────────────────────────────────────────── */
async function _col(storeName) {
  const db = await openDB();
  return db.collection(storeName);
}

// Convierte un Firestore doc snapshot en objeto plano con campo `id`
function _docToObj(doc) {
  const data = doc.data();
  // Quita campos internos de Firestore (_createdAt, _updatedAt)
  delete data._createdAt;
  delete data._updatedAt;
  return { id: doc.id, ...data };
}

/* ── CRUD PÚBLICO ────────────────────────────────────────────────────────── */

/**
 * add(storeName, obj) → Promise<string>  (Firestore auto-id)
 * Si obj.id existe lo descarta para no chocar con el auto-id de Firestore.
 */
async function add(storeName, obj) {
  const col = await _col(storeName);
  const { id, ...data } = obj; // descarta id local si viene
  const ref = await col.add({
    ...data,
    _createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * put(storeName, obj) → Promise<id>
 * Requiere obj.id. Sobreescribe / hace merge del documento.
 */
async function put(storeName, obj) {
  const col = await _col(storeName);
  const { id, ...data } = obj;
  if (!id) throw new Error("put() requiere obj.id");
  await col
    .doc(String(id))
    .set(
      { ...data, _updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
  return id;
}

/**
 * getAll(storeName) → Promise<Array>
 */
async function getAll(storeName) {
  const col = await _col(storeName);
  const snap = await col.get();
  return snap.docs.map(_docToObj);
}

/**
 * getByIndex(storeName, fieldName, value) → Promise<Array>
 * Equivalente al index lookup de IndexedDB.
 */
async function getByIndex(storeName, fieldName, value) {
  const col = await _col(storeName);
  const snap = await col.where(fieldName, "==", value).get();
  return snap.docs.map(_docToObj);
}

/**
 * getOne(storeName, id) → Promise<Object|undefined>
 */
async function getOne(storeName, id) {
  const col = await _col(storeName);
  const doc = await col.doc(String(id)).get();
  return doc.exists ? _docToObj(doc) : undefined;
}

/**
 * remove(storeName, id) → Promise<true>
 */
async function remove(storeName, id) {
  const col = await _col(storeName);
  await col.doc(String(id)).delete();
  return true;
}

/* ── EXPORTS GLOBALES (misma interfaz que antes) ─────────────────────────── */
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
  STORE_BALANCES,
};
