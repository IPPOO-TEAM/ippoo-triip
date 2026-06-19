# Tests IPPOO

Tests unitaires pour la couche service & domaine.

## Lancement

```bash
pnpm add -D vitest @testing-library/react @testing-library/dom jsdom
pnpm vitest
```

Ajoutez à `vite.config.ts` :

```ts
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: ["./src/app/__tests__/setup.ts"],
}
```

Les fichiers `*.test.ts` dans ce dossier seront exécutés.
