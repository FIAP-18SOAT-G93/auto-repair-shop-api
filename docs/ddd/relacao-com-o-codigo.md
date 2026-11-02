# Relação entre a modelagem e o código

Este documento liga cada elemento do [board no Miro](https://miro.com/app/board/uXjVHgZ7nnk=/) ao código que o implementa. Os termos e as definições estão na [linguagem ubíqua](linguagem-ubiqua.md).

## Contextos delimitados e módulos

| Contexto delimitado | Subdomínio | Módulo                       |
| ------------------- | ---------- | ---------------------------- |
| Atendimento         | core       | `src/modules/service-order/` |
| Cadastro            | suporte    | `src/modules/customer/`      |
| Catálogo e Estoque  | suporte    | `src/modules/catalog/`       |
| Identidade e Acesso | genérico   | `src/modules/auth/`          |

Os contextos se integram por portas. O Atendimento usa `CustomerDirectory`, `ServiceCatalog` e `PartStock` (`service-order/application/ports/`). O Cadastro usa `ServiceOrderChecker` para bloquear a remoção com OS aberta. A Identidade e Acesso usa `CustomerAccessVerifier` para autenticar o cliente. Cada porta tem um adaptador na `infrastructure` do módulo que a usa, e esse adaptador chama os casos de uso do outro módulo.

## Agregados, entidades e objetos de valor

| Board                  | Código                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Ordem de Serviço       | agregado `ServiceOrder`, com as entidades `ServiceItem`, `PartItem`, `Quote` e `StatusHistory` (`service-order/domain/`) |
| Objetos de valor da OS | `ServiceOrderStatus`, `TrackingCode`, `Money` e `Quantity` (`shared/domain/`)                                            |
| Cliente e Veículo      | agregados `Customer` e `Vehicle`, com os objetos de valor `Document` e `LicensePlate` (`customer/domain/`)               |
| Serviço e Peça/Insumo  | agregados `Service` e `Part`, com `PartType` (`PART` ou `SUPPLY`) (`catalog/domain/`)                                    |
| Usuário da equipe      | agregado `User` e as funções em `Role` (`auth/domain/`)                                                                  |

## Comandos

As rotas da equipe também aceitam o gestor (`MANAGER`).

| Comando no board                 | Ator      | Caso de uso                       | Rota                                                                                                      |
| -------------------------------- | --------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Identificar Cliente por CPF/CNPJ | Atendente | `FindCustomerByDocumentUseCase`   | `GET /customers/search?document=`                                                                         |
| Cadastrar Cliente                | Atendente | `CreateCustomerUseCase`           | `POST /customers`                                                                                         |
| Identificar Veículo pela Placa   | Atendente | `FindVehicleByPlateUseCase`       | `GET /vehicles/search?plate=`                                                                             |
| Cadastrar Veículo                | Atendente | `CreateVehicleUseCase`            | `POST /vehicles`                                                                                          |
| Abrir Ordem de Serviço           | Atendente | `OpenServiceOrderUseCase`         | `POST /service-orders`                                                                                    |
| Iniciar Diagnóstico              | Mecânico  | `StartDiagnosisUseCase`           | `POST /service-orders/:id/start-diagnosis`                                                                |
| Adicionar Serviço                | Mecânico  | `AddServiceToOrderUseCase`        | `POST /service-orders/:id/services`                                                                       |
| Adicionar Peça/Insumo            | Mecânico  | `AddPartToOrderUseCase`           | `POST /service-orders/:id/parts`                                                                          |
| Concluir Diagnóstico             | Mecânico  | `ConcludeDiagnosisUseCase`        | `POST /service-orders/:id/conclude-diagnosis`                                                             |
| Autenticar Cliente               | Cliente   | `AuthenticateCustomerUseCase`     | `POST /auth/customer`                                                                                     |
| Aprovar Orçamento                | Cliente   | `ApproveQuoteUseCase`             | `POST /customer/service-orders/:id/approve-quote` (ou `/service-orders/:id/approve-quote` pelo atendente) |
| Rejeitar Orçamento               | Cliente   | `RejectQuoteUseCase`              | `POST /customer/service-orders/:id/reject-quote` (ou `/service-orders/:id/reject-quote` pelo atendente)   |
| Registrar Reparo Adicional       | Mecânico  | `RegisterAdditionalRepairUseCase` | `POST /service-orders/:id/additional-repair`                                                              |
| Finalizar Ordem de Serviço       | Mecânico  | `FinishServiceOrderUseCase`       | `POST /service-orders/:id/finish`                                                                         |
| Registrar Entrega                | Atendente | `DeliverServiceOrderUseCase`      | `POST /service-orders/:id/deliver`                                                                        |
| Cadastrar Serviço                | Gestor    | `CreateServiceUseCase`            | `POST /services`                                                                                          |
| Atualizar Serviço                | Gestor    | `UpdateServiceUseCase`            | `PUT /services/:id`                                                                                       |
| Cadastrar Peça/Insumo            | Gestor    | `CreatePartUseCase`               | `POST /parts`                                                                                             |
| Atualizar Peça/Insumo            | Gestor    | `UpdatePartUseCase`               | `PUT /parts/:id`                                                                                          |
| Registrar Entrada de Estoque     | Gestor    | `RegisterStockEntryUseCase`       | `POST /parts/:id/stock-entry`                                                                             |

Alguns comandos do board são disparados por uma política, e não por um ator.

| Comando no board            | Onde acontece                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Gerar Orçamento             | `ServiceOrder.concludeDiagnosis()` e `ServiceOrder.registerAdditionalRepair()`, com o `QuoteCalculator` |
| Enviar Orçamento ao Cliente | `ServiceOrderNotifier`, ao receber `QuoteGenerated`, chama o `NotificationGateway`                      |
| Iniciar Execução            | `ServiceOrder.approve()` muda o status para `IN_EXECUTION`                                              |
| Realizar Baixa do Estoque   | `DeductStockUseCase`, chamado pelo `AddPartToOrderUseCase` pela porta `PartStock`, na mesma transação   |
| Realizar Estorno do Estoque | `ReverseStockUseCase`, chamado pelo `RejectQuoteUseCase` para cada peça do evento `QuoteRejected`       |
| Registrar Tempo de Execução | É calculado a partir do `StatusHistory` (`ServiceOrder.getExecutionTime()`)                             |
| Notificar Cliente           | `ServiceOrderNotifier` e `NotificationGateway` (`LoggerNotificationGateway`)                            |

## Eventos

Os eventos que outras partes do sistema precisam observar viram eventos de domínio (`service-order/domain/service-order.events.ts`). Os demais aparecem como mudança de status no `StatusHistory`, como o resultado do caso de uso ou como um erro de domínio.

| Evento no board                                            | No código                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Ordem de Serviço Aberta                                    | evento `ServiceOrderOpened`, status `RECEIVED`                  |
| Diagnóstico Iniciado                                       | status `IN_DIAGNOSIS`                                           |
| Serviço Adicionado à OS / Peça Adicionada à OS             | `ServiceItem` / `PartItem` na versão pendente do orçamento      |
| Estoque Baixado                                            | `Part.deduct()`                                                 |
| Peça Indisponível em Estoque                               | erro `PartOutOfStockError` (409)                                |
| Entrada de Estoque Registrada                              | `Part.restock()`                                                |
| Diagnóstico Concluído / Orçamento Gerado                   | evento `QuoteGenerated`, status `AWAITING_APPROVAL`             |
| Orçamento Enviado ao Cliente / Cliente Notificado          | chamada ao `NotificationGateway`                                |
| Cliente Autenticado / Cliente Não Autenticado              | token `CUSTOMER` / erro `InvalidCustomerCredentialsError` (401) |
| Orçamento Aprovado / Execução Iniciada                     | evento `QuoteApproved`, status `IN_EXECUTION`                   |
| Orçamento Rejeitado / Baixa Estornada                      | evento `QuoteRejected`, `Part.reverse()`                        |
| Reparo Adicional Identificado                              | nova versão do orçamento, evento `QuoteGenerated`               |
| Ordem de Serviço Finalizada / Tempo de Execução Registrado | evento `ServiceOrderFinished`, status `FINISHED`                |
| Veículo Entregue                                           | evento `ServiceOrderDelivered`, status `DELIVERED`              |
| Cliente/Veículo Identificado ou Não Identificado           | resposta 200 ou 404 da busca por documento ou placa             |
| Cliente/Veículo Cadastrado                                 | resposta 201 do cadastro                                        |
| Serviço/Peça ou Insumo Cadastrado(a)                       | resposta 201 de `POST /services` ou `POST /parts`               |
| Serviço/Peça ou Insumo Atualizado(a)                       | resposta 200 de `PUT /services/:id` ou `PUT /parts/:id`         |

## Políticas

| Política no board                                                                  | Onde está                                                                         |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Diminuir a quantidade no estoque da peça adicionada                                | `AddPartToOrderUseCase`, dentro do `UnitOfWork`: sem saldo, nada é gravado        |
| Gerar orçamento automaticamente                                                    | `ServiceOrder.concludeDiagnosis()`                                                |
| Enviar orçamento ao cliente / Notificar cliente pelo serviço de notificação        | `ServiceOrderNotifier`; uma falha na notificação é registrada e não altera a OS   |
| Mudar a OS para o status Em execução                                               | `ServiceOrder.approve()`                                                          |
| Estornar no estoque as peças do orçamento rejeitado                                | `RejectQuoteUseCase`, a partir do `QuoteRejected`, na mesma transação da rejeição |
| Orçamento inicial: finalizar OS sem execução. Reparo adicional: retomar a execução | `ServiceOrder.reject()`                                                           |
| Gerar nova versão do orçamento só com os itens adicionais                          | `ServiceOrder.registerAdditionalRepair()`                                         |
| Registrar tempo de execução                                                        | `StatusHistory` e `AverageExecutionTimeQuery`                                     |
| Sinalizar reposição ao gestor                                                      | `Part.isOutOfStock` e `GET /parts/unavailable`                                    |

## Modelos de leitura

| Modelo de leitura no board                     | Rota                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Lista de clientes / Lista de veículos          | `GET /customers`, `GET /vehicles`                                   |
| Lista de serviços / Lista de peças/insumos     | `GET /services`, `GET /parts`                                       |
| Lista de OS que estão abertas                  | `GET /service-orders?status=`, com filtro por cliente e período     |
| OS finalizadas aguardando retirada             | `GET /service-orders?status=FINISHED`                               |
| Consulta da OS: status, histórico e orçamentos | `GET /service-orders/:id`                                           |
| Aplicativo mobile                              | `GET /customer/service-orders` e `GET /customer/service-orders/:id` |
| Lista de peças indisponíveis                   | `GET /parts/unavailable`                                            |
| Tempo médio de execução                        | `GET /metrics/average-execution-time`                               |

## Pontos de atenção

| Ponto                         | Onde é garantido                                                                                               | Testes                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| PA1 CPF/CNPJ e placa          | `Document` e `LicensePlate`                                                                                    | `document.spec.ts`, `license-plate.spec.ts`                               |
| PA2 uma OS aberta por veículo | `OpenServiceOrderUseCase` e o índice único parcial em `service_orders (vehicle_id) WHERE delivered_at IS NULL` | `service-orders.e2e-spec.ts`                                              |
| PA3 baixa no diagnóstico      | `AddPartToOrderUseCase` e `Part.deduct()`                                                                      | `part.spec.ts`, `service-orders.e2e-spec.ts`                              |
| PA4 peça sem saldo            | `PartOutOfStockError` e o `UPDATE ... WHERE quantity >= n`                                                     | `prisma-part.repository.e2e-spec.ts`                                      |
| PA5 reposição pelo gestor     | `GET /parts/unavailable` e `RegisterStockEntryUseCase`                                                         | `parts.e2e-spec.ts`                                                       |
| PA6 orçamento no aplicativo   | `CustomerServiceOrdersController`                                                                              | `customer-tracking.e2e-spec.ts`                                           |
| PA7 autenticação do cliente   | `AuthenticateCustomerUseCase` e `VerifyCustomerAccessUseCase`, com `TrackingCode`                              | `authenticate-customer.use-case.spec.ts`, `customer-tracking.e2e-spec.ts` |
| PA8 rejeição                  | `ServiceOrder.reject()` e `RejectQuoteUseCase`                                                                 | `service-order.spec.ts`, `service-orders.e2e-spec.ts`                     |
| PA9 reparo adicional          | `ServiceOrder.registerAdditionalRepair()` e `Quote.version`                                                    | `service-order.spec.ts`, `service-orders.e2e-spec.ts`                     |
| PA10 tempo de execução        | `StatusHistory` e `AverageExecutionTimeQuery`                                                                  | `status-history.spec.ts`, `metrics.e2e-spec.ts`                           |
| PA11 notificação              | `NotificationGateway` (camada anticorrupção) e `LoggerNotificationGateway`                                     | `service-order-notifier.spec.ts`                                          |

## Diagramas C4

O C4 nível 3 do board usa os mesmos nomes dos componentes do código: `AuthController`, `UsersController`, `CustomersController`, `VehiclesController`, `ServiceOrdersController`, `MetricsController`, `CustomerServiceOrdersController`, `ServicesController`, `PartsController` e `HealthController`, além dos casos de uso, dos repositórios Prisma, do `PrismaService` e do `NotificationGateway`.
