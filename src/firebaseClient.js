import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Config de tu proyecto Firebase (cliente web)
const firebaseConfig = {
  apiKey: "AIzaSyCfE1NHzgZ9SkxH2lw3GaxmGEh6Z7G9P4g",
  authDomain: "inventario-antorchadplata.firebaseapp.com",
  databaseURL: "https://inventario-antorchadplata-default-rtdb.firebaseio.com",
  projectId: "inventario-antorchadplata",
  storageBucket: "inventario-antorchadplata.firebasestorage.app",
  messagingSenderId: "388835048404",
  appId: "1:388835048404:web:8da032d19eca8ec73a3441",
  // measurementId no lo usamos aquí
};

let app = null;
let dbRT = null;

export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
};

export const getFirebaseDatabase = () => {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
    dbRT = getDatabase(app);
  }
  return dbRT;
};
