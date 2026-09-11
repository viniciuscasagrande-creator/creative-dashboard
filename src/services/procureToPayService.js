/**
 * Fase 26.17.9.4.5 — Motor Procure-to-Pay do SafeSaff / PDT
 * Central de Fornecedores, Compras, Cotações, Pedidos de Compra,
 * Contratos, Rateio entre Eventos, Alçadas, Maker/Checker, 3-Way Match e Auditoria.
 */

import { eventBalanceService } from './eventBalanceService.js';

// 23 Categorias especializadas em eventos (Taxonomia de Eventos)
export const EVENT_PROCUREMENT_CATEGORIES = [
  'Produção Geral',
  'Artistas e Atrações',
  'Palco e Estrutura',
  'Sonorização (PA/Delay)',
  'Iluminação Cênica',
  'Painéis de LED',
  'Geradores e Energia',
  'Locação de Espaço / Venue',
  'Segurança e Vigilância',
  'Limpeza e Conservação',
  'Staff e Apoio Operacional',
  'Bilheteria e Controle de Acesso',
  'Credenciamento',
  'Marketing e Mídia',
  'Agências e Assessoria',
  'Influenciadores e Criadores',
  'Transporte e Logística',
  'Hospedagem e Hotelaria',
  'Alimentação e Catering',
  'Licenças, Alvarás e ECAD',
  'Serviços Técnicos Especializados',
  'Tecnologia e Redes',
  'Outros Custos Operacionais'
];

export const INITIAL_COST_CENTERS = [
  { id: 'cc-prod-01', producerId: 'prod-1', code: '1.01', name: 'Produção Artística e Cachês', category: 'Artistas e Atrações', active: true },
  { id: 'cc-prod-02', producerId: 'prod-1', code: '1.02', name: 'Estrutura, Som e Luz', category: 'Palco e Estrutura', active: true },
  { id: 'cc-prod-03', producerId: 'prod-1', code: '1.03', name: 'Segurança e Brigada', category: 'Segurança e Vigilância', active: true },
  { id: 'cc-prod-04', producerId: 'prod-1', code: '1.04', name: 'Marketing e Publicidade', category: 'Marketing e Mídia', active: true },
  { id: 'cc-prod-05', producerId: 'prod-1', code: '1.05', name: 'Alvarás, Taxas e ECAD', category: 'Licenças, Alvarás e ECAD', active: true },
  
  { id: 'cc-cwb-01', producerId: 'prod-2', code: '2.01', name: 'Cachês Artísticos CWB', category: 'Artistas e Atrações', active: true },
  { id: 'cc-cwb-02', producerId: 'prod-2', code: '2.02', name: 'Infraestrutura e Palco Principal', category: 'Palco e Estrutura', active: true },
  { id: 'cc-cwb-03', producerId: 'prod-2', code: '2.03', name: 'Comunicação e Mídia CWB', category: 'Marketing e Mídia', active: true }
];

export const INITIAL_EVENT_BUDGETS = [
  { id: 'bud-3368-02', producerId: 'prod-1', eventId: '3368', costCenterId: 'cc-prod-02', costCenterName: 'Estrutura, Som e Luz', plannedAmount: 25000.00, realizedAmount: 6000.00, committedAmount: 4000.00, availableAmount: 15000.00, allowOverbudget: false },
  { id: 'bud-3368-04', producerId: 'prod-1', eventId: '3368', costCenterId: 'cc-prod-04', costCenterName: 'Marketing e Publicidade', plannedAmount: 15000.00, realizedAmount: 5000.00, committedAmount: 2000.00, availableAmount: 8000.00, allowOverbudget: false },
  { id: 'bud-3042-02', producerId: 'prod-2', eventId: '3042', costCenterId: 'cc-cwb-02', costCenterName: 'Infraestrutura e Palco Principal', plannedAmount: 50000.00, realizedAmount: 15000.00, committedAmount: 10000.00, availableAmount: 25000.00, allowOverbudget: false },
  { id: 'bud-3178-03', producerId: 'prod-1', eventId: '3178', costCenterId: 'cc-prod-03', costCenterName: 'Segurança e Brigada', plannedAmount: 8000.00, realizedAmount: 2000.00, committedAmount: 1000.00, availableAmount: 5000.00, allowOverbudget: false }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'SUP-001',
    producerId: 'prod-1',
    legalName: 'Lumina Som & Iluminação Profissional Ltda',
    tradeName: 'Lumina Event Pro',
    taxId: '18.234.567/0001-89',
    taxIdType: 'CNPJ',
    status: 'HOMOLOGADO',
    primaryCategory: 'Iluminação Cênica',
    contactName: 'Carlos Eduardo Bastos',
    contactEmail: 'comercial@luminaeventpro.com.br',
    contactPhone: '(41) 99881-2233',
    address: {
      street: 'Rua Marechal Deodoro',
      number: '1500',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
      zipCode: '80060-010'
    },
    bankAccount: {
      pixKeyType: 'CNPJ',
      pixKey: '18234567000189',
      bankCode: '001',
      bankName: 'Banco do Brasil',
      agency: '1502-4',
      account: '28490-1',
      accountType: 'CORRENTE',
      beneficiaryName: 'Lumina Som & Iluminação Profissional Ltda',
      beneficiaryTaxId: '18.234.567/0001-89'
    },
    documents: [
      { id: 'DOC-001', type: 'CND_FEDERAL', title: 'Certidão Negativa de Débitos Federais', documentNumber: 'CND-FED-2026-99', issuedAt: '2026-08-01T00:00:00.000Z', expiresAt: '2027-02-01T00:00:00.000Z', status: 'VALIDO' },
      { id: 'DOC-002', type: 'CND_ESTADUAL', title: 'CND Estadual Paraná', documentNumber: 'PR-CND-4821', issuedAt: '2026-07-15T00:00:00.000Z', expiresAt: '2027-01-15T00:00:00.000Z', status: 'VALIDO' },
      { id: 'DOC-003', type: 'CND_FGTS', title: 'Certificado de Regularidade FGTS (CRF)', documentNumber: 'CRF-8829-10', issuedAt: '2026-08-10T00:00:00.000Z', expiresAt: '2026-11-10T00:00:00.000Z', status: 'VALIDO' }
    ],
    performance: {
      deliveryTimelinessScore: 4.9,
      qualityScore: 4.8,
      communicationScore: 4.7,
      averageRating: 4.8,
      totalContractsCompleted: 14,
      openOccurrences: 0
    },
    financialMetrics: {
      totalContracted: 148000.00,
      totalPaid: 112000.00,
      totalPending: 36000.00,
      servedEventsCount: 5
    },
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-09-01T14:00:00.000Z'
  },
  {
    id: 'SUP-002',
    producerId: 'prod-1',
    legalName: 'MegaPower Geradores e Soluções Energéticas SA',
    tradeName: 'MegaPower Geradores',
    taxId: '23.456.789/0001-12',
    taxIdType: 'CNPJ',
    status: 'HOMOLOGADO',
    primaryCategory: 'Geradores e Energia',
    contactName: 'Fernanda Valente',
    contactEmail: 'locacoes@megapower.com.br',
    contactPhone: '(41) 99123-4567',
    address: {
      street: 'Av. das Indústrias',
      number: '420',
      neighborhood: 'CIC',
      city: 'Curitiba',
      state: 'PR',
      zipCode: '81350-010'
    },
    bankAccount: {
      pixKeyType: 'CNPJ',
      pixKey: '23456789000112',
      bankCode: '341',
      bankName: 'Banco Itaú Unibanco',
      agency: '0340',
      account: '55610-8',
      accountType: 'CORRENTE',
      beneficiaryName: 'MegaPower Geradores e Soluções Energéticas SA',
      beneficiaryTaxId: '23.456.789/0001-12'
    },
    documents: [
      { id: 'DOC-004', type: 'CND_FEDERAL', title: 'CND Federal MegaPower', documentNumber: 'FED-22019', issuedAt: '2026-08-01T00:00:00.000Z', expiresAt: '2027-02-01T00:00:00.000Z', status: 'VALIDO' }
    ],
    performance: {
      deliveryTimelinessScore: 5.0,
      qualityScore: 4.9,
      communicationScore: 4.8,
      averageRating: 4.9,
      totalContractsCompleted: 22,
      openOccurrences: 0
    },
    financialMetrics: {
      totalContracted: 85000.00,
      totalPaid: 85000.00,
      totalPending: 0.00,
      servedEventsCount: 8
    },
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-09-02T11:00:00.000Z'
  },
  {
    id: 'SUP-003',
    producerId: 'prod-1',
    legalName: 'Vigilância Forte Guarda Patrimonial Eireli',
    tradeName: 'Forte Segurança',
    taxId: '09.876.543/0001-44',
    taxIdType: 'CNPJ',
    status: 'HOMOLOGADO',
    primaryCategory: 'Segurança e Vigilância',
    contactName: 'Tenente Marcos Silva',
    contactEmail: 'operacoes@forteseguranca.com.br',
    contactPhone: '(41) 98765-4321',
    address: {
      street: 'Rua Brigadeiro Franco',
      number: '2100',
      neighborhood: 'Rebouças',
      city: 'Curitiba',
      state: 'PR',
      zipCode: '80230-000'
    },
    bankAccount: {
      pixKeyType: 'CNPJ',
      pixKey: '09876543000144',
      bankCode: '104',
      bankName: 'Caixa Econômica Federal',
      agency: '0375',
      account: '1290-0',
      accountType: 'CORRENTE',
      beneficiaryName: 'Vigilância Forte Guarda Patrimonial Eireli',
      beneficiaryTaxId: '09.876.543/0001-44'
    },
    documents: [
      { id: 'DOC-005', type: 'CND_FEDERAL', title: 'CND Federal Forte', documentNumber: 'FED-9931', issuedAt: '2026-06-01T00:00:00.000Z', expiresAt: '2026-12-01T00:00:00.000Z', status: 'VALIDO' },
      { id: 'DOC-006', type: 'CND_TRABALHISTA', title: 'Certidão Negativa de Débitos Trabalhistas (CNDT)', documentNumber: 'CNDT-1029', issuedAt: '2026-08-01T00:00:00.000Z', expiresAt: '2027-01-25T00:00:00.000Z', status: 'VALIDO' }
    ],
    performance: {
      deliveryTimelinessScore: 4.5,
      qualityScore: 4.6,
      communicationScore: 4.5,
      averageRating: 4.5,
      totalContractsCompleted: 9,
      openOccurrences: 1
    },
    financialMetrics: {
      totalContracted: 42000.00,
      totalPaid: 32000.00,
      totalPending: 10000.00,
      servedEventsCount: 4
    },
    createdAt: '2026-03-01T14:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'SUP-004',
    producerId: 'prod-1',
    legalName: 'StarCatering Alimentos e Serviços Especiais Ltda',
    tradeName: 'Star Catering Eventos',
    taxId: '31.122.334/0001-55',
    taxIdType: 'CNPJ',
    status: 'PENDENTE_DOCS', // Documentação pendente/vencida para testes de governança
    primaryCategory: 'Alimentação e Catering',
    contactName: 'Luciana Pinheiro',
    contactEmail: 'luciana@starcatering.com.br',
    contactPhone: '(41) 99777-8899',
    address: {
      street: 'Rua Comendador Araújo',
      number: '800',
      neighborhood: 'Batel',
      city: 'Curitiba',
      state: 'PR',
      zipCode: '80420-000'
    },
    bankAccount: {
      pixKeyType: 'CNPJ',
      pixKey: '31122334000155',
      bankCode: '033',
      bankName: 'Banco Santander Brasil',
      agency: '3020',
      account: '1300994-2',
      accountType: 'CORRENTE',
      beneficiaryName: 'StarCatering Alimentos e Serviços Especiais Ltda',
      beneficiaryTaxId: '31.122.334/0001-55'
    },
    documents: [
      { id: 'DOC-007', type: 'CND_FEDERAL', title: 'CND Federal Vencida', documentNumber: 'FED-OLD-2025', issuedAt: '2025-01-01T00:00:00.000Z', expiresAt: '2025-07-01T00:00:00.000Z', status: 'EXPIRADO' }
    ],
    performance: {
      deliveryTimelinessScore: 4.1,
      qualityScore: 4.3,
      communicationScore: 4.0,
      averageRating: 4.1,
      totalContractsCompleted: 5,
      openOccurrences: 2
    },
    financialMetrics: {
      totalContracted: 24000.00,
      totalPaid: 24000.00,
      totalPending: 0.00,
      servedEventsCount: 3
    },
    createdAt: '2026-04-10T11:00:00.000Z',
    updatedAt: '2026-08-15T16:00:00.000Z'
  }
];

