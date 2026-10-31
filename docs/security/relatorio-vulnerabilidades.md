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

| Ferramenta       | Crítico | Alto | Médio                         | Baixo | Informativo              |
| ---------------- | ------- | ---- | ----------------------------- | ----- | ------------------------ |
| SonarCloud       | 0       | 0    | 13 (vulnerabilidades _Major_) | —     | 2 bugs e 2 _code smells_ |
| Dependency-Check | 1       | 1    | 3                             | 3     | —                        |
| ZAP              | —       | 0    | 0                             | 3     | 4                        |

Contagem do Dependency-Check por CVE única (o relatório bruto mostra 13 linhas porque a mesma biblioteca aparece em dois arquivos).

## SonarCloud

Projeto: https://sonarcloud.io/project/overview?id=FIAP-18SOAT-G93_auto-repair-shop-api

| Métrica                                | Resultado      |
| -------------------------------------- | -------------- |
| Quality Gate do PR #19                 | aprovado       |
| Cobertura (pastas `domain/`)           | 100%           |
| Duplicação                             | 0,7%           |
| Nota de manutenibilidade               | A              |
| Nota de revisão de _security hotspots_ | A (0 hotspots) |
| Nota de segurança                      | C              |
| Nota de confiabilidade                 | D              |

A cobertura é medida só nas pastas `domain/`.

### Achados

| Regra                                                        | Onde                                                           | Quantidade |
| ------------------------------------------------------------ | -------------------------------------------------------------- | ---------- |
| S6505: `npm ci` sem `--ignore-scripts`                       | `Dockerfile` (linhas 8 e 19)                                   | 2          |
| S6505 e S8543: `npm ci` e `npx` no CI                        | `.github/workflows/ci.yml`                                     | 8          |
| S2068: senha no código                                       | `prisma/seed.ts` (linha 21)                                    | 1          |
| S2068: senha no código                                       | `test/auth.e2e-spec.ts` e `test/customer-tracking.e2e-spec.ts` | 2          |
| S2871: `.sort()` sem função de comparação                    | `test/customer-tracking.e2e-spec.ts` (linha 176)               | 2          |
| S8786: expressão regular com desempenho super-linear (ReDoS) | `customer.ts` (linha 23) e `user.ts` (linha 15)                | 2          |

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

| Alerta                                          | Risco       |
| ----------------------------------------------- | ----------- |
| `X-Powered-By: Express` nas respostas           | baixo       |
| `X-Content-Type-Options` ausente                | baixo       |
| `Cross-Origin-Resource-Policy` ausente          | baixo       |
| Respostas 4xx                                   | informativo |
| Requisição de autenticação identificada         | informativo |
| Conteúdo armazenável e não armazenável em cache | informativo |

O ZAP também tentou rotas de metadados de nuvem (`/latest/meta-data/`, `/computeMetadata/v1/`), usadas em ataques de SSRF. Todas responderam 404.

## Conclusão

Nenhuma ferramenta encontrou uma vulnerabilidade explorável no código da API. Os pontos mais relevantes estão em volta dele, na cadeia de build (scripts de instalação no `Dockerfile` e no CI), em uma biblioteca de terceiros usada pela interface do Swagger e na falta de proteções de configuração (cabeçalhos HTTP).
