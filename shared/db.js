// shared/db.js — Firebase Firestore backend

const STORE_BALANCES = 'balances';
const STORE_INVOICES = 'invoices';
const STORE_BARBERS  = 'barbers';
const STORE_PAYROLLS = 'payrolls';

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAUGmD0wQ3xk_HNlx4UmwWY3wQ9cAU78CI",
  authDomain:        "barberia-a7141.firebaseapp.com",
  projectId:         "barberia-a7141",
  storageBucket:     "barberia-a7141.appspot.com",
  messagingSenderId: "1064291170129",
  appId:             "1:1064291170129:web:433080bc9154e0ece7c570"
};

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    if (typeof firebase === 'undefined') {
      reject(new Error('Firebase SDK no cargado.'));
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    _db = firebase.firestore();
    resolve(_db);
  });
}

async function _col(storeName) {
  const db = await openDB();
  return db.collection(storeName);
}

function _docToObj(doc) {
  const data = doc.data();
  delete data._createdAt;
  delete data._updatedAt;
  return { id: doc.id, ...data };
}

async function add(storeName, obj) {
  const col = await _col(storeName);
  const { id, ...data } = obj;
  const ref = await col.add({
    ...data,
    _createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

async function put(storeName, obj) {
  const col = await _col(storeName);
  const { id, ...data } = obj;
  if (!id) throw new Error('put() requiere obj.id');
  await col.doc(String(id)).set(
    { ...data, _updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  return id;
}

async function getAll(storeName) {
  const col  = await _col(storeName);
  const snap = await col.get();
  return snap.docs.map(_docToObj);
}

async function getByIndex(storeName, fieldName, value) {
  const col  = await _col(storeName);
  const snap = await col.where(fieldName, '==', value).get();
  return snap.docs.map(_docToObj);
}

async function getOne(storeName, id) {
  const col = await _col(storeName);
  const doc = await col.doc(String(id)).get();
  return doc.exists ? _docToObj(doc) : undefined;
}

async function remove(storeName, id) {
  const col = await _col(storeName);
  await col.doc(String(id)).delete();
  return true;
}

window.db = {
  openDB, add, put, getAll, getByIndex, getOne, remove,
  STORE_INVOICES, STORE_BARBERS, STORE_PAYROLLS, STORE_BALANCES
};