export const INITIAL_PURCHASE_REQUESTS = [
  {
    id: 'PR-0001',
    producerId: 'prod-1',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    requesterId: 'usr-oper-1',
    requesterName: 'Matheus Brandão (Produtor de Campo)',
    requesterRole: 'OPERADOR_EVENTO',
    costCenterId: 'cc-prod-02',
    costCenterName: 'Estrutura, Som e Luz',
    description: 'Locação complementar de iluminação cênica e ribaltas para palco natureza',
    urgency: 'ALTA',
    neededUntil: '2026-09-20',
    justification: 'Exigência do rider técnico do artista principal para a gravação do clipe ao vivo.',
    items: [
      { id: 'IT-01', description: 'Ribaltas LED RGBW 18x12W Outdoor', category: 'Iluminação Cênica', quantity: 12, unit: 'UN', estimatedUnitPrice: 250.00, estimatedTotalPrice: 3000.00 },
      { id: 'IT-02', description: 'Moving Head Beam 350W 17R', category: 'Iluminação Cênica', quantity: 8, unit: 'UN', estimatedUnitPrice: 450.00, estimatedTotalPrice: 3600.00 }
    ],
    estimatedTotalAmount: 6600.00,
    status: 'APPROVED',
    currentApprovalStep: 'CONCLUIDO',
    quotationId: 'QUOTE-0001',
    purchaseOrderId: 'PC-000101',
    createdAt: '2026-09-02T10:30:00.000Z',
    updatedAt: '2026-09-04T15:00:00.000Z'
  },
  {
    id: 'PR-0002',
    producerId: 'prod-1',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    requesterId: 'usr-oper-2',
    requesterName: 'Juliana Costa (Marketing)',
    requesterRole: 'ANALISTA_MARKETING',
    costCenterId: 'cc-prod-04',
    costCenterName: 'Marketing e Publicidade',
    description: 'Contratação de painel de fotos cenográfico e backdrop iluminado para ativação de patrocinadores',
    urgency: 'MEDIA',
    neededUntil: '2026-09-25',
    justification: 'Entrega obrigatória de cota de patrocínio firmada com a marca de cerveja oficial.',
    items: [
      { id: 'IT-03', description: 'Backdrop Cenográfico 6x3m com estrutura modular box truss', category: 'Marketing e Mídia', quantity: 1, unit: 'UN', estimatedUnitPrice: 4200.00, estimatedTotalPrice: 4200.00 }
    ],
    estimatedTotalAmount: 4200.00,
    status: 'IN_QUOTATION',
    currentApprovalStep: 'COTAÇÃO_COMPRAS',
    quotationId: 'QUOTE-0002',
    createdAt: '2026-09-08T09:00:00.000Z',
    updatedAt: '2026-09-09T11:00:00.000Z'
  },
  {
    id: 'PR-0003',
    producerId: 'prod-1',
    eventId: '3178',
    eventName: 'Feijoada e Costela assada - PETFRIENDLY',
    requesterId: 'usr-oper-1',
    requesterName: 'Matheus Brandão (Produtor de Campo)',
    requesterRole: 'OPERADOR_EVENTO',
    costCenterId: 'cc-prod-03',
    costCenterName: 'Segurança e Brigada',
    description: 'Contratação de brigada de bombeiros civis e enfermaria com ambulância UTI',
    urgency: 'ALTA',
    neededUntil: '2026-09-28',
    justification: 'Norma de segurança do Corpo de Bombeiros Militar para eventos acima de 1.000 pessoas.',
    items: [
      { id: 'IT-04', description: 'Diária Brigadista Bombeiro Civil (escala 12h)', category: 'Segurança e Vigilância', quantity: 4, unit: 'DIARIA', estimatedUnitPrice: 350.00, estimatedTotalPrice: 1400.00 },
      { id: 'IT-05', description: 'Diária Ambulância com Médico e Enfermeiro UTI', category: 'Segurança e Vigilância', quantity: 1, unit: 'DIARIA', estimatedUnitPrice: 2800.00, estimatedTotalPrice: 2800.00 }
    ],
    estimatedTotalAmount: 4200.00,
    status: 'PENDING_APPROVAL',
    currentApprovalStep: 'GESTOR_EVENTO',
    createdAt: '2026-09-10T14:20:00.000Z',
    updatedAt: '2026-09-10T14:20:00.000Z'
  }
];

