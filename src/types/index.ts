export type Role =
  | 'dono'
  | 'gerente'
  | 'caixa'
  | 'comprador'
  | 'operador_campo'
  | 'financeiro';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  allowedCompanyIds: string[];
  allowedBranchIds: string[];
}

export interface Company {
  id: string;
  name: string;
  tradeName: string; // Razão Social
  cnpj: string;
  logo?: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  type: 'loja' | 'cd' | 'deposito' | 'quiosque';
  cnpj: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  managerName: string;
  phone: string;
  approvalLimitAmount: number; // Limite de alçada de aprovação sem autorização superior
}

export interface ProductVariation {
  id: string;
  sku: string;
  barcode: string;
  name: string; // e.g. "Preto / M", "110V"
  additionalPrice: number;
  stockPerBranch: Record<string, number>; // branchId -> quantity
}

export interface ProductComponent {
  componentProductId: string; // id do produto matéria-prima
  quantityNeeded: number; // quantidade necessária para 1 unidade
}

export interface BatchLot {
  id: string;
  productId: string;
  branchId: string;
  lotNumber: string;
  manufactureDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  quantity: number;
  isBlocked: boolean; // se expirado ou quarentena
}

export interface PhysicalAddress {
  aisle: string; // Corredor (ex: "A")
  shelf: string; // Prateleira (ex: "03")
  bin: string;   // Posição / Gaveta (ex: "12")
}

export interface Product {
  id: string;
  name: string;
  description: string;
  internalCode: string;
  barcode: string; // EAN-13
  category: string;
  brand: string;
  unit: 'UN' | 'KG' | 'CX' | 'LT' | 'PC';
  costPrice: number;
  salePrice: number;
  minStock: number;
  safetyStock: number;
  maxStock: number;
  reorderPoint: number;
  imageUrl: string;
  active: boolean;
  isKit?: boolean;
  isComponentOnly?: boolean; // Se é matéria-prima pura
  components?: ProductComponent[]; // Para kits ou itens manufaturados
  variations?: ProductVariation[];
  addressByBranch: Record<string, PhysicalAddress>;
  stockByBranch: Record<
    string,
    {
      current: number;
      reserved: number;
      available: number;
    }
  >;
  ncm?: string;
  weightKg?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  branchId: string;
  type: 'entrada' | 'saida_venda' | 'transferencia_saida' | 'transferencia_entrada' | 'ajuste_inventario' | 'perda_avaria' | 'baixa_kit';
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  userId: string;
  userName: string;
  referenceDoc?: string;
  notes?: string;
  lotNumber?: string;
}

export interface TransferRequest {
  id: string;
  code: string;
  sourceBranchId: string;
  destBranchId: string;
  requestedBy: string;
  requestedAt: string;
  status: 'solicitado' | 'aprovado' | 'em_transito' | 'recebido_conferido' | 'rejeitado';
  approvedBy?: string;
  approvedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  items: {
    productId: string;
    productName: string;
    barcode: string;
    requestedQty: number;
    dispatchedQty?: number;
    receivedQty?: number;
    divergenceReason?: string;
  }[];
  totalValue: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  contactName: string;
  phone: string;
  email: string;
  categories: string[];
  leadTimeDays: number;
  paymentTerms: string;
  rating: number; // 1-5
}

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  targetBranchId: string;
  status: 'rascunho' | 'cotacao' | 'aprovado' | 'enviado' | 'recebido_parcial' | 'recebido_total' | 'cancelado';
  createdAt: string;
  expectedDeliveryDate: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    quantityReceived?: number;
  }[];
  totalAmount: number;
  notes?: string;
  invoiceNumber?: string;
  receivingCheck?: {
    receivedAt: string;
    checkedBy: string;
    divergences: {
      productId: string;
      expected: number;
      received: number;
      type: 'falta' | 'sobra' | 'avaria';
    }[];
  };
}

