/**
 * Bootstrap admin — uso ÚNICO para criar o primeiro admin do sistema.
 *
 * Pré-requisito:
 *  1. Já existe sua conta em Firebase Authentication (criada via Console).
 *  2. Você baixou uma chave de service account em Project Settings →
 *     Service accounts → Generate new private key e salvou como
 *     `serviceAccountKey.json` na RAIZ do projeto (gitignored).
 *
 * Uso (de dentro de functions/):
 *
 *   node scripts/bootstrap-admin.mjs <SEU_UID> [role]
 *
 * O role default é "admin". Após rodar, FAÇA LOGOUT e login no app para
 * o token receber a claim atualizada. E APAGUE serviceAccountKey.json.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SA_PATH = resolve(process.env.SERVICE_ACCOUNT_KEY ?? "../serviceAccountKey.json");
const uid = process.argv[2];
const role = process.argv[3] ?? "admin";

if (!uid) {
  console.error("Uso: node scripts/bootstrap-admin.mjs <UID> [role=admin]");
  process.exit(1);
}

const validRoles = [
  "admin",
  "diretor",
  "juiz",
  "supervisor",
  "servidor",
  "estagiario",
  "terceirizado",
];
if (!validRoles.includes(role)) {
  console.error(`Role invalido. Validos: ${validRoles.join(", ")}`);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));
} catch (err) {
  console.error(`Nao encontrei service account em ${SA_PATH}.`);
  console.error("Baixe a chave em https://console.firebase.google.com/ → Project Settings");
  console.error("→ Service accounts → Generate new private key, e salve como");
  console.error("`serviceAccountKey.json` na raiz do projeto.");
  console.error(`\nDetalhe: ${err.message}`);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUser(uid);
} catch (err) {
  console.error(`Nao encontrei usuario com UID ${uid}: ${err.message}`);
  console.error("Confira o UID em Firebase Console → Authentication → Users.");
  process.exit(1);
}

console.log(`Promovendo: ${user.email ?? "(sem email)"} (${uid}) → role=${role}`);

await auth.setCustomUserClaims(uid, { role });
await db.collection("access_list").doc(uid).set(
  {
    uid,
    email: user.email ?? "",
    fullName: user.displayName ?? user.email ?? "",
    role,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    bootstrap: true,
  },
  { merge: true },
);

console.log(`\nOK. ${user.email} agora tem role=${role}.`);
console.log("FACA LOGOUT e LOGIN novamente no app para o token receber a claim.");
console.log("APAGUE serviceAccountKey.json local apos rodar (nao deve ficar no disco).");
process.exit(0);
