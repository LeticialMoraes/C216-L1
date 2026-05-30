# Aula 6 — Frontend Flask + Docker Compose

Prática de frontend com **Flask** (templates Jinja), orquestrada com **Docker Compose** (frontend + backend + PostgreSQL).

## O que tem aqui

- **frontend**: Flask na porta **3000** — rotas `/` (início), `/about` (sobre) e `/contact` (contato).
- **backend**: Flask mínimo na porta **8000** (ex.: `/health`).
- **db**: PostgreSQL 15 com script em `backend/db/init.sql`.


## Como rodar

Na pasta `Aula 6`:

```bash
docker compose up --build
```

No navegador:

- [http://127.0.0.1:3000/](http://127.0.0.1:3000/) — início  
- [http://127.0.0.1:3000/about](http://127.0.0.1:3000/about) — sobre  
- [http://127.0.0.1:3000/contact](http://127.0.0.1:3000/contact) — contato  

Para encerrar: `Ctrl+C` ou `docker compose down`.

A porta **5434** no host mapeia o Postgres e evita conflito com outras instâncias locais (`5432` / `5433`).

---

## Prints da atividade (`img/`)


| Arquivo | O que é |
|---------|---------|
| [`img/logs-frontend.png`](img/logs-frontend.png) | Logs do container **frontend** (`aula6_frontend` — Flask na 3000, requisições `/`, `/about`, `/contact`). |
| [`img/home.png`](img/home.png) | Página **início** (`/`). |
| [`img/contato.png`](img/contato.png) | Página **contato** (`/contact`). |
| [`img/sobre.png`](img/sobre.png) | Página **sobre** (`/about`). |

**Opcional:** [`img/docker-desktop-aula6.png`](img/docker-desktop-aula6.png) — visão do projeto no Docker Desktop com os três serviços 


---
