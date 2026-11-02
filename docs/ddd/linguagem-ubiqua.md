# Linguagem ubíqua

Glossário dos termos do domínio, agrupados pelo contexto delimitado a que pertencem, com o nome usado no código.

## Atendimento (`service-order`)

| Termo                          | Nome no código                                                               | Definição                                                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordem de Serviço (OS)          | `ServiceOrder`                                                               | Registro do atendimento de um veículo, do recebimento à entrega. Agregado raiz que controla os itens, os orçamentos e o status.                                                                            |
| Código de acompanhamento       | `TrackingCode`                                                               | Código aleatório de 8 caracteres (ex.: `K7QM-4XPA`), gerado na abertura da OS e entregue no recibo. Prova, junto com o documento, que a pessoa é o cliente da OS.                                          |
| Status da OS                   | `ServiceOrderStatus`                                                         | Fase da OS: Recebida, Em diagnóstico, Aguardando aprovação, Em execução, Finalizada e Entregue. Só as transições previstas são aceitas.                                                                    |
| Histórico de status            | `StatusHistory`                                                              | Registro de cada mudança de status, com a data e a hora. Base do cálculo do tempo de execução.                                                                                                             |
| Abertura da OS                 | `ServiceOrder.open()`, `OpenServiceOrderUseCase`                             | Criação da OS a partir do CPF/CNPJ do cliente e da placa do veículo, cadastrando os dois quando são novos. Um veículo só pode ter uma OS aberta.                                                           |
| Diagnóstico                    | `ServiceOrder.startDiagnosis()`, `ServiceOrder.concludeDiagnosis()`          | Fase em que o mecânico inclui os serviços e as peças. A conclusão gera o orçamento.                                                                                                                        |
| Item de serviço / Item de peça | `ServiceItem` / `PartItem`                                                   | Serviço ou peça incluídos na OS, com o nome e o preço congelados no momento da inclusão e a versão do orçamento a que pertencem.                                                                           |
| Orçamento                      | `Quote`, `QuoteCalculator`                                                   | Proposta de preço da OS, gerada automaticamente com a soma dos itens e enviada ao cliente. É aprovada ou rejeitada por inteiro.                                                                            |
| Reparo adicional               | `ServiceOrder.registerAdditionalRepair()`, `RegisterAdditionalRepairUseCase` | Necessidade descoberta durante a execução. Gera uma nova versão do orçamento, e a OS volta para Aguardando aprovação.                                                                                      |
| Valor a pagar                  | `ServiceOrder.approvedTotal`                                                 | Soma dos orçamentos aprovados da OS.                                                                                                                                                                       |
| Finalização                    | `ServiceOrder.finish()`, `FinishServiceOrderUseCase`                         | Fim da execução do serviço. O cliente é avisado de que o veículo está pronto.                                                                                                                              |
| Entrega                        | `ServiceOrder.deliver()`, `DeliverServiceOrderUseCase`                       | Entrega do veículo ao cliente. Fecha a OS e libera o veículo para uma nova OS.                                                                                                                             |
| Tempo de execução              | `ServiceOrder.getExecutionTime()`, `AverageExecutionTimeQuery`               | Soma dos períodos de Em execução até a finalização, sem a espera pela aprovação de reparos adicionais. Base do tempo médio acompanhado pelo gestor. As OS com o orçamento inicial rejeitado ficam de fora. |
| Serviço de notificação         | `NotificationGateway`                                                        | Camada anticorrupção para o sistema externo que avisa o cliente sobre o orçamento disponível e a OS finalizada. No MVP, os avisos são registrados em log.                                                  |

## Cadastro (`customer`)

| Termo     | Nome no código | Definição                                                                                                              |
| --------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Cliente   | `Customer`     | Pessoa física ou jurídica dona do veículo, identificada pelo CPF/CNPJ. Acompanha a OS e aprova ou rejeita o orçamento. |
| Documento | `Document`     | CPF ou CNPJ do cliente, validado pelo dígito verificador. É único no cadastro.                                         |
| Veículo   | `Vehicle`      | Veículo do cliente, identificado pela placa, com marca, modelo e ano.                                                  |
| Placa     | `LicensePlate` | Placa do veículo no padrão antigo (`ABC1234`) ou Mercosul (`ABC1D23`). É única no cadastro.                            |

## Catálogo e Estoque (`catalog`)

| Termo              | Nome no código                                | Definição                                                                                                           |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Serviço            | `Service`                                     | Serviço oferecido pela oficina, com preço e tempo estimado.                                                         |
| Peça/Insumo        | `Part`                                        | Item controlado em estoque, do tipo peça (`PART`) ou insumo (`SUPPLY`), com preço e quantidade disponível.          |
| Baixa do estoque   | `Part.deduct()`, `DeductStockUseCase`         | Redução da quantidade disponível quando a peça é incluída na OS, na mesma transação. O estoque nunca fica negativo. |
| Estorno da baixa   | `Part.reverse()`, `ReverseStockUseCase`       | Devolução ao estoque das peças de um orçamento rejeitado.                                                           |
| Entrada de estoque | `Part.restock()`, `RegisterStockEntryUseCase` | Aumento da quantidade disponível, registrado pelo gestor.                                                           |
| Peça indisponível  | `Part.isOutOfStock`                           | Peça ou insumo sem saldo. Aparece na lista de reposição do gestor.                                                  |

## Identidade e Acesso (`auth`)

| Termo                   | Nome no código                | Definição                                                                                                                                                                                  |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Usuário da equipe       | `User`                        | Funcionário da oficina, com e-mail, senha e função.                                                                                                                                        |
| Atendente               | `Role.ATTENDANT`              | Funcionário que recebe o cliente, identifica o cliente e o veículo, faz os cadastros, abre a OS, registra a decisão do cliente e registra a entrega.                                       |
| Mecânico                | `Role.MECHANIC`               | Funcionário que faz o diagnóstico, inclui serviços e peças, executa o reparo, registra o reparo adicional e finaliza a OS.                                                                 |
| Gestor                  | `Role.MANAGER`                | Funcionário que mantém o catálogo de serviços e o estoque, registra as entradas de estoque e acompanha o tempo médio de execução.                                                          |
| Função do cliente       | `Role.CUSTOMER`               | Função do token emitido para o cliente. Não existe na tabela de usuários e dá acesso só às rotas do aplicativo.                                                                            |
| Autenticação do cliente | `AuthenticateCustomerUseCase` | Validação do CPF/CNPJ e do código de acompanhamento no aplicativo mobile. Gera o token `CUSTOMER`, que libera a consulta das OS do próprio cliente e a aprovação ou rejeição do orçamento. |

## Compartilhado (`shared`)

| Termo      | Nome no código | Definição                                                                                                                                                                  |
| ---------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dinheiro   | `Money`        | Valor monetário em reais, guardado em centavos para evitar erros de arredondamento.                                                                                        |
| Quantidade | `Quantity`     | Quantidade de peças ou insumos, sempre um número inteiro e nunca negativo. O saldo de uma peça pode ser zero, e as movimentações de estoque são de pelo menos uma unidade. |
