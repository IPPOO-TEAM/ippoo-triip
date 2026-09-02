#!/usr/bin/env bash
# Pousse le dépôt vers GitHub sans jamais écrire le token sur disque.
#
# Usage :
#   GITHUB_TOKEN=ghp_xxx ./push.sh
# ou :
#   export GITHUB_TOKEN=ghp_xxx && ./push.sh
#
# Le token n'est utilisé que le temps de la commande de push, puis le remote
# reste propre (sans identifiant). Pense à révoquer le token après le push.
set -euo pipefail

REPO="github.com/IPPOO-TEAM/ippoo-triip.git"
BRANCH="${1:-main}"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Erreur : variable GITHUB_TOKEN manquante." >&2
  echo "Exemple : GITHUB_TOKEN=ghp_xxx ./push.sh" >&2
  exit 1
fi

# Initialise le dépôt si besoin.
if [ ! -d .git ]; then
  git init -q
  git branch -M "$BRANCH"
fi

# Remote propre (sans token).
git remote remove origin 2>/dev/null || true
git remote add origin "https://${REPO}"

# Commit s'il y a des changements non commités.
if ! git rev-parse HEAD >/dev/null 2>&1; then
  git add -A
  git commit -q -m "Deploy IPPOO TRIIP"
fi

echo "Push vers $REPO ($BRANCH)…"
git -c credential.helper= push "https://${GITHUB_TOKEN}@${REPO}" "${BRANCH}:${BRANCH}" --force

echo "OK. Pense à révoquer le token GitHub maintenant."
