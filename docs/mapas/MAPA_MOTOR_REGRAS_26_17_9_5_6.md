# MAPA ARQUITETURAL DO MOTOR DE REGRAS E PRIORIDADES FINANCEIRAS
## Fase 26.17.9.5.6 — Plataforma SafeSaff / PDT (DiskIngressos)

---

### 1. Visão Geral e Propósito do Motor Central

O **Motor de Regras de Repasse e Prioridades Financeiras (`financialRulesEngine`)** centraliza toda a lógica decisória pré-operacional de finanças do ecossistema DiskIngressos / SafeSaff. Ele substitui validações dispersas no código por um motor unificado, configurável e auditável.

```text
               OPERAÇÃO FINANCEIRA SOLICITADA
  (Repasse, Transferência entre Eventos, Antecipação, Despesa, Estorno)
                                ↓
               MOTOR CENTRAL DE REGRAS FINANCEIRAS
                                ↓
       ┌────────────────────────┼────────────────────────┐
       ↓                        ↓                        ↓
POLÍTICAS DE SALDO      RESERVAS MÍNIMAS        BLOQUEIOS & COMPLIANCE
(Disponível, Máx %)   (Fixa, % ou Maior)     (Conciliação, Chargeback, Docs)
       ↓                        ↓                        ↓
       └────────────────────────┼────────────────────────┘
                                ↓
                    MATRIZ DE 5 RESPOSTAS FORMAIS
 ┌─────────────┬──────────────────────┬───────────────┬──────────┬───────────┐
 │    ALLOW    │ ALLOW_WITH_APPROVAL  │ ALLOW_PARTIAL │   HOLD   │   BLOCK   │
 │   Liberado  │   Exige Alçada (1/2) │  Valor Menor  │ Retenção │ Bloqueado │
 └─────────────┴──────────────────────┴───────────────┴──────────┴───────────┘
```

---

### 2. Mapeamento de Fontes e Operações Suportadas

| Operação | Código | Ponto de Interceptação | Pré-requisito Avaliado pelo Motor |
| :--- | :--- | :--- | :--- |
| **Repasse ao Produtor** | `PAYOUT` | Solicitação de Repasse / Agenda | Saldo liquidado real, reserva mínima, conciliação do lote e ausência de bloqueios. |
| **Transferência entre Eventos** | `EVENT_TRANSFER` | Modal de Transferência (`Fase 26.17.9.5.2`) | Saldo disponível da origem, mesmo produtor, capacidade segura e alçadas de aprovação. |
| **Antecipação de Recebíveis** | `ADVANCE` | Módulo de Antecipação | Limite de antecipação contratual e histórico de liquidações futuras. |
| **Despesa / Pagamento Fornecedor**| `EXPENSE` | Contas a Pagar por Evento | Centro de custo vinculado, orçamento do evento e reserva caucionada. |
| **Estorno / Reembolso** | `REVERSAL` | Módulo de Devoluções (`financial-refunds`) | Saldo disponível no evento destino; trava `ESTORNO_BLOQUEADO_SALDO`. |
| **Ajuste Manual / Liberação** | `MANUAL_ADJUSTMENT` | Controladoria / Tesouraria | Perfil de compliance e dupla aprovação para valores acima de teto. |

---

### 3. Matriz Decisória das 5 Respostas

1. **`ALLOW`**:
   - Aprovado integralmente sem necessidade de intervenção humana.
   - Ocorre quando: $\text{Valor} \le \text{Limite Sem Aprovação}$, saldo disponível cobre reservas e não há alertas bloqueantes.
2. **`ALLOW_WITH_APPROVAL`**:
   - Liberado financeiramente, porém exige aprovação formal (Nível 1 ou Nível 2) por exceder o teto automático ou envolver regras de segregação de funções.
3. **`ALLOW_PARTIAL`**:
   - O valor solicitado excede a capacidade líquida liberável após dedução das reservas mínimas contratuais, mas existe capacidade residual positiva:
     $$\text{maxAllowedAmount} = \max(0, \, \text{SaldoDisponivel} - \text{ReservaMinima}) < \text{ValorSolicitado}$$
4. **`HOLD`**:
   - Retenção temporária não impeditiva.
   - Exemplos: operação solicitada fora da janela de processamento bancário (ex: final de semana/noite) ou lote de vendas do dia aguardando conciliação da virada de lote.
5. **`BLOCK`**:
   - Bloqueio estrito e intransponível.
   - Motivos: saldo insuficiente após reservas, divergência contábil ativa, contestação/chargeback crítico em aberto, produtor com documentação pendente ou suspensão jurídica.

---

### 4. Ordem Canônica de Prioridades Financeiras

Em conformidade com as melhores práticas de controladoria contábil e de tesouraria de bilheteria:

```
PRIORIDADE 1: Bloqueios Legais, Judiciais e de Compliance
     ↓
PRIORIDADE 2: Chargebacks e Estornos Retidos (Fundo Garantidor)
     ↓
PRIORIDADE 3: Reservas Contratuais Mínimas (Buffer Operacional)
     ↓
PRIORIDADE 4: Taxas de Serviço DiskIngressos e Tarifas MDR de Gateways
     ↓
PRIORIDADE 5: Repasses Programados Homologados
     ↓
PRIORIDADE 6: Amortizações de Antecipações de Recebíveis
     ↓
PRIORIDADE 7: Transferências Internas entre Eventos do Produtor
     ↓
PRIORIDADE 8: Despesas Operacionais Críticas (Cachês, ECAD, Estrutura)
     ↓
PRIORIDADE 9: Saldo Livre para Novas Solicitações
```

---

### 5. Parâmetros Configuráveis por Política

Todas as regras são estruturadas em entidades de configuração, banindo qualquer valor numérico ou regra fixa hardcoded:

```typescript
interface FinancialPolicyConfig {
  id: string;
  name: string;
  scope: "GLOBAL" | "PRODUCER" | "EVENT";
  targetId?: string; // producerId ou eventId
  minReserveFixed: number;
  minReservePercent: number;
  reserveRule: "GREATER_OF" | "FIXED" | "PERCENT";
  maxReleasePercent: number;
  maxWithoutApproval: number;
  twoLevelApprovalThreshold: number;
  requireReconciliationDone: boolean;
  blockOnDivergence: boolean;
  blockOnCriticalChargeback: boolean;
  blockOnPendingCompliance: boolean;
  operationalWindow: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    daysOfWeek: number[]; // 1 = Seg, 5 = Sex
  };
  allowPartialPayout: boolean;
}
```

---

### 6. Mecanismo de Exceções Auditáveis

- Uma exceção permite contornar um bloqueio específico (ex: liberar repasse emergencial para pagamento de artista mesmo com divergência não crítica).
- **Obrigatoriedades**:
  - Usuário com alçada de Controladoria/Diretoria.
  - Justificativa textual formal obrigatória.
  - Vigência limitada no tempo (com data de expiração).
  - Geração de log de auditoria append-only imutável com `correlationId`.
