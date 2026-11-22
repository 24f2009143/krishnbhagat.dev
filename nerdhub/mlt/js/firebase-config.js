/* Cloud sync is OFF until you paste your Firebase web config here and set enabled: true.
 * Firebase web config is public by design; who can read or write is decided by firestore.rules
 * (repo root), not by hiding this file. Setup steps: docs/FIREBASE-SETUP.md
 */
window.MLTQ_FIREBASE = {
  enabled: false,
  apiKey: 'PASTE_FROM_FIREBASE_CONSOLE',
  authDomain: 'YOUR-PROJECT.firebaseapp.com',
  projectId: 'YOUR-PROJECT',
  appId: 'PASTE_FROM_FIREBASE_CONSOLE',
  /* Only these email domains may sign in. firestore.rules enforces the same list on the server. */
  allowedDomains: ['ds.study.iitm.ac.in']
};
