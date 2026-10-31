# auto-repair-shop-api

[![CI](https://github.com/FIAP-18SOAT-G93/auto-repair-shop-api/actions/workflows/ci.yml/badge.svg)](https://github.com/FIAP-18SOAT-G93/auto-repair-shop-api/actions/workflows/ci.yml)

Back-end (MVP) de gestão de oficina mecânica — Tech Challenge da Fase 1 da pós-graduação FIAP SOAT.

## Objetivo

Gerenciar o atendimento de uma oficina: cadastro de clientes e veículos, ordens de serviço
(do diagnóstico à entrega), orçamento com aprovação do cliente, catálogo de serviços e
controle de estoque de peças e insumos.

## Modelagem do domínio (DDD)

- Board do Miro (Event Storming, agregados, contextos delimitados, C4): https://miro.com/app/board/uXjVHgZ7nnk=/
- [Event Storming](docs/ddd/event-storming.pdf)
- [Domínio e subdomínios](docs/ddd/dominio-e-subdominios.pdf)
- [Entidades e objetos de valor](docs/ddd/entidades-e-objetos-de-valor.pdf)
- [C4 — níveis 1 a 3](docs/ddd/c4.pdf)
- [Linguagem ubíqua](docs/ddd/linguagem-ubiqua.md)

## Como rodar com Docker

Pré-requisito: [Docker](https://www.docker.com/get-started/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados.

1. Crie o arquivo `.env` a partir do modelo `.env.example`:

   ```bash
   cp .env.example .env              # Linux/macOS
   Copy-Item .env.example .env       # Windows (PowerShell)
   ```

   Troque o `JWT_SECRET` por um valor aleatório de pelo menos 32 caracteres e se quiser o `DB_PASSWORD`. O comando para gerar um segredo está no próprio `.env.example`.

2. Confira se as portas `5432` (PostgreSQL) e `3000` (API) estão livres.

3. Suba tudo:

   ```bash
   docker compose up --build
   ```

   O Compose sobe três serviços, nesta ordem:

   | Serviço    | O que faz                                                         |
   | ---------- | ----------------------------------------------------------------- |
   | `postgres` | banco PostgreSQL 18, com os dados em um volume                    |
   | `migrate`  | aplica as migrations e carrega os dados de demonstração e termina |
   | `api`      | a API, depois que o `migrate` termina com sucesso                 |

4. Acesse:
   - Aplicação disponível em: http://localhost:3000
   - Documentação da API (Swagger): http://localhost:3000/docs

5. O banco de dados PostgreSQL estará acessível em:
   - localhost:5432

### Usuários de demonstração

Todos com a senha `Oficina@123`:

| Função    | E-mail                  |
| --------- | ----------------------- |
| Atendente | `atendente@oficina.com` |
| Mecânico  | `mecanico@oficina.com`  |
| Gestor    | `gestor@oficina.com`    |

No Swagger, use `POST /auth/login` e cole o `accessToken` no botão **Authorize**.

### Parar

```bash
docker compose down       # remove os contêineres e mantém os dados
docker compose down -v    # remove também o volume com os dados do banco
```

### Desenvolvimento local com o banco do Docker

Para rodar a API fora do contêiner, em modo watch, suba só o banco:

```bash
docker compose up -d postgres
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

## Licença

MIT
