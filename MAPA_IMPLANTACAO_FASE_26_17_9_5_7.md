# Mapa de Implantação — Fase 26.17.9.5.7
## Agenda Financeira, Repasse Automático e Lotes de Repasse

**Módulo**: Financeiro → Gestão de Saldos → Agenda Financeira (`#ft-pane-schedule`)  
**Objetivo**: Estruturar a camada operacional para agenda financeira, criação e processamento de lotes de repasse, aprovação em massa com reavaliação individual obrigatória pelo Motor de Regras (Fase 26.17.9.5.6), integração bancária com idempotência, retorno bancário e reprocessamento seguro.

---

### 1. O Fluxo Operacional Canônico

```text
AGENDAMENTO FINANCEIRO
        ↓
REAVALIAÇÃO NO MOTOR DE REGRAS (Fase 26.17.9.5.6)
 ┌──────┼──────────────┬──────────────┬──────────────┐
 ↓      ↓              ↓              ↓              ↓
ALLOW  ALLOW_APPROVAL  ALLOW_PARTIAL  HOLD           BLOCK
 │      │              │              │              │
 │      │              │              └───────┐      └────────┐
 │      ▼              ▼                      ▼               ▼
 │   Aprovação     Capacidade            Retido na       Bloqueado
 │   Individual/   Líquida               Agenda          com Motivo
 │   Colegiada     Autorizada            Temporária      Auditorado
 └───┬──┴──────────────┘                      │               │
     ▼                                        │               │
RESERVA DE SALDO DISPONÍVEL                   │               │
     ↓                                        │               │
AGRUPAMENTO EM LOTE DE REPASSE                │               │
     ↓                                        │               │
APROVAÇÃO DO LOTE (Maker/Checker)             │               │
     ↓                                        │               │
ENVIO AO PROVEDOR BANCÁRIO (API / PIX / CNAB) │               │
     ↓                                        │               │
RETORNO BANCÁRIO (Webhook / Arquivo Retorno)  │               │
 ┌───┴───────────────┐                        │               │
 ▼                   ▼                        │               │
PAGO / LIQUIDADO   REJEITADO / FALHA          │               │
 │                   │                        │               │
 │                   ▼                        │               │
 │             FALHA TÉCNICA?                 │               │
 │             ├── SIM → Reprocessamento      │               │
 │             └── NÃO (Saldo/Dados/BLOCK) →  │               │
 │                 Retenção e Alerta          │               │
 ▼                                            ▼               ▼
BAIXA CONTÁBIL & CONCILIAÇÃO ─────────────────┴───────────────┘
     ↓
AUDITORIA APPEND-ONLY COM CORRELATION-ID
```

---

### 2. Estados dos Lotes de Repasse (`PayoutBatchStatus`)

1. **`RASCUNHO`**: Lote montado em preparação, permitindo inclusão/remoção de itens.
2. **`EM_VALIDACAO`**: Lote submetido à reavaliação automática item a item pelo `financialRulesEngine`.
3. **`AGUARDANDO_APROVACAO`**: Contém itens que exigem aprovação de alçada (Nível 1 ou Nível 2).
4. **`APROVADO`**: Homologado por aprovador autorizado distinto do criador (Maker/Checker).
5. **`EM_PROCESSAMENTO`**: Transação atômica iniciada, saldo disponível reservado.
6. **`ENVIADO_BANCO`**: Remessa bancária submetida com `Idempotency-Key` e `bankTransactionId`.
7. **`PARCIAL`**: Processamento concluído com alguns itens pagos e outros retidos/rejeitados.
8. **`CONCLUIDO`**: 100% dos itens liquidados e confirmados pelo retorno bancário.
9. **`FALHA`**: Falha sistêmica na comunicação com o banco (elegível a retry seguro).
10. **`CANCELADO`**: Lote cancelado pela Controladoria/Diretoria com estorno de reservas.

---

### 3. Regras Mandatórias de Negócio

1. **Inviolabilidade do Motor de Regras**:
   - Nenhum repasse automático pode ignorar a avaliação de `financialRulesEngine.evaluateFinancialOperation()`.
   - Cada item do lote é avaliado individualmente:
     - `BLOCK`: Não executa, item marcado como bloqueado com justificativa.
     - `HOLD`: Permanece retido aguardando janela bancária ou conciliação.
     - `ALLOW_PARTIAL`: Ajusta o montante ao teto permitido pela política.
2. **Reprocessamento Seguro**:
   - Somente falhas técnicas/transitórias (ex: timeout de rede, erro 503 do banco) podem sofrer retry automático.
   - Bloqueios por `BLOCK`, saldo insuficiente, compliance, produtor suspenso ou dados bancários inválidos **jamais entram em retry automático**.
3. **Idempotência Bancária**:
   - Cada tentativa de envio carrega uma chave única `idempotencyKey = BATCH-{batchId}-ITEM-{itemId}-V{version}`, prevenindo duplicidade de pagamentos.
4. **Reserva Preventiva de Saldo**:
   - Ao aprovar o lote, o saldo é imediatamente reservado (`committedBalance`), impedindo transferências concorrentes.
