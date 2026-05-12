import admin from "firebase-admin";
import { readFileSync } from "fs";

// Inicializa Admin SDK
let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync("./service-account.json", "utf8"));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.error("❌ Erro ao ler service-account.json.");
    process.exit(1);
}

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
`.trim();

async function updateRules() {
    console.log("🚀 Tentando atualizar as regras do Firestore via Admin SDK...");
    try {
        const securityRules = admin.securityRules();
        
        const source = {
            files: [
                {
                    name: "firestore.rules",
                    content: rules,
                },
            ],
        };

        const ruleset = await securityRules.createRuleset(source);
        await securityRules.releaseRuleset(ruleset.name, "cloud.firestore");
        
        console.log("✅ Regras publicadas com sucesso!");
        console.log("------------------------------------");
        console.log(rules);
        console.log("------------------------------------");
    } catch (err) {
        console.error("❌ Erro ao atualizar regras:", err.message);
        if (err.message.includes("permission_denied")) {
            console.log("\n⚠️ Dica: O Service Account no service-account.json precisa da role 'Firebase Rules Admin' ou 'Owner'.");
        }
    }
    process.exit(0);
}

updateRules();
