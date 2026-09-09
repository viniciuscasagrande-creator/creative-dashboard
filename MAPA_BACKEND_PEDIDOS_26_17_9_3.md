# MAPA DE BACKEND REAL DE PEDIDOS — FASE 26.17.9.3
**Projeto**: Creative Dashboard / PDT DiskIngressos  
**Fase**: 26.17.9.3 — Backend Contábil Real: Pedidos  
**Repositório Canônico**: `C:\Users\vinad\OneDrive\Desktop\projetos principais\creative-dashboard`  
**Data**: 09/09/2026  

---

## 1. Endpoints de Pedidos Contábeis Reais

A camada frontend foi desacoplada de dados em memória e de `localStorage`. As requisições são direcionadas aos endpoints oficiais via [`accountingOrdersGateway.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/accountingOrdersGateway.js):

| Endpoint | Método | Parâmetros | Fonte de Dados Real Esperada | Finalidade Contábil |
|---|---|---|---|---|
| `/api/accounting/orders` | GET | `?query=...&page=1&limit=20` | `orders` / `pedidos` | Busca rápida por ID de pedido, NSU, TID ou comprador. |
| `/api/accounting/orders/:orderId` | GET | `orderId` (path) | `orders` + `order_items` + `order_splits` | Ficha analítica completa da transação e sua decomposição de valores. |
| `/api/accounting/orders/:orderId/timeline` | GET | `orderId` (path) | `order_history` + `payment_events` + `gateway_webhooks` | Trilha de auditoria cronológica dos status operacionais do pedido. |
| `/api/accounting/orders/:orderId/accounting-entries` | GET | `orderId` (path) | `accounting_entries` / `partidas_dobradas` | Lançamentos contábeis em partidas dobradas (Débito e Crédito) vinculados ao pedido. |
| `/api/accounting/orders/:orderId/audit-log` | GET/POST | `orderId` (path) + payload de nota | `order_audit_notes` / `audit_logs` | Registro imutável de notas de auditoria e justificativas de conciliação manual. |

---

## 2. Mapa de Campos e Relacionamentos no Banco de Dados

| Campo do Contrato | Entidade Relacional / Modelo | Coluna Real | Regra de Tratamento |
|---|---|---|---|
| `orderId` | `Order` | `id` / `code` | Código alfanumérico ou numérico único da venda. |
| `grossAmount` | `Order` | `total_amount` | **GMV Bruto** do pedido. |
| `composition.producerNetAmount` | `OrderSplit` | `producer_net_amount` | **Recurso de Terceiro** (Passivo até a liquidação/repasse). |
| `composition.diskFee` | `Order` / `OrderItemFee` | `convenience_fee + service_fee` | **Receita DiskIngressos**. |
| `composition.gatewayCost` | `GatewayTransaction` | `acquirer_fee + mdr_amount` | **Custo Financeiro / Dedução de Gateway**. |
| `composition.taxAmount` | `TaxProvision` | `provisioned_tax` | **Tributos Provisionados**. |
| `composition.netResult` | Calculado | `diskFee - gatewayCost - taxAmount` | **Margem Operacional Líquida da DiskIngressos**. |
| `gateway.name` | `GatewayTransaction` | `acquirer_name` | Identificação da operadora (Mercado Pago, Cielo, PagSeguro, etc.). |
| `gateway.nsu` / `tid` | `GatewayTransaction` | `nsu`, `tid`, `authorization_code` | Identificadores bancários e de adquirente para conciliação. |
| `split.producerName` | `Producer` | `name` / `corporate_name` | Identificação do produtor favorecido. |
| `split.status` | `OrderSplit` | `status` | `Aguardando Liquidação`, `Disponível`, `Programado`, `Repassado`, `Bloqueado`. |

---

## 3. Diretriz de Integridade Técnica

- **Zero Mock**: Não existem mais pedidos fictícios pré-carregados (`#123456`, `#123488`, `#123512`).
- **Estado Inicial Limpo**: O painel inicia com convite amigável para pesquisa de pedido real.
- **Tratamento de Indisponibilidade**: Se a API oficial não responder, o sistema informa a desconexão sem inventar lançamentos ou valores.
