// firebase-config.js

// CORREÇÃO: Usamos o endereço completo (URL) do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDD7Js1HarlpO-tGeyg4GTzOtfI_I9WkCA",
  authDomain: "sistema-ponto-5e83e.firebaseapp.com",
  projectId: "sistema-ponto-5e83e",
  storageBucket: "sistema-ponto-5e83e.appspot.com",
  messagingSenderId: "268073223450",
  appId: "1:268073223450:web:4fb1915628354a4c9c18a3",
  measurementId: "G-FF2WKYZXH1"
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o banco de dados (Firestore) para que outros arquivos possam usá-lo
export const db = getFirestore(app);