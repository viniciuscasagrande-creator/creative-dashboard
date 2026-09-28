# Diretrizes do Projeto - Creative Dashboard

## Local Canônico de Salvamento
O diretório oficial e primário para salvar, atualizar e versionar este projeto é:
- **Caminho Informado**: `C:\Users\vinad\Desktop\projetos principais\creative-dashboard`
- **Caminho Físico Resolvido (Windows/OneDrive)**: `C:\Users\vinad\OneDrive\Desktop\projetos principais\creative-dashboard`

## Regras Obrigatórias para o Agente
1. **Sincronização / Salvamento Obrigatório**:
   - Qualquer alteração de código, novos recursos, refatorações, correções de bugs e builds (`dist/`) DEVEM ser salvos diretamente ou espelhados/sincronizados imediatamente com o diretório:
     `C:\Users\vinad\OneDrive\Desktop\projetos principais\creative-dashboard`
2. **Consistência de Versão e Git**:
   - Manter os commits e o working tree do repositório canônico sempre íntegros e atualizados.
3. **Execução no Windows**:
   - Executar comandos NPM/Node com `cmd /c` para compatibilidade com o PowerShell do ambiente.

## Diretrizes Arquiteturais do Módulo Financeiro
1. **Linha Central — O Fluxo do Dinheiro**:
   - O Financeiro é estruturado pelo *fluxo real do dinheiro*, e jamais por acúmulo de funcionalidades soltas.
2. **Jornada do Produtor**:
   - `Todos os Eventos → Evento Individual → Saldo → Operações → Solicitações → Acompanhamento`.
3. **Jornada do Disk Interno**:
   - `Posição Financeira Geral → Saldos → Taxas e Custos → Solicitações → Operações → Tesouraria → Conciliação → Controle / Auditoria`.
4. **Três Separações Invioláveis**:
   - **Venda NÃO é saldo** (GMV transacionado passa por deduções de taxas, custos e retenções antes de virar saldo).
   - **Dinheiro do produtor NÃO é receita da Disk** (é passivo circulante de custódia transitória).
   - **Taxa administrativa Disk NÃO é custo de cartão/gateway** (comissão da plataforma $\neq$ MDR e tarifas de adquirentes).
5. **Rastreabilidade e Verdade Única**:
   - Todo número na interface deve ter rastreabilidade exata do consolidado master até o evento específico, derivado exclusivamente do **Ledger Contábil / Core Financeiro**.
