# fitstock — Gestão de Estoque

> Sistema web para gestão de inventário de artigos fitness: produtos, categorias, fornecedores, movimentações de estoque, dashboard e relatórios.

**Disciplina:** C216 — Sistemas Distribuídos · Inatel

---

## Índice

1. [Funcionalidades](#funcionalidades)
2. [Stack e estrutura](#stack-e-estrutura)
3. [Como executar](#como-executar)
4. [Base de dados](#base-de-dados)
5. [API REST](#api-rest)
6. [Frontend](#frontend)
7. [Testes](#testes)
8. [Boas práticas](#boas-práticas)

---

## Funcionalidades

- **Autenticação** com token Bearer (registro, login, perfis de acesso)
- **Produtos** — cadastro com SKU único, preço, quantidade e tamanhos disponíveis
- **Categorias** — agrupamento e classificação dos produtos
- **Fornecedores** — parceiros comerciais com vínculo N:M aos produtos
- **Movimentações** — registro de entradas e saídas com histórico imutável e atualização de estoque em transação atômica
- **Dashboard** — métricas agregadas em tempo real (total de produtos, alertas de estoque crítico, últimas movimentações)
- **Relatórios** — posição de estoque e movimentações por período, com exportação para CSV

---

## Stack e estrutura

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express 5, TypeScript |
| Base de dados | PostgreSQL 16 |
| Migrations | node-pg-migrate |
| Orquestração | Docker + Docker Compose |
| Testes | Vitest, Supertest |

```
Projeto/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── src/
│   │   ├── routes/       # categorias, fornecedores, produtos, movimentacoes, dashboard, relatorios, auth
│   │   ├── models/       # lógica de acesso ao banco
│   │   ├── middlewares/  # requireAuth
│   │   └── lib/          # authToken (HMAC)
│   ├── db/
│   │   └── migrations/   # versionamento do schema
│   └── tests/            # testes unitários e de integração
└── frontend/
    └── src/
        ├── pages/        # 8 telas (Login, Register, Dashboard, Produtos, ...)
        ├── services/     # chamadas à API REST
        ├── components/   # componentes reutilizáveis
        └── utils/        # helpers (CSV, máscaras, toasts, ...)
```

---

## Como executar

### Docker (recomendado)

**Pré-requisitos:** [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/)

```bash
cd Projeto
cp .env.example .env
docker compose up --build
```

Aguarde até ver a mensagem `Backend running on port 3000` no log. O backend executa as migrations automaticamente ao iniciar.

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Health check | http://localhost:3000/health |

```bash
docker compose down        # parar os containers
docker compose down -v     # parar e apagar o volume do banco
```

### Desenvolvimento local

```bash
# 1. Sobe apenas o banco de dados
cd Projeto
docker compose up db -d

# 2. Backend (novo terminal)
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev

# 3. Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

### Primeiro acesso

1. Acesse http://localhost:5173/register e crie uma conta.
2. Faça login — você será redirecionado ao dashboard.
3. **Ordem recomendada de cadastro:** Categorias → Fornecedores → Produtos → Movimentações.

> Todas as rotas de negócio exigem o header `Authorization: Bearer <token>`, gerado automaticamente pelo frontend após o login.

### Variáveis de ambiente

**`Projeto/.env`** — usado pelo Docker Compose

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `POSTGRES_USER` | Usuário do PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `postgres` |
| `POSTGRES_DB` | Nome do banco | `fitstock` |
| `POSTGRES_PORT` | Porta exposta do banco | `5432` |
| `BACKEND_PORT` | Porta da API | `3000` |
| `FRONTEND_PORT` | Porta do frontend | `5173` |
| `FRONTEND_ORIGIN` | Origem permitida pelo CORS | `http://localhost:5173` |
| `VITE_API_URL` | URL da API (injetada no build do Vite) | `http://localhost:3000` |

**`backend/.env`** — usado no desenvolvimento local

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `AUTH_SECRET` | Segredo para assinatura dos tokens HMAC |
| `PORT` | Porta da API |
| `FRONTEND_ORIGIN` | Origem permitida pelo CORS |

---

## Base de dados

### Tabelas

O banco possui 6 tabelas: `users`, `categorias`, `fornecedores`, `produtos`, `produto_fornecedor` e `movimentacoes`.

### Relacionamentos

#### N para 1

| Tabelas | Chave estrangeira | Referência |
|---------|-------------------|------------|
| `produtos` → `categorias` | `produtos.categoria_id` | `categorias.id` |
| `movimentacoes` → `produtos` | `movimentacoes.produto_id` | `produtos.id` |
| `movimentacoes` → `users` | `movimentacoes.usuario_id` | `users.id` |

#### N para M

`produtos` ↔ `fornecedores`, materializado na tabela associativa **`produto_fornecedor`**:

| Tabela associativa | Chave estrangeira | Referência |
|--------------------|-------------------|------------|
| `produto_fornecedor` | `produto_id` | `produtos.id` |
| `produto_fornecedor` | `fornecedor_id` | `fornecedores.id` |

Restrição `UNIQUE (produto_id, fornecedor_id)` impede vínculos duplicados.

### Tabelas

#### `users` — Usuários da aplicação

| Coluna | Tipo | Restrições |
|--------|------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `first_name` | `varchar(120)` | NOT NULL |
| `last_name` | `varchar(120)` | NOT NULL |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password_hash` | `text` | NOT NULL (bcrypt) |
| `access_profile` | `varchar(32)` | NOT NULL — `administrador`, `operador` ou `visualizador` |
| `created_at` | `timestamptz` | NOT NULL, default `current_timestamp` |

#### `categorias` — Agrupamento dos produtos

| Coluna | Tipo | Restrições |
|--------|------|------------|
| `id` | `serial` | PK |
| `nome` | `varchar(100)` | NOT NULL, UNIQUE |
| `descricao` | `text` | opcional |
| `created_at` | `timestamp` | default `NOW()` |

#### `fornecedores` — Parceiros comerciais

| Coluna | Tipo | Restrições |
|--------|------|------------|
| `id` | `serial` | PK |
| `nome` | `varchar(150)` | NOT NULL |
| `email` | `varchar(150)` | opcional |
| `telefone` | `varchar(20)` | opcional |
| `ativo` | `boolean` | default `true` |
| `created_at` | `timestamp` | default `NOW()` |

#### `produtos` — Artigos em estoque

| Coluna | Tipo | Restrições |
|--------|------|------------|
| `id` | `serial` | PK |
| `nome` | `varchar(150)` | NOT NULL |
| `sku` | `varchar(30)` | NOT NULL, UNIQUE |
| `descricao` | `text` | opcional |
| `preco` | `numeric(10,2)` | NOT NULL |
| `quantidade` | `integer` | NOT NULL, default `0` |
| `quantidade_minima` | `integer` | NOT NULL, default `10` |
| `tamanhos` | `varchar(50)` | opcional |
| `categoria_id` | `integer` | NOT NULL, FK → `categorias.id`, ON DELETE RESTRICT |
| `created_at` | `timestamp` | default `NOW()` |

#### `produto_fornecedor` — Tabela associativa produto–fornecedor

| Coluna | Tipo | Restrições |
|--------|------|------------|
| `id` | `serial` | PK |
| `produto_id` | `integer` | NOT NULL, FK → `produtos.id`, ON DELETE CASCADE |
| `fornecedor_id` | `integer` | NOT NULL, FK → `fornecedores.id`, ON DELETE CASCADE |
| `preco_custo` | `numeric(10,2)` | opcional |
| `prazo_entrega_dias` | `integer` | opcional |
| — | — | UNIQUE (`produto_id`, `fornecedor_id`) |

#### `movimentacoes` — Histórico imutável de entradas e saídas

| Coluna | Tipo | Restrições |
|--------|------|------------|
| `id` | `serial` | PK |
| `produto_id` | `integer` | NOT NULL, FK → `produtos.id`, ON DELETE RESTRICT |
| `usuario_id` | `uuid` | NOT NULL, FK → `users.id`, ON DELETE RESTRICT |
| `tipo` | `varchar(10)` | NOT NULL, CHECK `IN ('entrada', 'saida')` |
| `quantidade` | `integer` | NOT NULL, CHECK `> 0` |
| `observacao` | `text` | opcional |
| `created_at` | `timestamp` | default `NOW()` |

> Ao registrar uma movimentação, a API atualiza `produtos.quantidade` na **mesma transação** (`BEGIN` → `SELECT … FOR UPDATE` → `INSERT` → `UPDATE` → `COMMIT`), garantindo consistência mesmo sob concorrência.

---

## API REST

A API expõe **25 endpoints** no total. Todas as rotas de negócio exigem o header `Authorization: Bearer <token>`.

### Autenticação — rotas públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Health check da API |
| `POST` | `/auth/register` | Cadastro de novo usuário |
| `POST` | `/auth/login` | Login — retorna token Bearer |

### CRUD completo (GET · POST · PUT · DELETE)

| Recurso | Listar | Por ID | Criar | Atualizar | Remover |
|---------|--------|--------|-------|-----------|---------|
| Categorias | `GET /categorias` | `GET /categorias/:id` | `POST /categorias` | `PUT /categorias/:id` | `DELETE /categorias/:id` |
| Fornecedores | `GET /fornecedores` | `GET /fornecedores/:id` | `POST /fornecedores` | `PUT /fornecedores/:id` | `DELETE /fornecedores/:id` |
| Produtos | `GET /produtos` | `GET /produtos/:id` | `POST /produtos` | `PUT /produtos/:id` | `DELETE /produtos/:id` |

**Vínculo N:M — produtos e fornecedores:**

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/produtos/:id/fornecedores` | Vincular fornecedor a um produto |
| `DELETE` | `/produtos/:id/fornecedores/:fornecedorId` | Desvincular fornecedor de um produto |

### Outros endpoints

| Recurso | Método | Rota | Descrição |
|---------|--------|------|-----------|
| Movimentações | `GET` | `/movimentacoes` | Listar — filtros: `tipo`, `produto_id`, `data_inicio`, `data_fim` |
| Movimentações | `GET` | `/movimentacoes/:id` | Detalhe de uma movimentação |
| Movimentações | `POST` | `/movimentacoes` | Registrar entrada ou saída |
| Dashboard | `GET` | `/dashboard` | Métricas agregadas do estoque |
| Relatórios | `GET` | `/relatorios/estoque` | Posição atual do estoque |
| Relatórios | `GET` | `/relatorios/movimentacoes` | Movimentações por período |

> Movimentações **não** possuem `PUT` nem `DELETE` — o histórico é imutável por design. O `usuario_id` é extraído do token, nunca do corpo da requisição.

---

## Frontend

O frontend possui **8 telas** acessíveis via React Router:

| Rota | Tela | Descrição |
|------|------|-----------|
| `/login` | Login | Autenticação do usuário |
| `/register` | Cadastro | Criação de nova conta |
| `/dashboard` | Dashboard | Métricas, alertas de estoque crítico e últimas movimentações |
| `/products` | Produtos | Listagem, cadastro, edição, exclusão e vínculos com fornecedores |
| `/categories` | Categorias | Gerenciamento de categorias |
| `/suppliers` | Fornecedores | Gerenciamento de fornecedores |
| `/movements` | Movimentações | Histórico e registro de entradas/saídas |
| `/reports` | Relatórios | Relatórios por período com exportação para CSV |

---

## Testes

Os testes do backend rodam sem banco de dados real — o `pool` de conexões é mockado via Vitest.

**Via Docker (recomendado):**

```bash
docker compose --profile test run test
```

**Local:**

```bash
cd backend
npm test              # execução única
npm run test:watch    # modo interativo (watch)
```

**Cobertura:**

| Arquivo de teste | O que testa |
|------------------|-------------|
| `authToken.test.ts` | Geração e validação de tokens HMAC |
| `produto.model.test.ts` | Regras de negócio do modelo de produtos |
| `movimentacao.model.test.ts` | Lógica de entrada/saída e atualização de estoque |
| `api.test.ts` | Rotas HTTP: `/health`, autenticação, categorias, dashboard |

---

## Boas práticas

- **Separação em camadas:** rotas → models → PostgreSQL, sem lógica de negócio nos controllers
- **Schema versionado** com migrations via `node-pg-migrate` — o banco evolui de forma controlada e rastreável
- **Autenticação stateless** com token HMAC Bearer — sem sessões no servidor
- **Transações atômicas** com `SELECT … FOR UPDATE` no registro de movimentações, evitando race conditions em estoque
- **Queries paralelas** no dashboard e relatórios via `Promise.all`, reduzindo latência de resposta
- **`createApp` exportável** permite testes de integração HTTP sem subir o servidor real
- **Variáveis de ambiente** com valores padrão seguros no Compose — o projeto funciona com um único `cp .env.example .env`

---

## Autoria

Projeto desenvolvido para a disciplina **C216 — Sistemas Distribuídos**, Instituto Nacional de Telecomunicações (Inatel).