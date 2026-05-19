export type FirebaseEnv = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  appCheckSiteKey: string | undefined;
  orgId: string;
  useEmulators: boolean;
};

const TEST_DEFAULTS: FirebaseEnv = {
  apiKey: "test",
  authDomain: "test.firebaseapp.com",
  projectId: "test",
  storageBucket: "test.appspot.com",
  messagingSenderId: "0",
  appId: "test",
  appCheckSiteKey: undefined,
  orgId: "test",
  useEmulators: false,
};

export function readFirebaseEnv(): FirebaseEnv {
  const required = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    if (import.meta.env.MODE === "test") {
      return TEST_DEFAULTS;
    }
    throw new Error(
      `Variaveis de ambiente Firebase ausentes: ${missing.join(", ")}. Verifique seu .env.local.`,
    );
  }

  return {
    apiKey: required.apiKey,
    authDomain: required.authDomain,
    projectId: required.projectId,
    storageBucket: required.storageBucket,
    messagingSenderId: required.messagingSenderId,
    appId: required.appId,
    appCheckSiteKey: import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || undefined,
    orgId: import.meta.env.VITE_ORG_ID || "vara_federal_4",
    useEmulators: import.meta.env.VITE_USE_EMULATORS === "true",
  };
}