export const INITIAL_QUOTATIONS = [
  {
    id: 'QUOTE-0001',
    purchaseRequestId: 'PR-0001',
    producerId: 'prod-1',
    eventId: '3368',
    costCenterId: 'cc-prod-02',
    status: 'FINALIZADA',
    proposals: [
      { id: 'PROP-01', supplierId: 'SUP-001', supplierName: 'Lumina Som & Iluminação Profissional Ltda', totalAmount: 6400.00, deliveryDays: 2, paymentConditions: '30 dias líquido via PIX', score: 95, notes: 'Equipamentos de rider homologados, equipe técnica própria inclusa.', status: 'VENCEDORA' },
      { id: 'PROP-02', supplierId: 'SUP-002', supplierName: 'StageCorp Iluminação Eireli', totalAmount: 6100.00, deliveryDays: 5, paymentConditions: 'À vista 50% / 50% entrega', score: 82, notes: 'Menor preço total, porém prazo de entrega mais longo e exigência de adiantamento.', status: 'RECUSADA' }
    ],
    selectedProposalId: 'PROP-01',
    buyerJustification: 'Selecionada proposta da Lumina Pro pelo histórico de confiabilidade técnica no evento, equipamentos de primeira linha e prazo de montagem com folga operacional de 48 horas.',
    buyerName: 'Rogério Medeiros (Comprador Sênior)',
    selectedAt: '2026-09-03T14:00:00.000Z',
    createdAt: '2026-09-02T11:00:00.000Z',
    updatedAt: '2026-09-03T14:00:00.000Z'
  }
];

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'PC-000101',
    purchaseRequestId: 'PR-0001',
    producerId: 'prod-1',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    costCenterId: 'cc-prod-02',
    costCenterName: 'Estrutura, Som e Luz',
    supplierId: 'SUP-001',
    supplierName: 'Lumina Som & Iluminação Profissional Ltda',
    supplierTaxId: '18.234.567/0001-89',
    items: [
      { id: 'PO-IT-01', description: 'Ribaltas LED RGBW 18x12W Outdoor', quantity: 12, unitPrice: 240.00, totalPrice: 2880.00 },
      { id: 'PO-IT-02', description: 'Moving Head Beam 350W 17R', quantity: 8, unitPrice: 440.00, totalPrice: 3520.00 }
    ],
    totalAmount: 6400.00,
    paymentTerms: '30 dias líquido via PIX após conferência da NF',
    installmentsCount: 1,
    estimatedDeliveryDate: '2026-09-18',
    requesterName: 'Matheus Brandão',
    buyerName: 'Rogério Medeiros',
    approvers: ['Gerência Financeira', 'Diretoria de Operações'],
    status: 'APPROVED',
    isBudgetCommitted: true, // Bloqueia saldo no orçamento
    createdAt: '2026-09-03T16:00:00.000Z',
    updatedAt: '2026-09-04T09:00:00.000Z'
  }
];

export const INITIAL_CONTRACTS = [
  {
    id: 'CT-0001',
    contractNumber: 'CT-2026-0042',
    producerId: 'prod-1',
    supplierId: 'SUP-001',
    supplierName: 'Lumina Som & Iluminação Profissional Ltda',
    supplierTaxId: '18.234.567/0001-89',
    objectDescription: 'Prestação de serviços contínuos de locação de sonorização e iluminação cênica para os eventos da temporada de Julho a Outubro de 2026.',
    costCenterId: 'cc-prod-02',
    costCenterName: 'Estrutura, Som e Luz',
    totalAmount: 36000.00,
    startDate: '2026-07-01',
    endDate: '2026-10-31',
    paymentMethod: 'PIX',
    installments: [
      { installmentNumber: 1, totalInstallments: 3, dueDate: '2026-08-10', amount: 12000.00, status: 'PAGO', financialPayableId: 'PAY-001' },
      { installmentNumber: 2, totalInstallments: 3, dueDate: '2026-09-15', amount: 12000.00, status: 'EM_ABERTO', financialPayableId: 'PAY-002' },
      { installmentNumber: 3, totalInstallments: 3, dueDate: '2026-10-15', amount: 12000.00, status: 'PREVISTO', financialPayableId: 'PAY-003' }
    ],
    allocations: [
      { eventId: '3368', eventName: 'Experiencia Música e Natureza - Julho', percentage: 50.00, allocatedAmount: 18000.00, costCenterId: 'cc-prod-02' },
      { eventId: '3195', eventName: '9º Knife Show Curitiba - Feira de Facas', percentage: 30.00, allocatedAmount: 10800.00, costCenterId: 'cc-prod-02' },
      { eventId: '3178', eventName: 'Feijoada e Costela assada - PETFRIENDLY', percentage: 20.00, allocatedAmount: 7200.00, costCenterId: 'cc-prod-02' }
    ],
    adjustmentClause: 'Reajuste anual pelo IPCA em caso de prorrogação',
    autoRenew: false,
    responsibleUser: 'Vinicius Casagrande (Diretor Geral)',
    approvers: ['Vinicius Casagrande', 'Controladoria DiskIngressos'],
    digitalSignatureStatus: 'ASSINADO',
    status: 'ACTIVE',
    createdAt: '2026-06-25T14:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z'
  }
];

export const INITIAL_APPROVAL_POLICIES = [
  {
    id: 'POL-P2P-GLOBAL',
    name: 'Política Global de Alçadas Procure-to-Pay',
    scope: 'GLOBAL',
    targetId: null,
    maxAmountSingleApprover: 5000.00,  // Até 5k: 1 aprovação (Gestor do Evento)
    maxAmountTwoApprovers: 25000.00,   // De 5k a 25k: 2 aprovações (Gestor + Financeiro)
    requireDirectorAbove: 25000.00,    // Acima de 25k: Diretoria obrigatória
    enforceMakerChecker: true,         // Quem cria NUNCA pode aprovar
    blockOverbudgetRequests: false,    // Se estourar orçamento, permite com alçada extraordinária
    active: true
  }
];

export const INITIAL_APPROVAL_INBOX = [
  {
    id: 'APP-0001',
    entityType: 'PURCHASE_REQUEST',
    entityId: 'PR-0003',
    producerId: 'prod-1',
    eventId: '3178',
    eventName: 'Feijoada e Costela assada - PETFRIENDLY',
    supplierName: 'Forte Segurança',
    costCenterName: 'Segurança e Brigada',
    requesterName: 'Matheus Brandão',
    amount: 4200.00,
    requestedAt: '2026-09-10T14:20:00.000Z',
    priority: 'URGENTE',
    isOverbudget: false,
    budgetStatusText: 'Dentro do orçamento (Disponível R$ 5.000,00)',
    status: 'PENDING',
    requiredLevel: 'GESTOR_EVENTO',
    justification: 'Brigada de incêndio mandatória por alvará de funcionamento da PMPR.'
  },
  {
    id: 'APP-0002',
    entityType: 'PAYABLE',
    entityId: 'PAY-002',
    producerId: 'prod-1',
    eventId: '3368',
    eventName: 'Experiencia Música e Natureza - Julho',
    supplierName: 'Lumina Som & Iluminação Profissional Ltda',
    costCenterName: 'Estrutura, Som e Luz',
    requesterName: 'Contabilidade Disk',
    amount: 12000.00,
    requestedAt: '2026-09-11T08:00:00.000Z',
    priority: 'NORMAL',
    isOverbudget: false,
    budgetStatusText: 'Parcela 2 de 3 do Contrato CT-2026-0042',
    status: 'PENDING',
    requiredLevel: 'FINANCEIRO',
    justification: 'Vencimento em 15/09/2026. NF conferida e vinculada.'
  }
];

