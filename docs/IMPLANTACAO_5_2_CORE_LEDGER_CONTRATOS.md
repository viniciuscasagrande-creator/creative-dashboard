# Implantação 5.2 — Core/Ledger + Contratos + Adquirência Real

## Entregue
- Consolidação Evento → Produtor → DiskIngressos sem fallback mock para fontes críticas.
- Core/Ledger como fonte de saldos e posição.
- Contratos de taxa Disk por evento/produtor com vigência.
- MDR e liquidações por Cielo, Rede, Stone e PagBank.
- Estornos e chargebacks separados.
- Repasses usam liquidação real, não apenas solicitação/aprovação.
- Diagnóstico explícito de fonte indisponível.

## Contrato REST esperado
- GET `/api/finance/consolidated/position`
- GET `/api/finance/balances/events`
- GET `/api/finance/ledger/summary`
- GET/POST `/api/finance/contracts/fee-rules`
- GET `/api/finance/acquirers/contracts`
- GET `/api/finance/acquirers/settlements`
- GET `/api/finance/refunds`
- GET `/api/finance/chargebacks`
- GET `/api/finance/payouts/settlements`

Base configurável por `VITE_PDT_API_BASE_URL` ou `VITE_FINANCE_API_BASE_URL`.

## Regra de segurança
Se Core/Ledger não responderem, a tela não fabrica números. Se fontes complementares falharem, a interface sinaliza a indisponibilidade. O backend continua responsável por autenticação, autorização, escopo de produtor/evento e consistência contábil.
