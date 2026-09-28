# Implantação 5.1 — Motor de Taxas por Evento

Data: 28/09/2026

## Implementado
- Serviço `eventFeeRulesService.js` com regras versionadas e vigência.
- Escopo por evento, produtor e regra global de fallback.
- Modelos: percentual sobre vendas, valor fixo por ingresso e valor fixo por evento.
- Memória de cálculo usada pelas telas Posição Financeira Geral e Taxas e Custos.
- Editor de taxa por evento dentro de Taxas e Custos.
- Alteração de regra cria nova vigência e preserva histórico/auditoria local.
- Chargeback separado de estorno na composição financeira.
- Saldo disponível passa a considerar taxa calculada pelo motor, custo de pagamento, estorno, chargeback, comprometido e repassado.

## Regra importante
O armazenamento local é fallback de interface. O Core/Ledger/API oficial deve substituir a persistência local em produção sem alterar a API pública do serviço.

## Validação
- `node --check src/services/eventFeeRulesService.js`: OK.
- `node --check src/app.js`: OK.
- `node scripts/test_event_fee_rules.js`: OK.
- Caso controlado: R$ 1.000.000 a 10% = R$ 100.000.

## Build
`npm run build` não executou porque o binário `vite` não está presente no `node_modules` materializado neste ambiente (`vite: not found`). Não foi alterado package.json para mascarar o problema.

## Próxima etapa
Conectar o motor às fontes reais de contrato/evento e ao Core/Ledger, incluindo estornos, chargebacks, MDR/adquirência, repasses e snapshots históricos por transação.
