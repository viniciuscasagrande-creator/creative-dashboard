/**
 * Fase 26.17.9.4.5 — Tipos Oficiais do Procure-to-Pay SafeSaff / PDT
 * Fornecedores + Compras + Contratos + Aprovação Financeira
 */

export type SupplierStatus = 'ATIVO' | 'HOMOLOGADO' | 'PENDENTE_DOCS' | 'BLOQUEADO';

export interface SupplierBankAccount {
  pixKeyType: 'CNPJ' | 'CPF' | 'EMAIL' | 'PHONE' | 'EVP';
  pixKey: string;
  bankCode: string;
  bankName: string;
  agency: string;
  account: string;
  accountType: 'CORRENTE' | 'POUPANCA';
  beneficiaryName: string;
  beneficiaryTaxId: string;
}

export interface SupplierDocument {
  id: string;
  type: 'CND_FEDERAL' | 'CND_ESTADUAL' | 'CND_MUNICIPAL' | 'CND_FGTS' | 'CND_TRABALHISTA' | 'CONTRATO_SOCIAL' | 'OUTROS';
  title: string;
  documentNumber?: string;
  issuedAt: string;
  expiresAt: string;
  status: 'VALIDO' | 'EXPIRADO' | 'PENDENTE';
  fileUrl?: string;
}

export interface SupplierPerformance {
  deliveryTimelinessScore: number; // 1 a 5
  qualityScore: number;            // 1 a 5
  communicationScore: number;      // 1 a 5
  averageRating: number;           // 1 a 5
  totalContractsCompleted: number;
  openOccurrences: number;
}

