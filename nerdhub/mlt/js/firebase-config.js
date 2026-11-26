/* Firebase web config is public by design; who can read or write is decided by firestore.rules
 * (repo root), not by hiding this file. Setup steps: docs/FIREBASE-SETUP.md
 */
window.MLTQ_FIREBASE = {
  enabled: true,
  /* false = anyone can use the site without signing in; sign-in only turns on sync */
  required: false,
  apiKey: 'AIzaSyAuSN_OdlJhxu2vV1qCPINQ3k1IUqapEAY',
  authDomain: 'nerdhub-e95d0.firebaseapp.com',
  projectId: 'nerdhub-e95d0',
  appId: '1:310533239838:web:4a4ae816d17aa774736a0f',
  /* Empty = any verified Google account may sign in to sync. firestore.rules allows the same. */
  allowedDomains: []
};
