# Relatório de vulnerabilidades

Análise de segurança da API de gestão de oficina mecânica feita em 31/10/2026. Este relatório registra o que cada ferramenta encontrou. As correções serão aplicadas futuramente.

## Escopo e ferramentas

| Ferramenta                    | Tipo de análise | O que analisa                                                                                  | Onde roda                                   |
| ----------------------------- | --------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| SonarCloud                    | estática        | código TypeScript, `Dockerfile`, workflows do GitHub Actions e seed                            | job `sonarcloud` do workflow `security.yml` |
| OWASP Dependency-Check 13.0.0 | dependências    | todas dependências do `package-lock.json` e do `node_modules`                                  | job `dependency-check` do `security.yml`    |
| `npm audit`                   | dependências    | as dependências pela base de avisos do GitHub                                                  | job `audit` do `ci.yml`                     |
| OWASP ZAP (API scan)          | dinâmica        | a API rodando no `docker-compose`, rota por rota, a partir da definição OpenAPI (`/docs-json`) | job `zap` do `security.yml`                 |

As análises rodam a cada pull request e a cada push na `main`.

## Resumo

| Ferramenta       | Crítico | Alto | Médio                         | Baixo | Informativo               |
| ---------------- | ------- | ---- | ----------------------------- | ----- | ------------------------- |
| SonarCloud       | 0       | 0    | 11 (vulnerabilidades _Major_) | —     | 0 bugs e 49 _code smells_ |
| Dependency-Check | 1       | 1    | 3                             | 3     | —                         |
| ZAP              | —       | 0    | 0                             | 3     | 4                         |

Contagem do Dependency-Check por CVE única (o relatório bruto mostra 13 linhas porque a mesma biblioteca aparece em dois arquivos).

## SonarCloud

Projeto: https://sonarcloud.io/project/overview?id=FIAP-18SOAT-G93_auto-repair-shop-api

Análise da `main` em 31/10/2026, no commit `2d99050`.

| Métrica                                | Resultado      |
| -------------------------------------- | -------------- |
| Quality Gate                           | aprovado       |
| Cobertura (pastas `domain/` e seed)    | 96,8%          |
| Duplicação                             | 0,0%           |
| Nota de manutenibilidade               | A              |
| Nota de revisão de _security hotspots_ | A (0 hotspots) |
| Nota de segurança                      | C              |
| Nota de confiabilidade                 | A              |

A cobertura é medida nas pastas `domain/`. O `prisma/seed.ts` entra na conta porque também é analisado, e não tem testes unitários.

### Vulnerabilidades

| Regra                                  | Onde                         | Quantidade |
| -------------------------------------- | ---------------------------- | ---------- |
| S6505: `npm ci` sem `--ignore-scripts` | `Dockerfile` (linhas 8 e 19) | 2          |
| S6505 e S8543: `npm ci` e `npx` no CI  | `.github/workflows/ci.yml`   | 8          |
| S2068: senha no código                 | `prisma/seed.ts` (linha 21)  | 1          |

### Code smells

| Regra                                                        | Onde                                                    | Quantidade |
| ------------------------------------------------------------ | ------------------------------------------------------- | ---------- |
| S2699: teste sem asserção do Vitest                          | testes e2e em `test/` (só com `.expect()` do Supertest) | 47         |
| S8786: expressão regular com desempenho super-linear (ReDoS) | `customer.ts` (linha 23) e `user.ts` (linha 15)         | 2          |

## OWASP Dependency-Check

Evidência: [`evidencias/dependency-check-vulnerabilidades.json`](evidencias/dependency-check-vulnerabilidades.json) (só as dependências vulneráveis, extraídas do relatório completo).

| Pacote                                                                                | Tipo de dependência | CVE / aviso                                                     | Severidade |
| ------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------- | ---------- |
| DOMPurify 3.4.13, embutido no `swagger-ui-dist` 5.33.0 (usado pelo `@nestjs/swagger`) | produção            | CVE-2026-116804                                                 | crítica    |
|                                                                                       |                     | CVE-2026-116803                                                 | alta       |
|                                                                                       |                     | CVE-2026-109344, CVE-2026-109345 e CVE-2026-116802              | baixa      |
| `@vitest/mocker` 4.1.11                                                               | desenvolvimento     | GHSA-xp26-3454-mjgp (CVSS 5,9) e GHSA-qxg6-89mg-rqv8 (CVSS 4,7) | média      |
| `minimatch` 10.2.6                                                                    | desenvolvimento     | GHSA-g3hv-75wg-m249                                             | média      |

## OWASP ZAP

Evidência: [`evidencias/zap-report.md`](evidencias/zap-report.md) (e a versão [HTML](evidencias/zap-report.html)). O ZAP testou 125 rotas descritas pela definição OpenAPI.

| Alerta                                  | Risco       |
| --------------------------------------- | ----------- |
| `Cross-Origin-Resource-Policy` ausente  | baixo       |
| `X-Powered-By: Express` nas respostas   | baixo       |
| `X-Content-Type-Options` ausente        | baixo       |
| Respostas 4xx                           | informativo |
| Requisição de autenticação identificada | informativo |
| Conteúdo armazenável em cache           | informativo |
| Conteúdo não armazenável em cache       | informativo |

## Conclusão

Nenhuma ferramenta encontrou uma vulnerabilidade explorável no código da API. Os pontos mais relevantes estão em volta dele, na cadeia de build (scripts de instalação no `Dockerfile` e no CI), em uma biblioteca de terceiros usada pela interface do Swagger e na falta de proteções de configuração (cabeçalhos HTTP).
