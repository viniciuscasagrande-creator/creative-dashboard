# Implantação 5.4 — Gateways, Adquirentes, Bandeiras e Taxas

## Visão Geral e Princípios Fundamentais

A **Implantação 5.4** consolida a gestão oficial de gateways, adquirentes, bandeiras, matrizes de tarifas (MDR) e regras comerciais de precificação da plataforma DiskIngressos.

A implementação ancora-se estritamente nas diretrizes canônicas do projeto (`AGENTS.md` e `GEMINI.md`):
1. **O Ledger Contábil como Fonte Central de Verdade**: A Implantação 5.4 não cria um motor financeiro paralelo; estende o Core Financeiro existente garantindo que toda taxa, custo e liquidação tenha rastreabilidade exata.
2. **Segregação de Papéis Inviolável**: O módulo de Gateways e Adquirentes é de acesso **exclusivo do Financeiro Disk e Administradores**. O Produtor não possui item de menu, não acessa rotas internas (`/financeiro/gateways-adquirentes`) e é redirecionado sumariamente para `/acesso-negado` com a view `access-denied` caso tente acesso direto. O Produtor jamais tem visibilidade sobre contratos de custo (MDR) da plataforma com adquirentes.
3. **As Três Separações Invioláveis**:
   - Venda (GMV) NÃO é saldo.
   - Dinheiro do produtor NÃO é receita da Disk.
   - Taxa administrativa Disk NÃO é custo de adquirência (MDR).

---

## 1. Cadeia Oficial do Fluxo do Dinheiro

A precificação e apropriação financeira seguem o fluxo contínuo e determinístico:

```text
EVENTO
  ↓
CHECKOUT
  ↓
FORMA DE PAGAMENTO
  ↓
GATEWAY / ADQUIRENTE
  ↓
BANDEIRA
  ↓
DÉBITO / CRÉDITO
  ↓
PARCELAMENTO
  ↓
MDR / TARIFA DA OPERADORA
  ↓
REGRA COMERCIAL
  ↓
QUEM SUPORTA O CUSTO?
  ├── DiskIngressos (Absorvido)
  ├── Produtor (Descontado do Líquido)
  ├── Cliente final (Acrescido no Checkout)
  └── Compartilhado / Dividido (Fechamento centavos exato)
  ↓
PAGAMENTO (Snapshot Imutável)
  ↓
LEDGER CONTÁBIL
  ↓
LIQUIDAÇÃO (Previsto × Real)
  ↓
FECHAMENTO FINANCEIRO POR EVENTO
  ↓
CONCILIAÇÃO BANCÁRIA
```

---

## 2. Estrutura de Navegação e Interface Única

Em conformidade estrita com o menu canônico de 50 links do Financeiro Disk (regra imutável de `tests/fases/test_phase_28_15_3.js`), a tela é acessada sob Tesouraria sem expansão de submenus na sidebar:

```text
FINANCEIRO
  TESOURARIA
    Tesouraria
    Gateways e Adquirentes  ← EXCLUSIVO FINANCEIRO DISK
    Contas Bancárias
    Fornecedores
    Conciliação
```

A interface opera em **tela única analítica com 6 abas canônicas**:
1. **Visão Geral (`#tab-gw-visao-geral`)**: KPIs de custo médio MDR, taxa comercial média, spread operacional ponderado e status operacional das adquirentes homologadas.
2. **Operadoras (`#tab-gw-operadoras`)**: Catálogo parametrizado de adquirentes (Cielo, Rede, Stone, PagBank e dinâmicas), contratos, prazos de liquidação e canais.
3. **Bandeiras e Taxas (`#tab-gw-bandeiras`)**: Matriz de MDR, tarifas fixas, custos de antecipação e histórico versionado por operadora e modalidade.
4. **Regras Comerciais & Simulador (`#tab-gw-comercial`)**: Definição de taxas comerciais, políticas de fee bearer (quem suporta o custo) e simulador transacional de homologação em tempo real.
5. **Liquidações (Previsto × Real) (`#tab-gw-liquidacoes`)**: Painel analítico de conciliação transacional comparando o previsto no ato da venda com o extrato real da adquirente.
6. **Histórico & Auditoria (`#tab-gw-historico`)**: Trilha cronológica imutável de eventos (alterações de vigência, aprovações de regras, snapshots criados e conciliações executadas).

