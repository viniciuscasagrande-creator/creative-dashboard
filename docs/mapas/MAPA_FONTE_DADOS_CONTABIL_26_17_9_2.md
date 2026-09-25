# MAPA DE FONTES DE DADOS REAIS — CONTABILIDADE ENTERPRISE PDT
**Projeto**: Creative Dashboard / PDT DiskIngressos  
**Fase**: 26.17.9.2 — Substituição de Mocks por Dados Reais  
**Repositório Canônico**: `C:\Users\vinad\OneDrive\Desktop\projetos principais\creative-dashboard`  
**Data**: 09/09/2026  

---

## 1. Mapeamento de Campos da API × Fontes Oficiais Reais do PDT

Conforme estabelecido na diretriz da Fase 26.17.9.2, o frontend **não aceita mais dados simulados, multiplicadores artificiais (ex: `0.45`, `0.35`) ou datasets fixos**. Cada métrica deve vir de sua respectiva tabela e fluxo transacional real do backend do PDT:

| Campo API (`GET /api/accounting/dashboard`) | Tabela / Entidade Real | Coluna / Expressão de Cálculo | Filtro Obrigatório | Regra Contábil Oficial |
|---|---|---|---|---|
| `kpis.gmv` | `orders` / `pedidos` | `SUM(total_amount)` | `status = 'PAID' AND payment_status = 'APPROVED' AND period BETWEEN start AND end` | **GMV NÃO É RECEITA**. Excluir cancelados, não pagos e estornos integrais. |
| `kpis.thirdPartyFunds` | `order_splits` / `producer_funds` | `SUM(producer_net_amount)` | `status IN ('PENDING_PAYOUT', 'SCHEDULED', 'AWAITING_SETTLEMENT')` | **Passivo Circulante**. Recursos pertencentes a produtores nunca compõem faturamento próprio. |
| `kpis.diskRevenue` | `order_items_fees` / `revenues` | `SUM(convenience_fee + ticket_commission + service_fee)` | `order_status = 'PAID'` | **Receita Operacional Bruta Própria**. Reconhecimento de taxas de conveniência e comissões contratuais. |
| `kpis.gatewayFees` | `gateway_settlements` / `gateway_transactions` | `SUM(acquirer_fee + processing_cost + mdr_amount)` | `settlement_status = 'SETTLED'` | **Custos Financeiros / Deduções**. Taxas reais cobradas por Mercado Pago, PagSeguro, Cielo, Stone, etc. |
| `kpis.provisionedTaxes` | `fiscal_provisions` / `tax_apurations` | `SUM(iss_amount + pis_amount + cofins_amount + irpj_csll)` | `competence_period = current_period` | **Provisão Tributária**. Impostos incidentes exclusivamente sobre a Receita Própria DiskIngressos. |
| `kpis.producerPayouts` | `producer_payouts` / `repasses` | `SUM(payout_amount)` | `payout_status = 'COMPLETED' AND transfer_date BETWEEN start AND end` | **Liquidação de Terceiros**. Baixa do passivo mediante comprovação bancária (PIX/TED). |
| `kpis.operatingResult` | `dre_entries` / Apuração | `diskRevenue - gatewayFees - operational_costs - provisionedTaxes` | `period BETWEEN start AND end` | **Resultado Operacional Líquido**. Efetiva margem gerada pela operação DiskIngressos. |
| `kpis.cashAndBanks` | `bank_accounts` / `conciliated_balances` | `SUM(account_balance)` | `account_type IN ('CHECKING', 'SETTLEMENT', 'INVESTMENT')` | **Disponibilidades Reais**. Conciliado com extratos OFX oficiais dos bancos. |
| `thirdPartyFunds.awaitingSettlement` | `order_splits` | `SUM(amount)` | `gateway_status = 'PENDING_CLEARING'` | Aguardando liquidação da adquirente (D+1, D+14, D+30). |
| `thirdPartyFunds.availableForPayout` | `order_splits` | `SUM(amount)` | `gateway_status = 'SETTLED' AND payout_status = 'AVAILABLE'` | Saldo liberado e apto a repasse solicitado pelo produtor. |
| `thirdPartyFunds.scheduledPayout` | `producer_payout_schedules` | `SUM(amount)` | `payout_status = 'SCHEDULED'` | Lotes de transferência programados com data futura. |
| `thirdPartyFunds.blocked` | `order_splits` / `compliance_holds` | `SUM(amount)` | `is_blocked = TRUE OR compliance_flag = 'HOLD'` | Retenções cautelares (chargebacks, divergências ou ordem judicial). |
| `reconciliation.rate` | `reconciliation_aggregates` | `(reconciled_orders / total_orders) * 100` | `period BETWEEN start AND end` | **Índice Oficial**. Pedido × Gateway × Banco × Split. |
| `gateways` | `gateway_transactions` | `acquirer_name, SUM(gross_volume), SUM(fee_amount)` | `status = 'APPROVED'` | Agrupamento por adquirente real. |
| `featuredEvents` | `events` + `orders` | `SUM(gmv), SUM(disk_fee), SUM(payout), reconciliation_rate` | `period BETWEEN start AND end GROUP BY event_id` | Top eventos reais transacionados na competência. |

---

## 2. Inventário de Mocks Remanescentes a Eliminar na Fase 26.17.9.3

O diagnóstico técnico confirmou que o frontend agora trata a ausência de dados de forma estrita (`SEM_DADOS` e `—`), sem jamais exibir números fictícios no dashboard principal. Os seguintes módulos permanecem com dados locais aguardando os endpoints reais:
1. **Centro de Conciliação**: `src/services/reconciliationService.js` (dados de exemplo em `INITIAL_ITEMS` e `localStorage`).
2. **Rastreabilidade 360º**: `src/services/traceabilityService.js` (`INITIAL_TRACEABILITY_ORDERS`).
3. **Balanço Patrimonial**: `src/services/balanceSheetService.js` (`INITIAL_FINANCIAL_POSITION` e `INITIAL_BALANCE_SHEET`).
4. **Fechamento Mensal**: `src/services/closingService.js` (`INITIAL_CLOSING_STATE`).

---

## 3. Diretriz para a Fase 26.17.9.3

A **Fase 26.17.9.3 — Backend Contábil Real: Pedidos → Gateway → Split → Repasse** conectará a rota `GET /api/accounting/dashboard` e as rotas satélites diretamente às consultas e coleções reais do banco de dados do PDT, consolidando o fluxo contábil íntegro sem dados inventados.