export interface Quotation {
  id: string;
  code: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  createdAt: string;
  status: 'em_aberto' | 'concluida';
  options: {
    supplierId: string;
    supplierName: string;
    pricePerUnit: number;
    deliveryDays: number;
    paymentTerm: string;
    isWinner?: boolean;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string; // CPF ou CNPJ
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  segmentTags: ('VIP' | 'Recorrente' | 'Inadimplente' | 'Novo Lead' | 'Atacado')[];
  relationshipStage: 'novo_lead' | 'em_contato' | 'negociacao' | 'cliente_ativo' | 'inativo';
  loyaltyPoints: number;
  creditLimit: number;
  totalSpent: number;
  notes: string;
  customDiscountPct?: number;
  avgTicket?: number;
  lastPurchaseDate?: string;
}

export interface CRMTask {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  type: 'ligacao' | 'email' | 'reuniao' | 'orcamento_followup' | 'pos_venda';
  dueDate: string;
  assignedTo: string;
  completed: boolean;
  priority: 'baixa' | 'media' | 'alta';
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountPct: number;
  total: number;
  isKit?: boolean;
}

export interface Sale {
  id: string;
  code: string;
  branchId: string;
  companyId: string;
  customerId?: string;
  customerName?: string;
  sellerId: string;
  sellerName: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethods: {
    type: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'credito_loja';
    amount: number;
  }[];
  cashierSessionId?: string;
  commissionAmount: number;
  status: 'concluida' | 'cancelada' | 'devolvida_parcial';
}

export interface CashierSession {
  id: string;
  branchId: string;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  initialBalance: number;
  cashSales: number;
  cardSales: number;
  pixSales: number;
  storeCreditSales: number;
  withdrawals: { time: string; amount: number; reason: string; user: string }[]; // sangrias
  deposits: { time: string; amount: number; reason: string; user: string }[]; // reforços
  status: 'aberto' | 'fechado';
  finalCountedCash?: number;
  difference?: number;
}

export interface InventoryCount {
  id: string;
  code: string;
  branchId: string;
  date: string;
  countedBy: string;
  status: 'em_andamento' | 'aguardando_aprovacao' | 'finalizado_ajustado';
  categoryFilter?: string;
  items: {
    productId: string;
    productName: string;
    barcode: string;
    systemQuantity: number;
    countedQuantity: number;
    difference: number;
    costImpact: number;
    lotNumber?: string;
    expirationDate?: string;
  }[];
}

export interface OrderPicking {
  id: string;
  saleCode: string;
  customerName: string;
  branchId: string;
  status: 'pendente' | 'separando' | 'conferido' | 'expedido';
  assignedTo?: string;
  items: {
    productId: string;
    productName: string;
    barcode: string;
    location: PhysicalAddress;
    requestedQty: number;
    pickedQty: number;
    isVerified: boolean;
  }[];
}

export interface SmartAlert {
  id: string;
  type: 'estoque_minimo' | 'validade_proxima' | 'transferencia_pendente' | 'anomalia_venda' | 'ruptura_potencial' | 'pedido_atrasado';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  branchId?: string;
  productId?: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: string;
  read: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'estoque_abaixo_minimo' | 'validade_menos_15_dias' | 'pedido_acima_limite' | 'divergencia_inventario';
  action: 'criar_pedido_compra' | 'bloquear_lote_notificar' | 'exigir_aprovacao_dono' | 'notificar_gerente';
  active: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  branchName: string;
  action: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'AJUSTE_ESTOQUE' | 'VENDA_PDV' | 'APROVACAO' | 'SINCRONIZACAO_OFFLINE';
  entity: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  device: 'Web Desktop' | 'Mobile App (iOS)' | 'Mobile App (Android)';
}

export interface OfflineAction {
  id: string;
  timestamp: string;
  type: 'CONTAGEM_INVENTARIO' | 'SEPARACAO_PICKING' | 'RECEBIMENTO_CONFERENCIA' | 'AJUSTE_RAPIDO';
  payload: any;
  status: 'pendente' | 'sincronizado' | 'conflito';
  description: string;
}
