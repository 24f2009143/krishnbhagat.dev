/* Firebase web config is public by design; who can read or write is decided by firestore.rules
 * (repo root), not by hiding this file. Setup steps: docs/FIREBASE-SETUP.md
 */
window.MLTQ_FIREBASE = {
  enabled: true,
  /* true = the whole site is hidden behind a sign-in screen until an IITM account signs in */
  required: true,
  apiKey: 'AIzaSyAuSN_OdlJhxu2vV1qCPINQ3k1IUqapEAY',
  authDomain: 'nerdhub-e95d0.firebaseapp.com',
  projectId: 'nerdhub-e95d0',
  appId: '1:310533239838:web:4a4ae816d17aa774736a0f',
  /* Only these email domains may sign in. firestore.rules enforces the same list on the server. */
  allowedDomains: ['ds.study.iitm.ac.in']
};