---

## 3. Matriz de Taxas e Separação de Componentes

Para cada transação ou simulação, o motor financeiro (`gatewayFeeMatrixService`) isola três grandezas financeiras fundamentais:

$$\text{Taxa Comercial} = \text{Custo de Adquirência (MDR)} + \text{Margem/Spread Operacional}$$

- **Custo Disk (MDR)**: Taxa cobrada pela adquirente (Cielo, Rede, Stone, PagBank).
- **Taxa Comercial**: Percentual/tarifa final estipulado pela regra comercial.
- **Spread Operacional**: Margem líquida retida pela DiskIngressos na intermediação.

### Responsabilidade pelo Custo (`feeBearer`)

| Responsável | Impacto no Checkout (Cliente) | Impacto no Saldo do Produtor | Impacto no Resultado Disk |
|---|---|---|---|
| `CLIENTE_FINAL` | Paga valor do ingresso + taxa comercial | Recebe valor integral do ingresso | Retém o spread operacional |
| `PRODUTOR` | Paga apenas valor nominal do ingresso | Tem a taxa comercial deduzida do seu líquido | Retém o spread operacional |
| `DISK` | Paga valor nominal do ingresso | Recebe valor integral do ingresso | Absorve integralmente o custo de adquirência (MDR) |
| `DIVIDIDO` | Paga sua fração acordada | Tem sua fração acordada deduzida | Assegura fechamento matemático exato de 100% dos centavos |

---

## 4. Hierarquia Estrita de Resolução de Regras

O motor de precificação aplica o princípio contábil da **especificidade máxima**. A regra mais específica sempre prevalece sobre a mais genérica:

```text
REGRA ESPECÍFICA DO EVENTO (Score: 100)
             ↓
REGRA DO PRODUTOR (Score: 50)
             ↓
REGRA GLOBAL DISKINGRESSOS (Score: 10)
             ↓
CANAL (Online / POS Físico / Agência PDV)
             ↓
ADQUIRENTE (Cielo / Rede / Stone / PagBank)
             ↓
BANDEIRA (Visa / Mastercard / Elo / Hipercard / Multi-Bandeiras)
             ↓
MODALIDADE / PARCELAMENTO (Débito, Crédito 1x até 12x, PIX)
```

Toda resolução registra o atributo auditável `ruleOrigin`:
- `EVENTO`: Condição especial negociada para uma edição específica.
- `PRODUTOR`: Condição global contratada pelo produtor para seus eventos.
- `GLOBAL`: Tabela padrão da plataforma DiskIngressos.

---

## 5. Vigência Versionada e Imutabilidade

- **Proibição de Sobrescrita**: Nenhuma taxa ou regra passada é sobrescrita. Cada alteração cria uma nova vigência com versão incremental ($v_1 \to v_2 \to v_3$).
- **Limite Temporal Estrito**: A verificação temporal compara a data/hora exata da transação com os limites de vigência (`effectiveFrom` e `effectiveTo`). Vendas realizadas às `23:59:59` de um período utilizam rigorosamente a tabela daquele período, enquanto transações às `00:00:00` do novo período utilizam o novo reajuste.
- **Consultas Retrospectivas**: Ao auditar ou fechar eventos passados, o motor busca o histórico versionado daquela data sem afetar as regras vigentes no presente.

---

## 6. Snapshot Imutável da Transação (`paymentFeeSnapshot`)

No momento da confirmação do pagamento no checkout, é gerado um snapshot congelado que acompanha a transação por todo o ciclo contábil:

```javascript
{
  snapshotId: "SNP-1759089000-4321",
  transactionId: "TX-2026-99120",
  orderId: "PED-99120",
  eventId: "5096",
  producerId: "prod-1",
  amount: 1000.00,
  adquirente: "Cielo",
  bandeira: "Visa",
  modalidade: "CREDITO_3X",
  parcelas: 3,
  channel: "ONLINE",
  mdrPercent: 2.25,
  custoAdquirenciaPrevisto: 22.50,
  regraComercialPercent: 3.20,
  taxaComercialCalculada: 32.00,
  operationalSpreadAmount: 9.50,
  feeBearer: "CLIENTE_FINAL",
  ruleId: "RULE-CIELO-VISA-CRED3X-GLOBAL",
  ruleVersion: 1,
  ruleOrigin: "GLOBAL",
  contractId: "CTR-CIELO-2026",
  vigencia: "2026-01-01",
  immutable: true,
  createdAt: "2026-09-25T14:32:00.000Z"
}
```