export const INITIAL_PAYABLES = [
  {
    id: 'PAY-001',
    producerId: 'prod-1',
    eventId: '3368',
    supplierId: 'SUP-001',
    supplierName: 'Lumina Som & Iluminação Profissional Ltda',
    contractId: 'CT-0001',
    costCenterId: 'cc-prod-02',
    installmentNumber: 1,
    totalInstallments: 3,
    dueDate: '2026-08-10',
    amount: 12000.00,
    status: 'PAGO',
    pixKey: '18234567000189',
    threeWayMatchCleared: true,
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'PAY-002',
    producerId: 'prod-1',
    eventId: '3368',
    supplierId: 'SUP-001',
    supplierName: 'Lumina Som & Iluminação Profissional Ltda',
    contractId: 'CT-0001',
    costCenterId: 'cc-prod-02',
    installmentNumber: 2,
    totalInstallments: 3,
    dueDate: '2026-09-15',
    amount: 12000.00,
    status: 'AGUARDANDO_APROVACAO',
    pixKey: '18234567000189',
    threeWayMatchCleared: true,
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'PAY-003',
    producerId: 'prod-1',
    eventId: '3368',
    supplierId: 'SUP-001',
    supplierName: 'Lumina Som & Iluminação Profissional Ltda',
    contractId: 'CT-0001',
    costCenterId: 'cc-prod-02',
    installmentNumber: 3,
    totalInstallments: 3,
    dueDate: '2026-10-15',
    amount: 12000.00,
    status: 'AGUARDANDO_APROVACAO',
    pixKey: '18234567000189',
    threeWayMatchCleared: false,
    createdAt: '2026-07-01T08:00:00.000Z'
  }
];

// Estado Reativo Local Imutável
let LOCAL_SUPPLIERS = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
let LOCAL_PURCHASE_REQUESTS = JSON.parse(JSON.stringify(INITIAL_PURCHASE_REQUESTS));
let LOCAL_QUOTATIONS = JSON.parse(JSON.stringify(INITIAL_QUOTATIONS));
let LOCAL_PURCHASE_ORDERS = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
let LOCAL_CONTRACTS = JSON.parse(JSON.stringify(INITIAL_CONTRACTS));
let LOCAL_COST_CENTERS = JSON.parse(JSON.stringify(INITIAL_COST_CENTERS));
let LOCAL_EVENT_BUDGETS = JSON.parse(JSON.stringify(INITIAL_EVENT_BUDGETS));
let LOCAL_APPROVAL_POLICIES = JSON.parse(JSON.stringify(INITIAL_APPROVAL_POLICIES));
let LOCAL_APPROVAL_INBOX = JSON.parse(JSON.stringify(INITIAL_APPROVAL_INBOX));
let LOCAL_PAYABLES = JSON.parse(JSON.stringify(INITIAL_PAYABLES));
let LOCAL_PROCURE_AUDIT = [];

function generateCorrelationId(prefix = 'P2P') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

