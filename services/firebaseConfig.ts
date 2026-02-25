
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC2a3i1nAIrrDWvf_0zfr9sqy9ZDeQ2A40",
  authDomain: "gen-lang-client-0908796257.firebaseapp.com",
  projectId: "gen-lang-client-0908796257",
  storageBucket: "gen-lang-client-0908796257.firebasestorage.app",
  messagingSenderId: "802036256410",
  appId: "1:802036256410:web:670284773b811cbdd55923",
  measurementId: "G-R9CREPEG7W"
};

// Inicializar la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Inicializar y exportar la base de datos (Firestore) para que la app la pueda usar
export const dbFirestore = getFirestore(app);
