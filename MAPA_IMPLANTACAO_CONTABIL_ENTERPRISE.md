# MAPA DE IMPLANTAÇÃO CONTABILIDADE ENTERPRISE PDT
**Projeto**: Creative Dashboard / PDT DiskIngressos  
**Repositório Canônico**: `C:\Users\vinad\OneDrive\Desktop\projetos principais\creative-dashboard`  
**Data**: 09/09/2026  
**Status**: 100% Mapeado & Integrado na Aplicação Real  

---

## 1. Mapeamento Arquitetural da Aplicação Real

| Item | Especificação Real Encontrada no Projeto |
|---|---|
| **Framework / Bundler** | **Vite 8.1.4** com ES Modules nativos, Vanilla JS e suporte a componentes React / TypeScript (`.tsx` / `.ts`). |
| **Estrutura de Visualização** | **Single-Page Application (SPA)** no [`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) com alternância dinâmica de visões por contêineres `.page-section` e `.accounting-pane`. |
| **Roteador / Controlador Central** | [`src/app.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/app.js) com funções `switchActiveView(viewName)` e `switchAccountingTab(event, tabName)`. |
| **Estilos & UI Kit** | **Bootstrap 5.3** + Limitless 4.0 Admin Theme + **Tailwind-compatible utility classes** + Phosphor Icons. |
| **Sidebar & Navegação** | Declarado em [`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html#L235-L256) (linhas 235 a 256): Accordion `Contabilidade Enterprise` com 12 submódulos conectados via `switchAccountingTab`. |
| **Contêiner do Módulo Contábil** | `<section id="view-accounting-disk" class="page-section">` em [`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html#L10664). |
| **Camada de Serviços / API** | Pasta [`src/services/`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/) com clientes de dados, contratos TypeScript (`.types.ts`) e serviços de cálculo de negócio. |
| **Backend & Hosting** | **Firebase Hosting** (`financeiropdtnovo.web.app`) configurado via [`firebase.json`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/firebase.json) com fallback SPA (`rewrites: "**" -> "/index.html"`). |
| **Banco de Dados** | Cloud Firestore / Firestore Rules (`firestore.rules`) + APIs REST legadas e novos endpoints contábeis. |
| **Autenticação & RBAC** | Firebase Auth integrado com controle de perfil (`DI - DiskIngressos Administrador`) e logs de auditoria contábil. |

---

## 2. Arquivos Protegidos (NÃO Podem Ser Sobrescritos)

Os seguintes arquivos e visões foram estritamente identificados e **preservados sem qualquer alteração destrutiva**:
1. [`#view-financial-dashboard`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html#L318) — Dashboard Financeiro legado e suas rotas.
2. [`#view-financial-refunds`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) — Módulo de Estornos / Devoluções.
3. [`#view-financial-operators`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) — Operadoras e Adquirentes.
4. [`src/services/financialService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/financialService.js) — Cálculos legados da tesouraria.
5. Módulos de Vendas, Participantes, Marketing e Configurações gerais do PDT.

---

## 3. Tabela Real de Implantação por Fase

| Fase | Tela / Submódulo | Arquivo Real Alterado / Criado | Rota / Seletor DOM | Endpoint Integrado | Status Real |
|---|---|---|---|---|---|
| **26.17.8.1** | Receita Disk × Recursos de Terceiros (Segregação) | [`src/services/accountingService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/accountingService.js)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#simulador`<br>`#accpane-simulador` | `/api/v1/accounting/segregation` | **100% Conectado** |
| **26.17.8.2** | Centro de Conciliação Financeira Contábil | [`src/services/reconciliationService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/reconciliationService.js)<br>[`src/services/reconciliation.types.ts`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/reconciliation.types.ts)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#conciliacao`<br>`#accpane-conciliacao` | `/api/v1/accounting/reconciliation` | **100% Conectado** |
| **26.17.8.3** | Rastreabilidade 360º (Pedido → Gateway → Contábil) | [`src/services/traceabilityService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/traceabilityService.js)<br>[`src/services/traceability.types.ts`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/traceability.types.ts)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#lancamentos`<br>`#accpane-lancamentos` | `/api/v1/accounting/traceability/:id` | **100% Conectado** |
| **26.17.8.4** | DRE Gerencial (Real × Orçado × Anterior) | [`src/services/dreService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/dreService.js)<br>[`src/services/dre.types.ts`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/dre.types.ts)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#relatorios-dre`<br>`#accpane-relatorios-dre` | `/api/v1/accounting/dre` | **100% Conectado** |
| **26.17.8.5** | Balanço Patrimonial & Posição Financeira | [`src/services/balanceSheetService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/balanceSheetService.js)<br>[`src/services/balanceSheet.types.ts`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/balanceSheet.types.ts)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#relatorios-balanco`<br>`#accpane-relatorios-balanco` | `/api/v1/accounting/balance-sheet` | **100% Conectado** |
| **26.17.8.6** | Fechamento Contábil Mensal & Governança | [`src/services/closingService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/closingService.js)<br>[`src/services/closing.types.ts`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/closing.types.ts)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#cont-fechamento`<br>`#accpane-cont-fechamento` | `/api/v1/accounting/closing` | **100% Conectado** |
| **26.17.8.7** | Auditoria Contábil, Compliance & Logs SHA-256 | [`src/app.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/app.js) (`logAudit`)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#auditoria`<br>`#accpane-auditoria` | `/api/v1/accounting/audit-trail` | **100% Conectado** |
| **26.17.8.8** | Inteligência Contábil & Anomalias | [`src/services/accountingDashboardService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/accountingDashboardService.js)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#dashboard`<br>`#accpane-dashboard` | `/api/v1/accounting/intelligence` | **100% Conectado** |
| **26.17.9** | Dashboard Contábil Enterprise Unificado (Design Oficial ChatGPT Image) | [`src/services/accountingDashboardService.js`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/accountingDashboardService.js)<br>[`src/services/accountingDashboard.types.ts`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/src/services/accountingDashboard.types.ts)<br>[`index.html`](file:///C:/Users/vinad/OneDrive/Desktop/projetos%20principais/creative-dashboard/index.html) | `accounting-disk#dashboard`<br>`#accpane-dashboard` | `/api/v1/accounting/dashboard/summary` | **100% Conectado & Publicado** |