function logProcureAudit({ correlationId, actor, entityType, entityId, action, summary, details = {} }) {
  const entry = {
    id: `AUD-P2P-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    correlationId: correlationId || generateCorrelationId(),
    timestamp: new Date().toISOString(),
    actor: actor || { id: 'usr-sys', name: 'Sistema SafeSaff', role: 'SISTEMA' },
    entityType,
    entityId,
    action,
    summary,
    details: JSON.parse(JSON.stringify(details))
  };
  LOCAL_PROCURE_AUDIT.unshift(entry);
  return entry;
}

export const procureToPayService = {
  // =========================================================================
  // 1. FORNECEDORES & FORNECEDOR 360°
  // =========================================================================
  async getSuppliers({ producerId = 'prod-1', search = '', category = '', status = '' } = {}) {
    let list = LOCAL_SUPPLIERS.filter(s => !producerId || s.producerId === producerId || s.producerId === 'PLATFORM');
    if (category) {
      list = list.filter(s => s.primaryCategory === category);
    }
    if (status) {
      list = list.filter(s => s.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.legalName.toLowerCase().includes(q) ||
        s.tradeName.toLowerCase().includes(q) ||
        s.taxId.includes(q) ||
        s.contactName.toLowerCase().includes(q)
      );
    }
    return { ok: true, data: list };
  },

  async getSupplierById(id) {
    const s = LOCAL_SUPPLIERS.find(item => item.id === id);
    if (!s) return { ok: false, error: 'Fornecedor não localizado.' };

    // Enriquece com contratos e contas a pagar em tempo real (Visão 360°)
    const contracts = LOCAL_CONTRACTS.filter(c => c.supplierId === id);
    const orders = LOCAL_PURCHASE_ORDERS.filter(o => o.supplierId === id);
    const payables = LOCAL_PAYABLES.filter(p => p.supplierId === id);

    const totalContracted = contracts.reduce((acc, c) => acc + c.totalAmount, 0) +
      orders.filter(o => !o.contractId).reduce((acc, o) => acc + o.totalAmount, 0);
    const totalPaid = payables.filter(p => p.status === 'PAGO').reduce((acc, p) => acc + p.amount, 0);
    const totalPending = payables.filter(p => p.status !== 'PAGO').reduce((acc, p) => acc + p.amount, 0);

    const view360 = {
      ...s,
      relatedContracts: contracts,
      relatedPurchaseOrders: orders,
      relatedPayables: payables,
      financialMetrics: {
        totalContracted,
        totalPaid,
        totalPending,
        servedEventsCount: new Set(orders.map(o => o.eventId)).size
      }
    };

    return { ok: true, data: view360 };
  },

  async createSupplier(data, actor) {
    if (!data.legalName || !data.taxId) {
      throw new Error('Razão Social e CNPJ/CPF são campos obrigatórios.');
    }
    const cleanTaxId = data.taxId.replace(/\D/g, '');
    const exists = LOCAL_SUPPLIERS.find(s => s.taxId.replace(/\D/g, '') === cleanTaxId);
    if (exists) {
      throw new Error(`Fornecedor já cadastrado com o documento ${data.taxId}.`);
    }

    const id = `SUP-${String(LOCAL_SUPPLIERS.length + 1).padStart(3, '0')}`;
    const newSupplier = {
      id,
      producerId: data.producerId || 'prod-1',
      legalName: data.legalName,
      tradeName: data.tradeName || data.legalName,
      taxId: data.taxId,
      taxIdType: cleanTaxId.length > 11 ? 'CNPJ' : 'CPF',
      status: data.status || 'ATIVO',
      primaryCategory: data.primaryCategory || 'Produção Geral',
      contactName: data.contactName || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      address: data.address || { street: '', number: '', neighborhood: '', city: 'Curitiba', state: 'PR', zipCode: '' },
      bankAccount: data.bankAccount || { pixKeyType: 'CNPJ', pixKey: data.taxId, bankCode: '001', bankName: 'Banco do Brasil', agency: '0001', account: '00000', accountType: 'CORRENTE', beneficiaryName: data.legalName, beneficiaryTaxId: data.taxId },
      documents: data.documents || [],
      performance: {
        deliveryTimelinessScore: 5.0,
        qualityScore: 5.0,
        communicationScore: 5.0,
        averageRating: 5.0,
        totalContractsCompleted: 0,
        openOccurrences: 0
      },
      financialMetrics: { totalContracted: 0, totalPaid: 0, totalPending: 0, servedEventsCount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_SUPPLIERS.unshift(newSupplier);

    logProcureAudit({
      actor,
      entityType: 'SUPPLIER',
      entityId: id,
      action: 'SUPPLIER_CREATED',
      summary: `Fornecedor cadastrado: ${newSupplier.tradeName} (${newSupplier.taxId})`,
      details: newSupplier
    });

    return { ok: true, data: newSupplier };
  },

  async addSupplierDocument(supplierId, docData, actor) {
    const s = LOCAL_SUPPLIERS.find(item => item.id === supplierId);
    if (!s) throw new Error('Fornecedor não localizado.');

    const docId = `DOC-${Date.now().toString().slice(-4)}`;
    const newDoc = {
      id: docId,
      type: docData.type || 'OUTROS',
      title: docData.title,
      documentNumber: docData.documentNumber || '',
      issuedAt: docData.issuedAt || new Date().toISOString(),
      expiresAt: docData.expiresAt,
      status: new Date(docData.expiresAt) < new Date() ? 'EXPIRADO' : 'VALIDO',
      fileUrl: docData.fileUrl || ''
    };

    s.documents.push(newDoc);
    s.updatedAt = new Date().toISOString();

    // Atualiza status se tinha CND vencida
    const hasExpired = s.documents.some(d => d.status === 'EXPIRADO');
    if (hasExpired && s.status === 'HOMOLOGADO') {
      s.status = 'PENDENTE_DOCS';
    }

    logProcureAudit({
      actor,
      entityType: 'SUPPLIER',
      entityId: supplierId,
      action: 'DOCUMENT_ATTACHED',
      summary: `Documento ${newDoc.title} anexado ao fornecedor ${s.tradeName}`,
      details: newDoc
    });

    return { ok: true, data: newDoc };
  },

  // =========================================================================
  // 2. CATEGORIAS, TAXONOMIA E CENTROS DE CUSTO
  // =========================================================================
  getTaxonomyCategories() {
    return EVENT_PROCUREMENT_CATEGORIES;
  },

  getCostCenters(producerId = 'prod-1') {
    return LOCAL_COST_CENTERS.filter(cc => !producerId || cc.producerId === producerId);
  },

  getEventBudgets({ producerId = 'prod-1', eventId } = {}) {
    return LOCAL_EVENT_BUDGETS.filter(b => (!producerId || b.producerId === producerId) && (!eventId || b.eventId === String(eventId)));
  },

  checkBudgetAvailability({ producerId, eventId, costCenterId, amount }) {
    const reqAmount = Number(amount) || 0;
    const budget = LOCAL_EVENT_BUDGETS.find(b =>
      b.producerId === producerId &&
      String(b.eventId) === String(eventId) &&
      b.costCenterId === costCenterId
    );

    if (!budget) {
      // Se não houver orçamento cadastrado explicitamente, assume teto livre ou monitoramento
      return {
        hasBudget: false,
        plannedAmount: 0,
        realizedAmount: 0,
        committedAmount: 0,
        availableAmount: 0,
        isOverbudget: false,
        difference: 0,
        message: 'Nenhum orçamento pré-definido para este centro de custo. Operação seguirá com alerta orçamentário.'
      };
    }

    const available = Number((budget.plannedAmount - budget.realizedAmount - budget.committedAmount).toFixed(2));
    const isOverbudget = reqAmount > available;
    const difference = Number((reqAmount - available).toFixed(2));

    return {
      hasBudget: true,
      budget,
      plannedAmount: budget.plannedAmount,
      realizedAmount: budget.realizedAmount,
      committedAmount: budget.committedAmount,
      availableAmount: available,
      isOverbudget,
      difference: isOverbudget ? difference : 0,
      allowOverbudget: budget.allowOverbudget,
      message: isOverbudget
        ? `Atenção: Esta contratação de R$ ${reqAmount.toFixed(2)} excede o orçamento disponível (R$ ${available.toFixed(2)}) em R$ ${difference.toFixed(2)}.`
        : `Orçamento suficiente: R$ ${available.toFixed(2)} disponíveis após comprometimento prévio.`
    };
  },

  // =========================================================================
  // 3. SOLICITAÇÕES DE COMPRA (Purchase Requests)
  // =========================================================================
  async getPurchaseRequests({ producerId = 'prod-1', eventId, status } = {}) {
    let list = LOCAL_PURCHASE_REQUESTS.filter(r => !producerId || r.producerId === producerId);
    if (eventId) list = list.filter(r => String(r.eventId) === String(eventId));
    if (status) list = list.filter(r => r.status === status);
    return { ok: true, data: list };
  },

  async getPurchaseRequestById(id) {
    const req = LOCAL_PURCHASE_REQUESTS.find(r => r.id === id);
    if (!req) return { ok: false, error: 'Solicitação não localizada.' };
    return { ok: true, data: req };
  },

  async createPurchaseRequest(data, actor) {
    if (!data.eventId || !data.costCenterId || !data.items || data.items.length === 0) {
      throw new Error('Evento, centro de custo e ao menos um item são obrigatórios.');
    }

    const items = data.items.map((it, idx) => {
      const q = Number(it.quantity) || 1;
      const unitPrice = Number(it.estimatedUnitPrice) || 0;
      return {
        id: it.id || `IT-${idx + 1}`,
        description: it.description,
        category: it.category || 'Produção Geral',
        quantity: q,
        unit: it.unit || 'UN',
        estimatedUnitPrice: unitPrice,
        estimatedTotalPrice: Number((q * unitPrice).toFixed(2))
      };
    });

    const totalEstimated = items.reduce((acc, it) => acc + it.estimatedTotalPrice, 0);
    const id = `PR-${String(LOCAL_PURCHASE_REQUESTS.length + 1).padStart(4, '0')}`;

    // Busca nome do centro de custo
    const cc = LOCAL_COST_CENTERS.find(c => c.id === data.costCenterId);
    const costCenterName = cc ? cc.name : 'Centro de Custo';

    const newRequest = {
      id,
      producerId: data.producerId || 'prod-1',
      eventId: String(data.eventId),
      eventName: data.eventName || `Evento ${data.eventId}`,
      requesterId: actor?.id || 'usr-default',
      requesterName: actor?.name || 'Operador',
      requesterRole: actor?.role || 'OPERADOR_EVENTO',
      costCenterId: data.costCenterId,
      costCenterName,
      description: data.description || 'Solicitação de compra operacional',
      urgency: data.urgency || 'MEDIA',
      neededUntil: data.neededUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      justification: data.justification || 'Necessidade operacional do evento.',
      items,
      estimatedTotalAmount: totalEstimated,
      status: data.submitDirectly ? 'PENDING_APPROVAL' : 'DRAFT',
      currentApprovalStep: data.submitDirectly ? 'GESTOR_EVENTO' : 'RASCUNHO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_PURCHASE_REQUESTS.unshift(newRequest);

    logProcureAudit({
      actor,
      entityType: 'PURCHASE_REQUEST',
      entityId: id,
      action: data.submitDirectly ? 'REQUEST_SUBMITTED' : 'REQUEST_DRAFTED',
      summary: `Solicitação ${id} criada: ${newRequest.description} (R$ ${totalEstimated.toFixed(2)})`,
      details: newRequest
    });

    // Se submetida diretamente, insere na Inbox de aprovação
    if (data.submitDirectly) {
      this._enqueueApprovalInbox({
        entityType: 'PURCHASE_REQUEST',
        entityId: id,
        producerId: newRequest.producerId,
        eventId: newRequest.eventId,
        eventName: newRequest.eventName,
        costCenterName: newRequest.costCenterName,
        requesterName: newRequest.requesterName,
        amount: totalEstimated,
        priority: newRequest.urgency === 'ALTA' || newRequest.urgency === 'EMERGENCIAL' ? 'URGENTE' : 'NORMAL',
        requiredLevel: 'GESTOR_EVENTO',
        justification: newRequest.justification
      });
    }

    return { ok: true, data: newRequest };
  },

  async submitPurchaseRequest(requestId, actor) {
    const req = LOCAL_PURCHASE_REQUESTS.find(r => r.id === requestId);
    if (!req) throw new Error('Solicitação não localizada.');
    if (req.status !== 'DRAFT') throw new Error(`Solicitação no estado ${req.status} não pode ser submetida.`);

    req.status = 'PENDING_APPROVAL';
    req.currentApprovalStep = 'GESTOR_EVENTO';
    req.updatedAt = new Date().toISOString();

    logProcureAudit({
      actor,
      entityType: 'PURCHASE_REQUEST',
      entityId: requestId,
      action: 'REQUEST_SUBMITTED',
      summary: `Solicitação ${requestId} submetida para aprovação por ${actor?.name || 'Solicitante'}`
    });

    this._enqueueApprovalInbox({
      entityType: 'PURCHASE_REQUEST',
      entityId: req.id,
      producerId: req.producerId,
      eventId: req.eventId,
      eventName: req.eventName,
      costCenterName: req.costCenterName,
      requesterName: req.requesterName,
      amount: req.estimatedTotalAmount,
      priority: req.urgency === 'ALTA' || req.urgency === 'EMERGENCIAL' ? 'URGENTE' : 'NORMAL',
      requiredLevel: 'GESTOR_EVENTO',
      justification: req.justification
    });

    return { ok: true, data: req };
  },

  // =========================================================================
  // 4. COTAÇÕES & MULTI-PROPOSTAS (Quotations)
  // =========================================================================
  async getQuotations({ producerId = 'prod-1', requestId } = {}) {
    let list = LOCAL_QUOTATIONS.filter(q => !producerId || q.producerId === producerId);
    if (requestId) list = list.filter(q => q.purchaseRequestId === requestId);
    return { ok: true, data: list };
  },

  async createQuotation({ purchaseRequestId, producerId, eventId, costCenterId }, actor) {
    const req = LOCAL_PURCHASE_REQUESTS.find(r => r.id === purchaseRequestId);
    if (!req) throw new Error('Solicitação de compra não encontrada.');

    const quoteId = `QUOTE-${String(LOCAL_QUOTATIONS.length + 1).padStart(4, '0')}`;
    const newQuote = {
      id: quoteId,
      purchaseRequestId,
      producerId: producerId || req.producerId,
      eventId: eventId || req.eventId,
      costCenterId: costCenterId || req.costCenterId,
      status: 'ABERTA',
      proposals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_QUOTATIONS.unshift(newQuote);
    req.status = 'IN_QUOTATION';
    req.quotationId = quoteId;
    req.updatedAt = new Date().toISOString();

    logProcureAudit({
      actor,
      entityType: 'QUOTATION',
      entityId: quoteId,
      action: 'QUOTATION_OPENED',
      summary: `Cotação ${quoteId} aberta para a solicitação ${purchaseRequestId}`
    });

    return { ok: true, data: newQuote };
  },

  async addQuotationProposal(quotationId, proposalData, actor) {
    const quote = LOCAL_QUOTATIONS.find(q => q.id === quotationId);
    if (!quote) throw new Error('Cotação não localizada.');

    const supplier = LOCAL_SUPPLIERS.find(s => s.id === proposalData.supplierId);
    const supplierName = supplier ? supplier.tradeName : (proposalData.supplierName || 'Fornecedor');

    const propId = `PROP-${String(quote.proposals.length + 1).padStart(2, '0')}`;
    const newProposal = {
      id: propId,
      supplierId: proposalData.supplierId,
      supplierName,
      totalAmount: Number(proposalData.totalAmount) || 0,
      deliveryDays: Number(proposalData.deliveryDays) || 3,
      paymentConditions: proposalData.paymentConditions || '30 dias',
      score: Number(proposalData.score) || 80,
      notes: proposalData.notes || '',
      status: 'SUBMETIDA'
    };

    quote.proposals.push(newProposal);
    quote.status = 'EM_ANALISE';
    quote.updatedAt = new Date().toISOString();

    logProcureAudit({
      actor,
      entityType: 'QUOTATION',
      entityId: quotationId,
      action: 'PROPOSAL_RECEIVED',
      summary: `Proposta recebida de ${supplierName}: R$ ${newProposal.totalAmount.toFixed(2)} (${newProposal.deliveryDays} dias)`,
      details: newProposal
    });

    return { ok: true, data: newProposal };
  },

  async selectWinningProposal(quotationId, proposalId, justification, buyerName, actor) {
    const quote = LOCAL_QUOTATIONS.find(q => q.id === quotationId);
    if (!quote) throw new Error('Cotação não localizada.');
    if (!justification || justification.length < 10) {
      throw new Error('A justificativa técnica da escolha da proposta é obrigatória (mínimo 10 caracteres).');
    }

    const winningProp = quote.proposals.find(p => p.id === proposalId);
    if (!winningProp) throw new Error('Proposta não encontrada nesta cotação.');

    quote.proposals.forEach(p => {
      p.status = p.id === proposalId ? 'VENCEDORA' : 'RECUSADA';
    });

    quote.selectedProposalId = proposalId;
    quote.buyerJustification = justification;
    quote.buyerName = buyerName || actor?.name || 'Comprador Responsável';
    quote.selectedAt = new Date().toISOString();
    quote.status = 'FINALIZADA';
    quote.updatedAt = new Date().toISOString();

    // Atualiza a solicitação de compra
    const req = LOCAL_PURCHASE_REQUESTS.find(r => r.id === quote.purchaseRequestId);
    if (req) {
      req.status = 'APPROVED';
      req.updatedAt = new Date().toISOString();
    }

    logProcureAudit({
      actor,
      entityType: 'QUOTATION',
      entityId: quotationId,
      action: 'PROPOSAL_SELECTED',
      summary: `Proposta de ${winningProp.supplierName} (R$ ${winningProp.totalAmount.toFixed(2)}) declarada vencedora por ${quote.buyerName}. Justificativa: ${justification}`
    });

    return { ok: true, data: quote };
  },

  // =========================================================================
  // 5. PEDIDO DE COMPRA & COMPROMETIMENTO ORÇAMENTÁRIO (Purchase Orders)
  // =========================================================================
  async getPurchaseOrders({ producerId = 'prod-1', eventId, status } = {}) {
    let list = LOCAL_PURCHASE_ORDERS.filter(o => !producerId || o.producerId === producerId);
    if (eventId) list = list.filter(o => String(o.eventId) === String(eventId));
    if (status) list = list.filter(o => o.status === status);
    return { ok: true, data: list };
  },

  async createPurchaseOrder(data, actor) {
    if (!data.supplierId || !data.eventId || !data.totalAmount) {
      throw new Error('Fornecedor, evento e valor total são obrigatórios para emitir o pedido de compra.');
    }

    const supplier = LOCAL_SUPPLIERS.find(s => s.id === data.supplierId);
    if (!supplier) throw new Error('Fornecedor não localizado.');

    // Checagem de orçamentação prévia antes de emitir o pedido
    const budgetCheck = this.checkBudgetAvailability({
      producerId: data.producerId || 'prod-1',
      eventId: data.eventId,
      costCenterId: data.costCenterId,
      amount: data.totalAmount
    });

    const poId = `PC-${String(LOCAL_PURCHASE_ORDERS.length + 101).padStart(6, '0')}`;
    const newOrder = {
      id: poId,
      purchaseRequestId: data.purchaseRequestId || '',
      producerId: data.producerId || 'prod-1',
      eventId: String(data.eventId),
      eventName: data.eventName || `Evento ${data.eventId}`,
      costCenterId: data.costCenterId,
      costCenterName: data.costCenterName || 'Estrutura e Produção',
      supplierId: supplier.id,
      supplierName: supplier.tradeName,
      supplierTaxId: supplier.taxId,
      contractId: data.contractId || null,
      items: data.items || [{ id: 'IT-1', description: 'Item contratado', quantity: 1, unitPrice: data.totalAmount, totalPrice: data.totalAmount }],
      totalAmount: Number(data.totalAmount),
      paymentTerms: data.paymentTerms || '30 dias via PIX',
      installmentsCount: data.installmentsCount || 1,
      estimatedDeliveryDate: data.estimatedDeliveryDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      requesterName: data.requesterName || 'Operador',
      buyerName: actor?.name || 'Comprador',
      approvers: ['Aprovação Automatizada'],
      status: 'APPROVED',
      isBudgetCommitted: true, // Bloqueia saldo imediatamente no centro de custo
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_PURCHASE_ORDERS.unshift(newOrder);

    // Atualiza o saldo comprometido no orçamento do evento
    const budget = LOCAL_EVENT_BUDGETS.find(b =>
      b.producerId === newOrder.producerId &&
      String(b.eventId) === String(newOrder.eventId) &&
      b.costCenterId === newOrder.costCenterId
    );
    if (budget) {
      budget.committedAmount = Number((budget.committedAmount + newOrder.totalAmount).toFixed(2));
      budget.availableAmount = Number((budget.plannedAmount - budget.realizedAmount - budget.committedAmount).toFixed(2));
    }

    logProcureAudit({
      actor,
      entityType: 'PURCHASE_ORDER',
      entityId: poId,
      action: 'PURCHASE_ORDER_ISSUED',
      summary: `Pedido de Compra ${poId} emitido para ${supplier.tradeName}: R$ ${newOrder.totalAmount.toFixed(2)}. Comprometimento orçamentário registrado.`,
      details: { order: newOrder, budgetCheck }
    });

    return { ok: true, data: newOrder, budgetCheck };
  },

  // =========================================================================
  // 6. GESTÃO DE CONTRATOS & RATEIO MULTI-EVENTO 100%
  // =========================================================================
  async getContracts({ producerId = 'prod-1', status } = {}) {
    let list = LOCAL_CONTRACTS.filter(c => !producerId || c.producerId === producerId);
    if (status) list = list.filter(c => c.status === status);
    return { ok: true, data: list };
  },

  async getContractById(id) {
    const c = LOCAL_CONTRACTS.find(item => item.id === id);
    if (!c) return { ok: false, error: 'Contrato não localizado.' };
    return { ok: true, data: c };
  },

  async createContract(data, actor) {
    if (!data.supplierId || !data.totalAmount || !data.allocations || data.allocations.length === 0) {
      throw new Error('Fornecedor, valor total e rateio de eventos são obrigatórios.');
    }

    // REGRA DE OURO DO RATEIO: A soma dos percentuais de rateio deve ser ESTRITAMENTE 100.00%
    const totalPercentage = Number(data.allocations.reduce((acc, a) => acc + Number(a.percentage || 0), 0).toFixed(2));
    if (Math.abs(totalPercentage - 100.00) > 0.01) {
      throw new Error(`Validação de Rateio Violada: A soma dos percentuais de rateio entre eventos é de ${totalPercentage.toFixed(2)}%, mas deve ser RIGOROSAMENTE 100.00%.`);
    }

    const supplier = LOCAL_SUPPLIERS.find(s => s.id === data.supplierId);
    if (!supplier) throw new Error('Fornecedor não localizado.');

    const totalAmount = Number(data.totalAmount);
    const contractId = `CT-${String(LOCAL_CONTRACTS.length + 1).padStart(4, '0')}`;
    const contractNumber = data.contractNumber || `CT-${new Date().getFullYear()}-${String(LOCAL_CONTRACTS.length + 1).padStart(4, '0')}`;

    // Distribui os valores por evento conforme os percentuais
    const allocations = data.allocations.map(a => {
      const pct = Number(a.percentage);
      const allocatedAmount = Number((totalAmount * (pct / 100)).toFixed(2));
      return {
        eventId: String(a.eventId),
        eventName: a.eventName || `Evento ${a.eventId}`,
        percentage: pct,
        allocatedAmount,
        costCenterId: a.costCenterId || data.costCenterId || 'cc-prod-02'
      };
    });

    // Gera as parcelas financeiras
    const numInstallments = Number(data.installmentsCount) || 1;
    const installmentAmount = Number((totalAmount / numInstallments).toFixed(2));
    const installments = [];
    const baseDate = data.startDate ? new Date(data.startDate) : new Date();

    for (let i = 1; i <= numInstallments; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));
      installments.push({
        installmentNumber: i,
        totalInstallments: numInstallments,
        dueDate: d.toISOString().split('T')[0],
        amount: installmentAmount,
        status: 'PREVISTO'
      });
    }

    const newContract = {
      id: contractId,
      contractNumber,
      producerId: data.producerId || 'prod-1',
      supplierId: supplier.id,
      supplierName: supplier.tradeName,
      supplierTaxId: supplier.taxId,
      objectDescription: data.objectDescription || 'Contrato de prestação de serviços para eventos',
      costCenterId: data.costCenterId || 'cc-prod-02',
      costCenterName: data.costCenterName || 'Estrutura, Som e Luz',
      totalAmount,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'PIX',
      installments,
      allocations,
      adjustmentClause: data.adjustmentClause || 'Reajuste anual IPCA',
      autoRenew: !!data.autoRenew,
      responsibleUser: data.responsibleUser || actor?.name || 'Diretor Responsável',
      approvers: ['Aprovação Financeira'],
      digitalSignatureStatus: data.digitalSignatureStatus || 'PENDENTE',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    LOCAL_CONTRACTS.unshift(newContract);

    // Integração Direta com Contas a Pagar: Gera as previsões financeiras no Contas a Pagar
    installments.forEach(inst => {
      const payableId = `PAY-${String(LOCAL_PAYABLES.length + 1).padStart(4, '0')}`;
      const payable = {
        id: payableId,
        producerId: newContract.producerId,
        eventId: allocations[0].eventId, // Evento principal ou primeiro do rateio
        supplierId: supplier.id,
        supplierName: supplier.tradeName,
        contractId: contractId,
        costCenterId: newContract.costCenterId,
        installmentNumber: inst.installmentNumber,
        totalInstallments: inst.totalInstallments,
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: 'AGUARDANDO_APROVACAO',
        pixKey: supplier.bankAccount?.pixKey || '',
        threeWayMatchCleared: false,
        createdAt: new Date().toISOString()
      };
      inst.financialPayableId = payableId;
      LOCAL_PAYABLES.unshift(payable);
    });

    logProcureAudit({
      actor,
      entityType: 'CONTRACT',
      entityId: contractId,
      action: 'CONTRACT_CREATED',
      summary: `Contrato ${contractNumber} formalizado com ${supplier.tradeName} no valor de R$ ${totalAmount.toFixed(2)} com rateio em ${allocations.length} eventos (Soma: 100%).`,
      details: { contract: newContract, allocations }
    });

    return { ok: true, data: newContract };
  },

  // =========================================================================
  // 7. VALIDAÇÃO 3-WAY MATCH (Pedido × Recebimento × Nota Fiscal)
  // =========================================================================
  executeThreeWayMatch({ purchaseOrderId, receiptQuantity, invoiceAmount, invoiceNumber, supplierTaxId, actor }) {
    const po = LOCAL_PURCHASE_ORDERS.find(o => o.id === purchaseOrderId);
    if (!po) throw new Error('Pedido de compra não localizado para conferência tríplice.');

    const notes = [];
    let matchStatus = 'MATCHED';
    let isClearedForPayment = true;

    // 1. Checagem de Fornecedor
    if (supplierTaxId && supplierTaxId.replace(/\D/g, '') !== po.supplierTaxId.replace(/\D/g, '')) {
      matchStatus = 'SUPPLIER_MISMATCH';
      isClearedForPayment = false;
      notes.push(`Divergência Crítica de Fornecedor: CNPJ da NF (${supplierTaxId}) difere do CNPJ do Pedido (${po.supplierTaxId}).`);
    }

    // 2. Checagem de Quantidade (Pedido vs Recebimento)
    const poTotalQuantity = po.items.reduce((acc, it) => acc + it.quantity, 0);
    const quantityDifference = receiptQuantity ? (poTotalQuantity - Number(receiptQuantity)) : 0;
    if (quantityDifference !== 0) {
      matchStatus = 'QUANTITY_DISCREPANCY';
      isClearedForPayment = false;
      notes.push(`Divergência Física de Quantidade: Pedido solicitou ${poTotalQuantity} unidades, mas medição de recebimento acusou ${receiptQuantity} unidades.`);
    }

    // 3. Checagem de Preço / Valor Total (Pedido vs NF)
    const amountDifference = Number(Math.abs(po.totalAmount - Number(invoiceAmount)).toFixed(2));
    if (amountDifference > 0.05) { // Tolerância de 5 centavos
      matchStatus = 'PRICE_DISCREPANCY';
      isClearedForPayment = false;
      notes.push(`Divergência Financeira de Preço: Valor do Pedido R$ ${po.totalAmount.toFixed(2)} difere da Nota Fiscal R$ ${Number(invoiceAmount).toFixed(2)} (Diferença de R$ ${amountDifference.toFixed(2)}).`);
    }

    if (isClearedForPayment) {
      notes.push('✓ Conferência Tríplice 3-Way Match Aprovada: Fornecedor, quantidades e valores 100% validados.');
      
      // Libera contas a pagar vinculadas
      const payable = LOCAL_PAYABLES.find(p => p.purchaseOrderId === purchaseOrderId || p.contractId === po.contractId);
      if (payable) {
        payable.threeWayMatchCleared = true;
      }
    }

    const result = {
      purchaseOrderId,
      matchStatus,
      isClearedForPayment,
      orderAmount: po.totalAmount,
      receiptAmount: po.totalAmount - (quantityDifference * (po.items[0]?.unitPrice || 0)),
      invoiceAmount: Number(invoiceAmount) || po.totalAmount,
      amountDifference,
      quantityDifference,
      notes,
      auditedAt: new Date().toISOString()
    };

    logProcureAudit({
      actor,
      entityType: 'MATCH',
      entityId: purchaseOrderId,
      action: isClearedForPayment ? '3WAY_MATCH_SUCCESS' : '3WAY_MATCH_DISCREPANCY',
      summary: isClearedForPayment ? `3-Way Match 100% OK para ${po.id}` : `Divergência no 3-Way Match do pedido ${po.id}: ${matchStatus}`,
      details: result
    });

    return { ok: true, data: result };
  },

  // =========================================================================
  // 8. MOTOR DE ALÇADAS & CENTRAL DE APROVAÇÕES (Maker / Checker)
  // =========================================================================
  _enqueueApprovalInbox(itemData) {
    const id = `APP-${String(LOCAL_APPROVAL_INBOX.length + 1).padStart(4, '0')}`;
    const item = {
      id,
      entityType: itemData.entityType,
      entityId: itemData.entityId,
      producerId: itemData.producerId || 'prod-1',
      eventId: itemData.eventId || null,
      eventName: itemData.eventName || 'Evento',
      supplierName: itemData.supplierName || '—',
      costCenterName: itemData.costCenterName || 'Geral',
      requesterName: itemData.requesterName || 'Operador',
      amount: Number(itemData.amount) || 0,
      requestedAt: new Date().toISOString(),
      priority: itemData.priority || 'NORMAL',
      isOverbudget: !!itemData.isOverbudget,
      budgetStatusText: itemData.budgetStatusText || 'Aguardando validação',
      status: 'PENDING',
      requiredLevel: itemData.requiredLevel || 'GESTOR_EVENTO',
      justification: itemData.justification || ''
    };
    LOCAL_APPROVAL_INBOX.unshift(item);
    return item;
  },

  async getApprovalInbox({ producerId = 'prod-1', status = 'PENDING' } = {}) {
    let list = LOCAL_APPROVAL_INBOX.filter(item => !producerId || item.producerId === producerId);
    if (status) list = list.filter(item => item.status === status);

    const counts = {
      pendingWithMe: list.length,
      urgentCount: list.filter(item => item.priority === 'URGENTE' || item.priority === 'CRITICA').length,
      overbudgetCount: list.filter(item => item.isOverbudget).length,
      contractsCount: list.filter(item => item.entityType === 'CONTRACT').length,
      purchasesCount: list.filter(item => item.entityType === 'PURCHASE_REQUEST' || item.entityType === 'PURCHASE_ORDER').length,
      payablesCount: list.filter(item => item.entityType === 'PAYABLE').length
    };

    return { ok: true, data: list, counts };
  },

  async processApprovalDecision({ inboxItemId, decision, justification, actor }) {
    const item = LOCAL_APPROVAL_INBOX.find(i => i.id === inboxItemId);
    if (!item) throw new Error('Item de aprovação não localizado.');
    if (item.status !== 'PENDING') throw new Error(`Item já finalizado com status ${item.status}.`);

    // REGRA DE GOVERNANÇA: MAKER / CHECKER
    // Quem criou a solicitação não pode aprovar
    if (actor && actor.name && item.requesterName && actor.name.toLowerCase() === item.requesterName.toLowerCase()) {
      throw new Error(`Violação de Segregação de Funções (Maker/Checker): O solicitante (${actor.name}) não possui autorização para aprovar o próprio pedido.`);
    }

    if (decision === 'REJECTED' && (!justification || justification.length < 5)) {
      throw new Error('A justificativa é obrigatória para reprovar uma solicitação financeira.');
    }

    item.status = decision; // 'APPROVED' | 'REJECTED' | 'ADJUSTMENT_REQUESTED'
    item.justification = justification || '';
    item.decidedBy = actor?.name || 'Aprovador';
    item.decidedAt = new Date().toISOString();

    // Cascata de atualização na entidade de origem
    if (item.entityType === 'PURCHASE_REQUEST') {
      const req = LOCAL_PURCHASE_REQUESTS.find(r => r.id === item.entityId);
      if (req) {
        req.status = decision === 'APPROVED' ? 'APPROVED' : (decision === 'REJECTED' ? 'REJECTED' : 'DRAFT');
        req.updatedAt = new Date().toISOString();
      }
    } else if (item.entityType === 'PAYABLE') {
      const pay = LOCAL_PAYABLES.find(p => p.id === item.entityId);
      if (pay) {
        pay.status = decision === 'APPROVED' ? 'APROVADO' : (decision === 'REJECTED' ? 'CANCELADO' : 'AGUARDANDO_APROVACAO');
      }
    }

    logProcureAudit({
      actor,
      entityType: 'APPROVAL',
      entityId: inboxItemId,
      action: `APPROVAL_${decision}`,
      summary: `Decisão de ${decision} aplicada ao item ${inboxItemId} (${item.entityType}) por ${actor?.name || 'Aprovador'}.`,
      details: { item, justification }
    });

    return { ok: true, data: item };
  },

  // =========================================================================
  // 9. CONTAS A PAGAR & ALERTAS OPERACIONAIS
  // =========================================================================
  async getPayables({ producerId = 'prod-1', eventId, status } = {}) {
    let list = LOCAL_PAYABLES.filter(p => !producerId || p.producerId === producerId);
    if (eventId) list = list.filter(p => String(p.eventId) === String(eventId));
    if (status) list = list.filter(p => p.status === status);
    return { ok: true, data: list };
  },

  async getOperationalAlerts(producerId = 'prod-1') {
    const alerts = [];
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86400000);

    // 1. Contratos vencendo nos próximos 30 dias
    LOCAL_CONTRACTS.forEach(c => {
      if (c.producerId === producerId && c.status === 'ACTIVE') {
        const end = new Date(c.endDate);
        if (end >= now && end <= in30Days) {
          alerts.push({
            id: `ALT-CT-${c.id}`,
            severity: 'WARNING',
            type: 'CONTRACT_EXPIRING',
            title: `Contrato ${c.contractNumber} Próximo do Vencimento`,
            description: `O contrato com ${c.supplierName} encerra em ${c.endDate} (menos de 30 dias).`,
            entityId: c.id
          });
        }
      }
    });

    // 2. Contas aguardando aprovação
    const pendingPayables = LOCAL_PAYABLES.filter(p => p.producerId === producerId && p.status === 'AGUARDANDO_APROVACAO');
    if (pendingPayables.length > 0) {
      alerts.push({
        id: `ALT-PAY-PEND`,
        severity: 'INFO',
        type: 'PENDING_APPROVAL',
        title: `${pendingPayables.length} Contas a Pagar Aguardando Aprovação`,
        description: `Totalizando R$ ${pendingPayables.reduce((acc, p) => acc + p.amount, 0).toFixed(2)} em lançamentos de fornecedores pendentes de liberação.`
      });
    }

    // 3. Fornecedores com certidões/documentos vencidos
    LOCAL_SUPPLIERS.forEach(s => {
      if (s.producerId === producerId) {
        const expiredDoc = s.documents.find(d => d.status === 'EXPIRADO' || new Date(d.expiresAt) < now);
        if (expiredDoc) {
          alerts.push({
            id: `ALT-DOC-${s.id}`,
            severity: 'CRITICAL',
            type: 'SUPPLIER_DOC_EXPIRED',
            title: `Documentação Vencida: ${s.tradeName}`,
            description: `Fornecedor possui ${expiredDoc.title} com validade expirada. Homologação suspensa.`,
            entityId: s.id
          });
        }
      }
    });

    return { ok: true, data: alerts };
  },

  // =========================================================================
  // 10. TRILHA DE AUDITORIA APPEND-ONLY
  // =========================================================================
  getProcureAuditLog({ entityType, entityId, correlationId } = {}) {
    let list = [...LOCAL_PROCURE_AUDIT];
    if (entityType) list = list.filter(a => a.entityType === entityType);
    if (entityId) list = list.filter(a => a.entityId === entityId);
    if (correlationId) list = list.filter(a => a.correlationId === correlationId);
    return list;
  }
};