Mesmo que a adquirente ou a DiskIngressos alterem contratos futuramente, a transação permanece historicamente auditável no Ledger.

---

## 7. Governança e Alçadas de Aprovação

As regras de tarifas passam por ciclo formal de governança antes de entrar em produção:
1. `RASCUNHO`: Proposta cadastrada pelo gestor operacional ou comercial.
2. `PENDENTE_APROVACAO`: Submissão formal para análise da Diretoria/Gestão Financeira Disk.
3. `ATIVA`: Homologação formal com carimbo de auditoria (`approvedBy`, `approvedAt`).
4. `REPROVADO`: Rejeição motivada por spread insuficiente, alto float ou inconsistência contratual.

---

## 8. Liquidações: Previsto × Real e Conciliação

O módulo compara o valor e custos projetados no ato da transação contra o extrato real de liquidação do gateway bancário:

```text
TRANSAÇÃO DE REFERÊNCIA (Cielo Crédito 3x - R$ 1.000,00)
MDR Previsto:  R$ 22,50 (2,25%)
MDR Real:      R$ 22,73 (2,27%)
Diferença:     R$  0,23 (+1,02% de divergência)
Status:        DIVERGÊNCIA DE MDR
```

### Classificação Canônica de Divergências:
- `CONCILIADO`: Sem divergência ou tratado/justificado pela controladoria.
- `DIVERGENCIA_MDR`: Percentual retido pelo gateway difere da tarifa contratada.
- `DIVERGENCIA_TARIFA`: Taxa de mensageria ou tarifa fixa por transação difere.
- `DIVERGENCIA_VALOR`: Valor bruto ou líquido depositado difere do esperado.
- `LIQUIDACAO_NAO_LOCALIZADA`: Transação aprovada sem crédito bancário registrado.
- `LIQUIDACAO_PARCIAL`: Recebimento de parcela sem o total previsto.
- `TRANSACAO_NAO_LOCALIZADA`: Depósito da adquirente sem pedido correspondente.
- `ESTORNO_PENDENTE`: Cancelamento realizado na plataforma pendente na adquirente.
- `CHARGEBACK`: Contestação aberta pelo titular do cartão.
- `DIVERGENCIA_DATA`: Crédito efetuado fora do prazo acordado (ex: D+30 virou D+35).

---

## 9. Controle de Acesso e Segregação do Produtor

| Perfil de Usuário | Visualiza Gateways/Taxas | Edita/Aprova Regras | Executa Conciliação |
|---|---|---|---|
| `ADMINISTRADOR` | Sim | Sim | Sim |
| `GESTOR_FINANCEIRO` | Sim | Sim | Sim |
| `FINANCEIRO` | Sim | Não | Sim |
| `PRODUTOR_ADMINISTRADOR` | **NÃO (Bloqueio estrito)** | **NÃO** | **NÃO** |
| `PRODUTOR_OPERACIONAL` | **NÃO (Bloqueio estrito)** | **NÃO** | **NÃO** |
| `PRODUTOR_VISUALIZADOR` | **NÃO (Bloqueio estrito)** | **NÃO** | **NÃO** |

Tentativas de acesso direto por produtores são interceptadas no roteador (`resolveRoute`) e direcionadas para `/acesso-negado` com emissão de alerta no console de segurança.

---

## 10. Verificação e Testes Automatizados

A suíte de testes `tests/fases/test_impl_5_3_5_4_fechamento_gateways.js` valida de ponta a ponta:
- 26/26 testes unitários e de integração aprovados com 100% de sucesso.
- 21/21 suítes de regressão do projeto (`scripts/run_all_phase_tests.js`) aprovadas sem qualquer quebra.
- Integridade total mantida na sidebar financeira com estritamente 50 links `.submenu-link`.
