# Arquitetura e Mapa da Fase 26.17.9.4.5
## Procure-to-Pay do SafeSaff / PDT: Fornecedores + Compras + Contratos + Aprovação Financeira

### 1. Visão Geral do Ciclo de Vida da Despesa

O módulo **Procure-to-Pay** assume a responsabilidade de gerenciar como uma despesa nasce e se desenvolve no ecossistema de eventos antes de chegar à liquidação:

```text
NECESSIDADE DO EVENTO
        ↓
SOLICITAÇÃO DE COMPRA (Purchase Request)
        ↓
COTAÇÃO / MULTI-PROPOSTAS (Quotation & Proposals)
        ↓
APROVAÇÃO POR ALÇADAS (Approval Engine & Maker/Checker)
        ↓
PEDIDO DE COMPRA (Purchase Order & Comprometimento Orçamentário)
        ↓
CONTRATO FORMAL (Contract & Rateio entre Eventos 100%)
        ↓
RECEBIMENTO / MEDIÇÃO (Goods Receipt)
        ↓
DOCUMENTO FISCAL / NF (Invoice)
        ↓
CONFERÊNCIA 3-WAY MATCH (Pedido × Recebimento × NF)
        ↓
CONTAS A PAGAR (Financial Payable - Parcelas Geradas)
        ↓
APROVAÇÃO FINANCEIRA
        ↓
PAGAMENTO (Tesouraria / PIX / TED)
        ↓
CONCILIAÇÃO BANCÁRIA
        ↓
CENTRO DE CUSTOS & DRE DO EVENTO
```

---

### 2. Entidades Principais de Domínio

1. **Fornecedor 360° (`Supplier`)**:
   - Cadastro corporativo único por produtor/plataforma.
   - Dados cadastrais, endereço e contatos.
   - Dados financeiros: Chave PIX, Banco, Agência, Conta Corrente, Favorecido.
   - Documentos regulatórios: CNDs (Federal, Estadual, Municipal, FGTS, Trabalhista) com controle de vencimento.
   - Histórico 360°: Total contratado, total pago, saldo a pagar, eventos atendidos e pontuação média.

2. **Categorias de Despesa para Eventos (Taxonomia)**:
   - 23 categorias especializadas: Produção, Artistas/Cachês, Palco, Som, Iluminação, LED, Geradores, Locação de Espaço, Segurança, Limpeza, Staff, Bilheteria, Credenciamento, Marketing, Agências, Influenciadores, Transporte, Hospedagem, Alimentação/Catering, Licenças/ECAD, Serviços Técnicos, Tecnologia, Outros.

3. **Solicitação de Compra (`PurchaseRequest`)**:
   - Identificação do evento, solicitante, centro de custo, justificativa, itens, data de necessidade e valor estimado.
   - Status auditáveis: `DRAFT` → `SUBMITTED` → `IN_QUOTATION` → `PENDING_APPROVAL` → `APPROVED` → `REJECTED` → `ORDERED` → `COMPLETED`.

4. **Cotação e Propostas (`Quotation` & `QuotationProposal`)**:
   - Registro de múltiplas propostas de fornecedores concorrentes (preço, prazo de entrega, condição de pagamento e histórico).
   - Seleção da proposta vencedora baseada em critérios técnicos ponderados (preço, pontualidade, histórico e capacidade operacional).

5. **Pedido de Compra (`PurchaseOrder`)**:
   - Numeração oficial `#PC-XXXXXX`.
   - Gera **comprometimento orçamentário** no centro de custos antes do pagamento efetivo (`Saldo Orçamentário = Orçamento - Realizado - Comprometido`).

6. **Contrato Formal (`Contract`) & Rateio entre Eventos**:
   - Numeração `#CT-XXXXXX`, vigência, objeto, parcelamento automático para o Contas a Pagar.
   - **Regra Rígida de Rateio**: Quando um contrato atende múltiplos eventos, o percentual alocado para cada evento deve somar **rigorosamente 100.00%**.

7. **Motor de Alçadas & Governança (Maker / Checker)**:
   - Quem solicita não pode aprovar (Maker / Checker obrigatório para valores sensíveis).
   - Bloqueio ou aprovação extraordinária quando uma contratação excede o orçamento do centro de custo.

8. **Conferência 3-Way Match**:
   - Triangulação: `Pedido de Compra × Recebimento/Medição × Nota Fiscal`.
   - Bloqueia liquidação financeira se houver divergência de valor, quantidade, fornecedor divergente ou documento duplicado.

9. **Central de Aprovações Unificada (`ApprovalInbox`)**:
   - Painel consolidador de pendências por gestor/diretoria (pendentes, urgentes, fora de orçamento, contratos, compras).

10. **Trilha de Auditoria Append-Only**:
    - Histórico imutável de todas as decisões, criações, aprovações, revisões e cancelamentos com `correlationId`.
