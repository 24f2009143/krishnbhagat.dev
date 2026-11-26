/* Firebase web config (public by design; access is decided by firestore.rules at the repo root, collection mad1/{uid}).
 * enabled: true adds optional Google sign-in sync (any verified Google account; the site works without it).
 * required: true would hide the site behind a sign-in wall (that wall also blocks offline use); keep it false.
 * Setup steps: docs/FIREBASE-SETUP.md */
window.APP_FIREBASE = {
  enabled: true,
  required: false,
  apiKey: 'AIzaSyAuSN_OdlJhxu2vV1qCPINQ3k1IUqapEAY',
  authDomain: 'nerdhub-e95d0.firebaseapp.com',
  projectId: 'nerdhub-e95d0',
  appId: '1:310533239838:web:4a4ae816d17aa774736a0f',
  collection: 'mad1',
  allowedDomains: []
};
