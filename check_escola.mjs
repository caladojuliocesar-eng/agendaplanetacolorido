import { db } from "./src/lib/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function checkEscolaData() {
  try {
    console.log("--- Avisos ---");
    const avisosSnap = await getDocs(collection(db(), "avisos"));
    avisosSnap.forEach(doc => {
      console.log(doc.id, "=>", doc.data());
    });

    console.log("\n--- Eventos ---");
    const eventosSnap = await getDocs(collection(db(), "eventos"));
    eventosSnap.forEach(doc => {
      console.log(doc.id, "=>", doc.data());
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkEscolaData();
