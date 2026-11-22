# Firebase setup (one project for both sites)

1. console.firebase.google.com → Add project → name it `krishnbhagat-dev` (Analytics off).
2. Build → Authentication → Get started → Sign-in method → Google → enable → save.
3. Authentication → Settings → Authorized domains → add `krishnbhagat.dev` (and `www.krishnbhagat.dev`).
4. Build → Firestore Database → Create database → production mode → region `asia-south1` (Mumbai).
5. Firestore → Rules → paste the contents of `firestore.rules` → Publish.
6. Project settings → Your apps → Web (</>) → register `nerdhub` → copy the `firebaseConfig` values
   into `nerdhub/mlt/js/firebase-config.js` AND `nerdhub/pdsa-quiz-2/js/firebase-config.js`,
   set `enabled: true` in both.
7. `git add -A && git commit -m "enable sync" && git push`

Data lives in Firestore: collection `users` (MLT) and `pdsa` (PDSA), one document per student.
Only that student and the owner (see `owner()` in firestore.rules) can read it.
