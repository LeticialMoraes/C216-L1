# Base de dados (PostgreSQL)

- **`pool.ts`** — conexão partilhada (`pg.Pool`) usada pela API.
- **`migrations/`** — ficheiros de migration consumidos pelo `node-pg-migrate` (`npm run migrate`).

Configure `DATABASE_URL` (ou `PG*`) no `.env` na raiz do backend.

## Migrations em CommonJS

Este backend **não** usa `"type": "module"`. Os ficheiros em `migrations/` devem usar **`exports.up` / `exports.down`** (CommonJS), para o Node não mostrar o aviso *Module type is not specified*.

O comando `npm run migrate:create` gera por omissão ficheiros com `export` (ESM). Depois de criar, converte para `exports.` ou renomeia para `.cjs` e ajusta o conteúdo.
