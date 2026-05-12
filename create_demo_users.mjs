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
    console.error("❌ Erro ao ler service-account.json. Certifique-se que o arquivo existe.");
    process.exit(1);
}

const db = admin.firestore();
const authAdmin = admin.auth();

// Senha padrão para todos os usuários demo
const DEMO_PASSWORD = "ottomatic2025";

const DEMO_USERS = [
    {
        email: "diretora@demo.com",
        displayName: "Helena (Diretora)",
        firestoreUid: "demo_diretora",
        profileData: {
            nome: "Helena (Diretora)",
            email: "diretora@demo.com",
            role: "admin",
            escolaId: "planeta-colorido",
        }
    },
    {
        email: "profe@demo.com",
        displayName: "Ana Cláudia (Profe)",
        firestoreUid: "demo_professora",
        profileData: {
            nome: "Ana Cláudia (Profe)",
            email: "profe@demo.com",
            role: "professor",
            escolaId: "planeta-colorido",
            turma: "Berçário II",
        }
    },
    {
        email: "pai@demo.com",
        displayName: "Ricardo (Pai do Otto)",
        firestoreUid: "demo_pai",
        profileData: {
            nome: "Ricardo (Pai do Otto)",
            email: "pai@demo.com",
            role: "pai",
            escolaId: "planeta-colorido",
            filhos: ["aluno_otto"],
        }
    }
];

async function createDemoUsers() {
    console.log("🚀 Criando usuários demo no Firebase Authentication...\n");

    for (const user of DEMO_USERS) {
        try {
            // Tenta buscar se já existe
            let authUser;
            try {
                authUser = await authAdmin.getUserByEmail(user.email);
                console.log(`⚠️  Conta já existe: ${user.email} (UID: ${authUser.uid})`);
                // Atualiza a senha mesmo assim para garantir
                await authAdmin.updateUser(authUser.uid, {
                    password: DEMO_PASSWORD,
                    displayName: user.displayName,
                });
                console.log(`   ✅ Senha atualizada para: ${DEMO_PASSWORD}`);
            } catch (notFoundErr) {
                // Não existe — cria
                authUser = await authAdmin.createUser({
                    email: user.email,
                    password: DEMO_PASSWORD,
                    displayName: user.displayName,
                    emailVerified: true,
                });
                console.log(`✅ Conta criada: ${user.email} (UID: ${authUser.uid})`);
            }

            // Sincroniza o documento do Firestore usando o UID REAL do Firebase Auth
            // Isso garante que resolveUserProfile() encontre pelo UID diretamente
            const realUid = authUser.uid;

            // Força a reescrita do documento para garantir que todos os campos estão corretos
            await db.collection("usuarios").doc(realUid).set({
                ...user.profileData,
                uid: realUid,
                criadoEm: new Date().toISOString(),
            });
            console.log(`   📄 Documento Firestore atualizado (UID: ${realUid}) — turma: ${user.profileData.turma || "n/a"}`);

            // Remove documento com UID fake se for diferente do real
            if (user.firestoreUid !== realUid) {
                const fakeDoc = await db.collection("usuarios").doc(user.firestoreUid).get();
                if (fakeDoc.exists) {
                    await db.collection("usuarios").doc(user.firestoreUid).delete();
                    console.log(`   🗑️  Documento antigo removido: ${user.firestoreUid}`);
                }
            }

            console.log("");
        } catch (err) {
            console.error(`❌ Falha ao processar ${user.email}:`, err.message);
        }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Concluído! Credenciais dos usuários demo:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    for (const u of DEMO_USERS) {
        console.log(`   📧 ${u.email.padEnd(25)} 🔑 ${DEMO_PASSWORD}`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
}

createDemoUsers().catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
});
