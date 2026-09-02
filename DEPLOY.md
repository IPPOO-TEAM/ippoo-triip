# Déploiement IPPOO TRIIP sur Cloudflare Pages

Domaine cible : **https://triip.ippoo-aptdc.com**

## 1. Build

- Build command : `pnpm build` (ou `npm run build`)
- Output directory : `dist`
- Framework preset : **Vite** (ou « None »)
- Node version : 20 ou 22 (variable d'env `NODE_VERSION=22`)

Le lockfile `pnpm-lock.yaml` est présent ; Cloudflare détecte pnpm automatiquement.

## 2. Créer le projet Pages

### Option A — via le dashboard (recommandé)
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Sélectionner le dépôt `IPPOO-TEAM/ippoo-triip`, branche `main`.
3. Build command `pnpm build`, output `dist`.
4. Deploy.

### Option B — via Wrangler (CLI)
```bash
pnpm build
npx wrangler pages deploy dist --project-name=ippoo-triip
```

## 3. Domaine personnalisé
Projet Pages → **Custom domains** → ajouter `triip.ippoo-aptdc.com`.
Le domaine `ippoo-aptdc.com` doit être géré par Cloudflare (ou pointer un CNAME
`triip` vers `<project>.pages.dev`). HTTPS est automatique.

## 4. Pourquoi ce host fait fonctionner les notifications push (FCM)
Contrairement à `*.figma.site` (qui renvoie du HTML pour tous les chemins),
Cloudflare Pages sert les vrais fichiers statiques avec le bon type MIME :
- `sw.js` et `firebase-messaging-sw.js` → `text/javascript`
- `manifest.json` → `application/manifest+json`

Voir `public/_headers` (types MIME + `Service-Worker-Allowed: /`) et
`public/_redirects` (fallback SPA qui **ne** capture **pas** les fichiers
statiques — Cloudflare les sert en priorité).

## 5. Variables / secrets
Aucun secret n'est nécessaire côté frontend (clé Supabase anon et config
Firebase sont publiques). Les secrets serveur restent dans **Supabase Edge
Function** (`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD`,
`FCM_SERVICE_ACCOUNT_JSON`) — ils ne sont **jamais** commités.

## 6. Backend (rappel)
- Redéployer l'edge function : `supabase functions deploy make-server-25867276`
- Exécuter la migration `supabase/migrations/003_realtime_publication.sql`
