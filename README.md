# 🎭 DiskIngressos Pro Dashboard - Gestão & Inteligência Financeira

Este projeto consiste em um dashboard SPA (Single Page Application) moderno e de alta performance voltado à gestão de eventos e operações financeiras da DiskIngressos. Ele consolida informações sobre vendas de ingressos, comissões de PDVs, conciliação bancária, fluxos de adiantamento (Advanced) e taxas operacionais de gateways de pagamento.

---

## 📁 Estrutura de Diretórios Ajustada

O projeto foi reestruturado de forma modular e escalável, organizando os arquivos por suas respectivas responsabilidades de domínio:

```
creative-dashboard/
├── dist/                     # Bundle compilado final para produção
├── public/                   # Recursos estáticos servidos diretamente (ícones, imagens)
├── limitless_assets/         # Folhas de estilo e componentes JS do template base
├── src/                      # Código-fonte da aplicação
│   ├── app.js                # Arquivo principal e roteador SPA
│   ├── styles.css            # Estilos personalizados premium e animações
│   ├── components/           # Componentes modulares reutilizáveis
│   │   └── ui.js             # Gerador de Cards, Tabelas, Modais e Gráficos
│   ├── services/             # Lógica de integração e microsserviços
│   │   └── firebase/         # Módulos de banco de dados e sincronização
│   │       ├── config.js     # Inicializador do Firebase App
│   │       ├── firestore.js  # Lógica de escuta e escrita no Firestore
│   │       ├── auth.js       # Módulo reservado para autenticação
│   │       ├── storage.js    # Módulo reservado para upload de arquivos
│   │       └── index.js      # Ponto de entrada unificado do Firebase
│   ├── pages/                # Estruturas reservadas para views completas do SPA
│   ├── utils/                # Funções utilitárias e formatadores
│   └── config/               # Arquivos locais de constantes e chaves de ambiente
├── tests/                    # Suítes de teste categorizadas por domínio
│   ├── financeiro/           # Testes de negociações financeiras, saldos e repasses
│   ├── gateway/              # Validação de cadastro e gerenciamento de Gateways
│   ├── operadores/           # Testes de adição de operadores e caixas físicos
│   ├── site/                 # Testes de disponibilidade e links de produção
│   └── console/              # Auditoria de logs, erros de console e estruturas HTML
├── .env                      # Variáveis de ambiente secretas (Firebase API keys, etc.)
├── firebase.json             # Regras de hospedagem, headers de cache e roteamento
├── vite.config.js            # Configuração de compilação do Vite
└── package.json              # Script e manifesto de dependências do Node.js
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2. Instalação de Dependências
Instale os pacotes e dependências de desenvolvimento do projeto:
```bash
npm install
```

### 3. Configurando as Credenciais (Opcional)
Se desejar integrar a aplicação com um banco de dados real no Firestore, crie um arquivo `.env` na raiz do projeto com a seguinte estrutura e adicione suas credenciais do Firebase:
```properties
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain_aqui
VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui
```

### 4. Iniciando o Servidor de Desenvolvimento
Inicie o servidor local em modo de desenvolvimento (com HMR - recarregamento rápido em tempo real):
```bash
npm run dev
```
O console exibirá o endereço local (geralmente `http://localhost:5173/`) para acesso.

---

## 🧪 Como Executar as Suítes de Teste

Todos os testes utilizam JSDOM para validar e auditar a interface, os cálculos matemáticos e a integridade de roteamento sem a necessidade de abrir um navegador manual.

Para rodar qualquer teste, utilize o comando `node` apontando para o arquivo desejado. Exemplos:

* **Negociações Financeiras & Cálculos de Juros**:
  ```bash
  node tests/financeiro/test_negociacoes_financeiro.js
  ```
* **Fluxo de Adição de Operadores & PDVs**:
  ```bash
  node tests/operadores/test_add_new_pdv_completo.js
  ```
* **Validação de Guias de Gateways de Pagamento**:
  ```bash
  node tests/gateway/test_gateway_tabs.js
  ```

---

## 📦 Como Publicar o Projeto (Build & Deploy)

O projeto é compilado de forma otimizada via Vite e hospedado de forma segura no Firebase Hosting.

### 1. Compilação (Vite Build)
Gere os arquivos estáticos minificados e otimizados dentro da pasta `dist/`:
```bash
npm run build
```

### 2. Visualização Local da Produção
Para inspecionar localmente como o build compilado se comportará antes de enviar para a nuvem:
```bash
npm run preview
```

### 3. Deploy no Firebase Hosting
Envie os arquivos atualizados diretamente para o ambiente de produção:
```bash
npx firebase deploy --only hosting
```
Ao final do deploy, o Firebase exibirá a URL oficial do painel (ex: `https://financeiropdtnovo.web.app`).

> [!IMPORTANT]
> **Políticas de Cache-Busting no Firebase**: 
> A configuração do `firebase.json` está definida com `"Cache-Control": "no-cache, no-store, must-revalidate"`. Isso garante que sempre que você implantar uma nova versão, os usuários baixarão o HTML mais recente sem precisarem limpar o cache do navegador de forma manual.