export interface Supplier {
  id: string;
  producerId: string; // Produtor proprietário ou 'PLATFORM' se compartilhado
  legalName: string;  // Razão Social
  tradeName: string;  // Nome Fantasia
  taxId: string;      // CNPJ ou CPF
  taxIdType: 'CNPJ' | 'CPF';
  status: SupplierStatus;
  primaryCategory: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bankAccount: SupplierBankAccount;
  documents: SupplierDocument[];
  performance: SupplierPerformance;
  financialMetrics: {
    totalContracted: number;
    totalPaid: number;
    totalPending: number;
    servedEventsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_QUOTATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | 'COMPLETED'
  | 'CANCELED';

export interface PurchaseRequestItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
}

export interface PurchaseRequest {
  id: string; // PR-0001
  producerId: string;
  eventId: string;
  eventName?: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  costCenterId: string;
  costCenterName: string;
  description: string;
  urgency: 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIAL';
  neededUntil: string;
  justification: string;
  items: PurchaseRequestItem[];
  estimatedTotalAmount: number;
  status: PurchaseRequestStatus;
  currentApprovalStep?: string;
  attachments?: string[];
  quotationId?: string;
  purchaseOrderId?: string;
  contractId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationProposal {
  id: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  deliveryDays: number;
  paymentConditions: string;
  score: number; // 0 a 100
  notes: string;
  status: 'SUBMETIDA' | 'VENCEDORA' | 'RECUSADA';
}

export interface Quotation {
  id: string; // QUOTE-0001
  purchaseRequestId: string;
  producerId: string;
  eventId: string;
  costCenterId: string;
  status: 'ABERTA' | 'EM_ANALISE' | 'FINALIZADA' | 'CANCELADA';
  proposals: QuotationProposal[];
  selectedProposalId?: string;
  buyerJustification?: string;
  buyerName?: string;
  selectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELED';

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string; // PC-000184
  purchaseRequestId: string;
  producerId: string;
  eventId: string;
  eventName?: string;
  costCenterId: string;
  costCenterName: string;
  supplierId: string;
  supplierName: string;
  supplierTaxId: string;
  contractId?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  paymentTerms: string; // Ex: "30 dias líquido"
  installmentsCount: number;
  estimatedDeliveryDate: string;
  requesterName: string;
  buyerName: string;
  approvers: string[];
  status: PurchaseOrderStatus;
  isBudgetCommitted: boolean; // Reserva orçamentária ativada
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptItem {
  itemId: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  totalPrice: number;
}

export interface GoodsReceipt {
  id: string; // REC-0001
  purchaseOrderId: string;
  producerId: string;
  eventId: string;
  supplierId: string;
  receivedBy: string;
  receivedAt: string;
  deliveryNotesNumber?: string;
  items: GoodsReceiptItem[];
  status: 'TOTAL' | 'PARCIAL' | 'RECUSADO';
  notes?: string;
}

export interface InvoiceDocument {
  id: string; // NF-0001
  invoiceNumber: string;
  series: string;
  supplierId: string;
  supplierTaxId: string;
  issueDate: string;
  totalAmount: number;
  xmlKey?: string;
  pdfUrl?: string;
  itemsCount: number;
}

export interface ThreeWayMatchResult {
  matchStatus: 'MATCHED' | 'PRICE_DISCREPANCY' | 'QUANTITY_DISCREPANCY' | 'SUPPLIER_MISMATCH' | 'DUPLICATE_DOCUMENT';
  isClearedForPayment: boolean;
  orderAmount: number;
  receiptAmount: number;
  invoiceAmount: number;
  amountDifference: number;
  quantityDifference: number;
  notes: string[];
  auditedAt: string;
}

export interface ContractEventAllocation {
  eventId: string;
  eventName: string;
  percentage: number; // Deve somar 100.00%
  allocatedAmount: number;
  costCenterId: string;
}

export interface ContractInstallment {
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  status: 'PREVISTO' | 'EM_ABERTO' | 'PAGO' | 'VENCIDO';
  financialPayableId?: string;
}

export type ContractStatus =
  | 'DRAFT'
  | 'IN_APPROVAL'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'TERMINATED'
  | 'CANCELED';

export interface Contract {
  id: string; // CT-0001
  contractNumber: string;
  producerId: string;
  supplierId: string;
  supplierName: string;
  supplierTaxId: string;
  objectDescription: string;
  costCenterId: string;
  costCenterName: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  paymentMethod: 'PIX' | 'BOLETO' | 'TRANSFERENCIA';
  installments: ContractInstallment[];
  allocations: ContractEventAllocation[]; // Rateio entre eventos (soma 100%)
  adjustmentClause?: string;
  autoRenew: boolean;
  responsibleUser: string;
  approvers: string[];
  digitalSignatureStatus: 'PENDENTE' | 'ASSINADO' | 'DISPENSADO';
  status: ContractStatus;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  producerId: string;
  code: string; // Ex: '1.02.03'
  name: string;
  category: string;
  parentId?: string;
  active: boolean;
}

export interface EventBudget {
  id: string;
  producerId: string;
  eventId: string;
  costCenterId: string;
  costCenterName: string;
  plannedAmount: number;     // Orçado
  realizedAmount: number;    // Realizado (Pago)
  committedAmount: number;   // Comprometido (Pedidos / Contratos)
  availableAmount: number;   // Disponível = Planned - Realized - Committed
  allowOverbudget: boolean;  // Se permite estourar com aprovação extraordinária
}

export interface ProcureApprovalPolicy {
  id: string;
  name: string;
  scope: 'GLOBAL' | 'PRODUCER' | 'EVENT';
  targetId?: string;
  maxAmountSingleApprover: number; // Até X gestor direto aprova
  maxAmountTwoApprovers: number;   // Até Y gerência/controladoria aprova
  requireDirectorAbove: number;    // Acima de Z diretoria aprova obrigatoriamente
  enforceMakerChecker: boolean;    // Solicitante nunca pode aprovar
  blockOverbudgetRequests: boolean;// Se true, barra se estourar orçamento
  active: boolean;
}

export interface ApprovalInboxItem {
  id: string; // APP-0001
  entityType: 'PURCHASE_REQUEST' | 'PURCHASE_ORDER' | 'CONTRACT' | 'PAYABLE';
  entityId: string;
  producerId: string;
  eventId?: string;
  eventName?: string;
  supplierName?: string;
  costCenterName: string;
  requesterName: string;
  amount: number;
  requestedAt: string;
  priority: 'NORMAL' | 'URGENTE' | 'CRITICA';
  isOverbudget: boolean;
  budgetStatusText: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADJUSTMENT_REQUESTED';
  requiredLevel: 'GESTOR_EVENTO' | 'COMPRAS' | 'FINANCEIRO' | 'DIRETORIA';
  justification?: string;
}

export interface FinancialPayable {
  id: string; // PAY-0001
  producerId: string;
  eventId: string;
  supplierId: string;
  supplierName: string;
  contractId?: string;
  purchaseOrderId?: string;
  costCenterId: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  status: 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'PAGO' | 'CANCELADO';
  pixKey?: string;
  barcode?: string;
  threeWayMatchCleared: boolean;
  createdAt: string;
}

export interface ProcureAuditEvent {
  id: string;
  correlationId: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: string;
  };
  entityType: 'SUPPLIER' | 'PURCHASE_REQUEST' | 'QUOTATION' | 'PURCHASE_ORDER' | 'CONTRACT' | 'MATCH' | 'APPROVAL';
  entityId: string;
  action: string;
  summary: string;
  details: Record<string, any>;
}

export interface ProcureAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'CONTRACT_EXPIRING' | 'PENDING_APPROVAL' | 'OVERBUDGET' | 'SUPPLIER_DOC_EXPIRED' | 'MATCH_DISCREPANCY';
  title: string;
  description: string;
  entityId?: string;
  actionUrl?: string;
  createdAt: string;
}
