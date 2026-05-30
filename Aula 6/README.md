# Aula 6 — Frontend Flask + Docker Compose

Frontend em **Flask** (templates Jinja), com **layout** em sidebar (`base.html`, `styles.css`) e integração **Docker Compose** entre frontend, **FastAPI** no backend e **PostgreSQL**. Há as páginas da prática (início, sobre, contato) e o fluxo de **gestão de professores** (cadastro, listagem, edição, exclusão e reset do banco), com o frontend chamando a API via `requests`.

## Estrutura do frontend (`frontend/`)

| Arquivo | Função |
|---------|--------|
| `app.py` | Rotas + `context_processor` (nome e matrícula em todas as páginas) + `requests` à `API_URL`. |
| `templates/base.html` | Layout lateral + menu (Início, Sobre, Contato, Professores, Cadastro, Reset DB). |
| `static/styles.css` | Tema pastel original. |
| `templates/_messages.html` | Mensagens `flash` com classes do seu CSS (`.flash-success`, etc.). |
| `templates/home.html`, `about.html`, `contact.html` | Páginas da entrega (`extends base.html`). |
| `templates/cadastro.html`, `editar.html`, `professores.html` | CRUD (`extends base.html`, mesmo layout). |
| `templates/navbar.html` | Menu em estilo Bootstrap para páginas HTML completas que não usam `base.html`. |

## Backend e banco

- **FastAPI** em `backend/main.py` — rotas `/api/v1/professores/...`.
- **PostgreSQL** — `backend/db/init.sql` (tabela `professores` com `nome`, `email`, `sala_de_atendimento`).

## Como rodar

```bash
cd "Aula 6"
docker compose up --build
```

| URL | Página |
|-----|--------|
| http://127.0.0.1:3000/ | Home |
| http://127.0.0.1:3000/about | Sobre |
| http://127.0.0.1:3000/contact | Contato |
| http://127.0.0.1:3000/cadastro | Cadastro |
| http://127.0.0.1:3000/professores | Lista |
| http://127.0.0.1:8000/docs | Documentação da API (opcional) |

Variável **`API_URL`** no `docker-compose` aponta o frontend para o backend na rede Docker.

Se mudar o `init.sql` e o banco já existir, recrie o volume:

```bash
docker compose down -v
docker compose up --build
```

Postgres no host: **5434** → 5432 no container.

---

## Prints (`img/`)

Atualize os prints se a interface mudou: home (`/`), contato (`/contact`), sobre (`/about`), logs do container `aula6_frontend`.

`docker logs aula6_frontend`
