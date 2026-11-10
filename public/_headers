# Cloudflare Pages — en-têtes personnalisés.
# Cloudflare déduit déjà le type MIME par extension (.js -> text/javascript),
# ce qui suffit à FCM. On force explicitement + on autorise un scope large pour
# le service worker PWA, et on empêche la mise en cache des SW.

/sw.js
  Content-Type: text/javascript; charset=utf-8
  Service-Worker-Allowed: /
  Cache-Control: no-cache, no-store, must-revalidate

/firebase-messaging-sw.js
  Content-Type: text/javascript; charset=utf-8
  Service-Worker-Allowed: /
  Cache-Control: no-cache, no-store, must-revalidate

/manifest.json
  Content-Type: application/manifest+json; charset=utf-8

/assets/*
  Cache-Control: public, max-age=31536000, immutable
