/* Cloud sync is OFF until you fill this in and set enabled: true.
 * Setup steps are in docs/LOGIN.md. These values are NOT secrets (Firebase web config is public by design);
 * who can read what is decided by firestore.rules, not by hiding this file.
 */
window.MLTQ_FIREBASE = {
  enabled: false,
  apiKey: 'PASTE_FROM_FIREBASE_CONSOLE',
  authDomain: 'YOUR-PROJECT.firebaseapp.com',
  projectId: 'YOUR-PROJECT',
  appId: 'PASTE_FROM_FIREBASE_CONSOLE',
  /* Only these email domains may sign in. Also enforce the same list in firestore.rules. */
  allowedDomains: ['ds.study.iitm.ac.in']
};
