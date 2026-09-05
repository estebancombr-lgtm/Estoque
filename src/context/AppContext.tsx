import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Company,
  Branch,
  User,
  Role,
  Product,
  BatchLot,
  StockMovement,
  TransferRequest,
  Supplier,
  PurchaseOrder,
  Quotation,
  Customer,
  CRMTask,
  Sale,
  SaleItem,
  CashierSession,
  InventoryCount,
  OrderPicking,
  SmartAlert,
  AutomationRule,
  AuditLog,
  OfflineAction,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_LOTS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_TRANSFERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_QUOTATIONS,
  INITIAL_SALES,
  INITIAL_CASHIER_SESSION,
  INITIAL_INVENTORY_COUNTS,
  INITIAL_ORDER_PICKINGS,
  INITIAL_SMART_ALERTS,
  INITIAL_AUTOMATION_RULES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CRM_TASKS,
} from '../data/mockData';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation & Surface
  surface: 'web' | 'mobile';
  setSurface: (surface: 'web' | 'mobile') => void;
  mobileDeviceFrame: boolean;
  setMobileDeviceFrame: (enabled: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Multi-Company & Branch
  companies: Company[];
  allCompanies: Company[];
  currentCompanyId: string;
  setCurrentCompanyId: (id: string) => void;
  currentBranchId: string; // 'all' or branchId
  setCurrentBranchId: (id: string) => void;
  setBranchId: (id: string) => void;
  currentCompany: Company;
  currentBranch: Branch | null;
  allBranches: Branch[];

  // RBAC & User
  users: User[];
  currentUser: User;
  switchUserRole: (role: Role) => void;
  checkPermission: (requiredRoles: Role[]) => boolean;

  // Products & Stock
  products: Product[];
  lots: BatchLot[];
  stockMovements: StockMovement[];
  getProductById: (id: string) => Product | undefined;
  getProductByBarcode: (barcode: string) => Product | undefined;
  calculateKitAvailability: (kitProduct: Product, branchId?: string) => number;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (
    productId: string,
    branchId: string,
    delta: number,
    type: StockMovement['type'],
    notes?: string,
    lotNumber?: string
  ) => void;

  // PDV & Sales
  sales: Sale[];
  cashierSession: CashierSession;
  completeSale: (saleData: {
    items: SaleItem[];
    subtotal: number;
    discountAmount: number;
    total: number;
    customerId?: string;
    customerName?: string;
    paymentMethods: { type: any; amount: number }[];
    sellerId: string;
    sellerName: string;
  }) => Sale | null;
  openCashierSession: (initialBalance: number) => void;
  closeCashierSession: (finalCountedCash: number) => void;
  addCashierMovement: (type: 'sangria' | 'reforco', amount: number, reason: string) => void;

  // Transfers
  transfers: TransferRequest[];
  createTransfer: (data: Omit<TransferRequest, 'id' | 'code' | 'requestedAt' | 'status'>) => void;
  approveTransfer: (transferId: string) => boolean;
  dispatchTransfer: (transferId: string) => void;
  receiveTransfer: (transferId: string, receivedItems: { productId: string; receivedQty: number; divergenceReason?: string }[]) => void;

  // Purchases & Receiving
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  quotations: Quotation[];
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'code' | 'createdAt'>) => void;
  createQuotation: (quoteData: Omit<Quotation, 'id' | 'code' | 'createdAt'>) => Quotation;
  approveQuotationOption: (quotationId: string, supplierId: string, targetBranchId?: string) => void;
  receivePurchaseOrder: (
    orderId: string,
    divergences: { productId: string; expected: number; received: number; type: 'falta' | 'sobra' | 'avaria' }[],
    invoiceNumber: string
  ) => void;

  // CRM
  customers: Customer[];
  crmTasks: CRMTask[];
  addCustomer: (cust: Customer) => void;
  updateCustomerStage: (customerId: string, stage: Customer['relationshipStage']) => void;
  addCRMTask: (task: Omit<CRMTask, 'id'>) => void;
  toggleCRMTask: (taskId: string) => void;

  // Inventory & Picking
  inventoryCounts: InventoryCount[];
  orderPickings: OrderPicking[];
  startInventoryCount: (categoryFilter?: string) => InventoryCount;
  updateInventoryItemCount: (countId: string, productId: string, countedQty: number, lotNumber?: string) => void;
  finalizeInventoryCount: (countId: string) => void;
  updatePickingItem: (pickingId: string, productId: string, pickedQty: number, isVerified: boolean) => void;

  // Intelligence & Alerts
  smartAlerts: SmartAlert[];
  markAlertRead: (alertId: string) => void;
  automationRules: AutomationRule[];
  toggleAutomationRule: (ruleId: string) => void;

  // Audit
  auditLogs: AuditLog[];
  logAudit: (
    action: AuditLog['action'],
    entity: string,
    details: string,
    previousValue?: string,
    newValue?: string
  ) => void;

  // Offline Engine
  isOffline: boolean;
  setIsOffline: (val: boolean | ((prev: boolean) => boolean)) => void;
  offlineQueue: OfflineAction[];
  queueOfflineAction: (type: OfflineAction['type'], payload: any, description: string) => void;
  syncOfflineQueue: () => void;

  // Barcode Scanner Modal
  isScannerOpen: boolean;
  scannerCallback: ((barcode: string) => void) | null;
  openBarcodeScanner: (onScanned: (barcode: string) => void) => void;
  closeBarcodeScanner: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Surface & navigation
  const [surface, setSurface] = useState<'web' | 'mobile'>('web');
  const [mobileDeviceFrame, setMobileDeviceFrame] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Multi-Company & Branch
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('ei_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });
  const [currentCompanyId, setCurrentCompanyId] = useState<string>('comp-1');
  const [currentBranchId, setCurrentBranchId] = useState<string>('branch-loja-jardins');

  // RBAC & User
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>('user-gerente');

  // Products, Lots, Movements
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ei_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [lots, setLots] = useState<BatchLot[]>(INITIAL_LOTS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // PDV & Sales
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('ei_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });
  const [cashierSession, setCashierSession] = useState<CashierSession>(INITIAL_CASHIER_SESSION);

  // Transfers
  const [transfers, setTransfers] = useState<TransferRequest[]>(() => {
    const saved = localStorage.getItem('ei_transfers');
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  // Purchases & Suppliers
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('ei_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('ei_quotations');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  // CRM
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('ei_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const [crmTasks, setCrmTasks] = useState<CRMTask[]>(INITIAL_CRM_TASKS);

  // Inventory & Picking
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>(INITIAL_INVENTORY_COUNTS);
  const [orderPickings, setOrderPickings] = useState<OrderPicking[]>(INITIAL_ORDER_PICKINGS);

  // Alerts & Rules
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>(INITIAL_SMART_ALERTS);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(INITIAL_AUTOMATION_RULES);

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('ei_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Offline
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() => {
    const saved = localStorage.getItem('ei_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  // Scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerCallback, setScannerCallback] = useState<((code: string) => void) | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('ei_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ei_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('ei_transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('ei_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('ei_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('ei_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ei_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem('ei_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Derived current models
  const currentCompany = useMemo(() => {
    return (
      (companies && companies.find((c) => c.id === currentCompanyId)) ||
      (companies && companies[0]) ||
      INITIAL_COMPANIES[0]
    );
  }, [companies, currentCompanyId]);

  const allBranches = useMemo(() => {
    return (companies || []).flatMap((c) => c?.branches || []);
  }, [companies]);

  const currentBranch = useMemo(() => {
    if (currentBranchId === 'all') return null;
    return allBranches.find((b) => b.id === currentBranchId) || null;
  }, [allBranches, currentBranchId]);

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  const switchUserRole = (role: Role) => {
    const foundUser = users.find((u) => u.role === role);
    if (foundUser) {
      setCurrentUserId(foundUser.id);
      addToast('info', 'Perfil Alterado', `Agora operando como ${foundUser.name} (${foundUser.role.toUpperCase()})`);
      logAudit('EDICAO', 'Sessão de Usuário', `Alternou perfil ativo para ${foundUser.name} (${role})`);
    }
  };

  const checkPermission = (requiredRoles: Role[]): boolean => {
    return requiredRoles.includes(currentUser.role);
  };

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (
    action: AuditLog['action'],
    entity: string,
    details: string,
    previousValue?: string,
    newValue?: string
  ) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      branchName: currentBranch?.name || 'Visão Consolidada Grupo',
      action,
      entity,
      details,
      previousValue,
      newValue,
      device: surface === 'web' ? 'Web Desktop' : 'Mobile App (Android)',
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  };

  // Product helpers
  const getProductById = (id: string) => products.find((p) => p.id === id);
  const getProductByBarcode = (barcode: string) =>
    products.find((p) => p.barcode === barcode || p.variations?.some((v) => v.barcode === barcode));

  // Dynamic kit stock calculation: Min availability among all components
  const calculateKitAvailability = (kitProduct: Product, branchId?: string): number => {
    const targetBranch = branchId || (currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId);
    if (!kitProduct.isKit || !kitProduct.components || kitProduct.components.length === 0) {
      return kitProduct.stockByBranch[targetBranch]?.available ?? 0;
    }

    let minBuildable = Infinity;
    for (const comp of kitProduct.components) {
      const compProd = products.find((p) => p.id === comp.componentProductId);
      if (!compProd) {
        minBuildable = 0;
        break;
      }
      const stock = compProd.stockByBranch[targetBranch]?.available ?? 0;
      const buildableFromThis = Math.floor(stock / comp.quantityNeeded);
      if (buildableFromThis < minBuildable) {
        minBuildable = buildableFromThis;
      }
    }
    return minBuildable === Infinity ? 0 : minBuildable;
  };

  const addProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    logAudit('CRIACAO', `Produto: ${product.name}`, `Cadastrado código ${product.internalCode} / EAN ${product.barcode}`);
    addToast('success', 'Produto Cadastrado', `${product.name} adicionado ao catálogo.`);
  };

  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    logAudit('EDICAO', `Produto: ${product.name}`, `Atualizadas informações cadastrais.`);
    addToast('success', 'Produto Atualizado', `${product.name} salvo com sucesso.`);
  };

  const deleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    logAudit('EXCLUSAO', `Produto Excluído: ${prod.name}`, `Removido do catálogo (EAN: ${prod.barcode})`);
    addToast('info', 'Produto Excluído', `${prod.name} foi removido do catálogo com sucesso.`);
  };

  // Stock adjustments
  const adjustStock = (
    productId: string,
    branchId: string,
    delta: number,
    type: StockMovement['type'],
    notes?: string,
    lotNumber?: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const branchStock = prod.stockByBranch[branchId] || { current: 0, reserved: 0, available: 0 };
    const prevCurrent = branchStock.current;
    const newCurrent = Math.max(0, prevCurrent + delta);
    const newAvailable = Math.max(0, newCurrent - branchStock.reserved);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          stockByBranch: {
            ...p.stockByBranch,
            [branchId]: {
              ...branchStock,
              current: newCurrent,
              available: newAvailable,
            },
          },
        };
      })
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      productId,
      productName: prod.name,
      branchId,
      type,
      quantity: Math.abs(delta),
      previousStock: prevCurrent,
      newStock: newCurrent,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      notes,
      lotNumber,
    };

    setStockMovements((prev) => [movement, ...prev]);
    logAudit('AJUSTE_ESTOQUE', `Estoque: ${prod.name}`, `${type.toUpperCase()}: ${delta > 0 ? '+' : ''}${delta} un. (De ${prevCurrent} para ${newCurrent})`);
  };

  // Complete sale at PDV
  const completeSale = (saleData: {
    items: SaleItem[];
    subtotal: number;
    discountAmount: number;
    total: number;
    customerId?: string;
    customerName?: string;
    paymentMethods: { type: any; amount: number }[];
    sellerId: string;
    sellerName: string;
  }): Sale | null => {
    const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;
    const saleCode = `VD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Process stock deductions
    for (const item of saleData.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;

      if (prod.isKit && prod.components && prod.components.length > 0) {
        // Atomic deduction of all kit components!
        for (const comp of prod.components) {
          const compProd = products.find((p) => p.id === comp.componentProductId);
          const totalCompDeduction = comp.quantityNeeded * item.quantity;
          adjustStock(
            comp.componentProductId,
            targetBranch,
            -totalCompDeduction,
            'baixa_kit',
            `Venda de Kit ${prod.name} (Venda #${saleCode})`
          );
        }
      } else {
        adjustStock(
          item.productId,
          targetBranch,
          -item.quantity,
          'saida_venda',
          `Venda PDV #${saleCode}`
        );
      }
    }

    // Calculate commission (ex: 3%)
    const commission = Number(((saleData.total || 0) * 0.03).toFixed(2));

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      code: saleCode,
      branchId: targetBranch,
      companyId: currentCompanyId,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      sellerId: saleData.sellerId,
      sellerName: saleData.sellerName,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: saleData.items,
      subtotal: saleData.subtotal,
      discountAmount: saleData.discountAmount,
      total: saleData.total,
      paymentMethods: saleData.paymentMethods,
      commissionAmount: commission,
      status: 'concluida',
    };

    setSales((prev) => [newSale, ...prev]);

    // Update customer totalSpent & loyalty points if registered
    if (saleData.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== saleData.customerId) return c;
          const pointsEarned = Math.floor(saleData.total / 10);
          return {
            ...c,
            totalSpent: c.totalSpent + saleData.total,
            loyaltyPoints: c.loyaltyPoints + pointsEarned,
            relationshipStage: 'cliente_ativo',
          };
        })
      );
    }

    // Update cashier session
    const cashPaid = saleData.paymentMethods.find((p) => p.type === 'dinheiro')?.amount || 0;
    const cardPaid =
      (saleData.paymentMethods.find((p) => p.type === 'cartao_credito')?.amount || 0) +
      (saleData.paymentMethods.find((p) => p.type === 'cartao_debito')?.amount || 0);
    const pixPaid = saleData.paymentMethods.find((p) => p.type === 'pix')?.amount || 0;
    const creditPaid = saleData.paymentMethods.find((p) => p.type === 'credito_loja')?.amount || 0;

    setCashierSession((prev) => ({
      ...prev,
      cashSales: prev.cashSales + cashPaid,
      cardSales: prev.cardSales + cardPaid,
      pixSales: prev.pixSales + pixPaid,
      storeCreditSales: prev.storeCreditSales + creditPaid,
    }));

    logAudit('VENDA_PDV', `Venda ${saleCode}`, `Total R$ ${(saleData.total ?? 0).toFixed(2)} — ${(saleData.items || []).length} itens.`);
    addToast('success', 'Venda Finalizada!', `Venda #${saleCode} registrada com sucesso. Estoque atualizado.`);
    return newSale;
  };

  const openCashierSession = (initialBalance: number) => {
    const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;
    setCashierSession({
      id: `cash-${Date.now()}`,
      branchId: targetBranch,
      openedBy: currentUser.name,
      openedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      initialBalance,
      cashSales: 0,
      cardSales: 0,
      pixSales: 0,
      storeCreditSales: 0,
      withdrawals: [],
      deposits: [],
      status: 'aberto',
    });
    logAudit('APROVACAO', 'Sessão de Caixa', `Abertura com troco inicial R$ ${(initialBalance ?? 0).toFixed(2)}`);
    addToast('success', 'Caixa Aberto', `Sessão iniciada por ${currentUser.name}`);
  };

  const closeCashierSession = (finalCountedCash: number) => {
    const expectedCash =
      (cashierSession.initialBalance || 0) +
      (cashierSession.cashSales || 0) +
      (cashierSession.deposits || []).reduce((acc, d) => acc + (d.amount || 0), 0) -
      (cashierSession.withdrawals || []).reduce((acc, w) => acc + (w.amount || 0), 0);

    const diff = finalCountedCash - expectedCash;

    setCashierSession((prev) => ({
      ...prev,
      status: 'fechado',
      closedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      finalCountedCash,
      difference: diff,
    }));

    logAudit(
      'APROVACAO',
      'Fechamento de Caixa',
      `Esperado: R$ ${(expectedCash ?? 0).toFixed(2)}, Contado: R$ ${(finalCountedCash ?? 0).toFixed(2)}, Diferença: R$ ${(diff ?? 0).toFixed(2)}`
    );
    addToast('info', 'Caixa Fechado', `Fechamento concluído. Diferença apurada: R$ ${(diff ?? 0).toFixed(2)}`);
  };

  const addCashierMovement = (type: 'sangria' | 'reforco', amount: number, reason: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (type === 'sangria') {
      setCashierSession((prev) => ({
        ...prev,
        withdrawals: [...prev.withdrawals, { time, amount, reason, user: currentUser.name }],
      }));
      logAudit('EDICAO', 'Sangria de Caixa', `Retirada de R$ ${(amount ?? 0).toFixed(2)}: ${reason}`);
      addToast('info', 'Sangria Registrada', `R$ ${(amount ?? 0).toFixed(2)} retirados.`);
    } else {
      setCashierSession((prev) => ({
        ...prev,
        deposits: [...prev.deposits, { time, amount, reason, user: currentUser.name }],
      }));
      logAudit('EDICAO', 'Reforço de Caixa', `Entrada de R$ ${(amount ?? 0).toFixed(2)}: ${reason}`);
      addToast('success', 'Reforço Registrado', `R$ ${(amount ?? 0).toFixed(2)} adicionados.`);
    }
  };

  // Transfers
  const createTransfer = (data: Omit<TransferRequest, 'id' | 'code' | 'requestedAt' | 'status'>) => {
    const code = `TRF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newTransfer: TransferRequest = {
      ...data,
      id: `trf-${Date.now()}`,
      code,
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'solicitado',
    };
    setTransfers((prev) => [newTransfer, ...prev]);
    logAudit('CRIACAO', `Transferência ${code}`, `Solicitada transferência de ${data.items.length} itens.`);
    addToast('success', 'Transferência Solicitada', `Código ${code} gerado para aprovação.`);
  };

  const approveTransfer = (transferId: string): boolean => {
    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return false;

    // Check approval threshold: if transfer > branch limit, must be 'dono' or 'gerente'
    const sourceBranch = allBranches.find((b) => b.id === trf.sourceBranchId);
    const limit = sourceBranch?.approvalLimitAmount || 10000;
    if (trf.totalValue > limit && currentUser.role !== 'dono') {
      addToast('error', 'Alçada Excedida', `Transferência de R$ ${(trf.totalValue ?? 0).toFixed(2)} exige aprovação do Dono do Grupo.`);
      return false;
    }

    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        return {
          ...t,
          status: 'aprovado',
          approvedBy: currentUser.name,
          approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );
    logAudit('APROVACAO', `Transferência ${trf.code}`, `Aprovada por ${currentUser.name}`);
    addToast('success', 'Transferência Aprovada', `Liberada para separação e despacho.`);
    return true;
  };

  const dispatchTransfer = (transferId: string) => {
    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return;

    // Deduct from source branch stock and put in transit
    for (const item of trf.items) {
      adjustStock(
        item.productId,
        trf.sourceBranchId,
        -(item.dispatchedQty || item.requestedQty),
        'transferencia_saida',
        `Expedição Transferência ${trf.code}`
      );
    }

    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        return {
          ...t,
          status: 'em_transito',
          dispatchedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      })
    );
    logAudit('EDICAO', `Transferência ${trf.code}`, `Carga despachada em trânsito.`);
    addToast('info', 'Em Trânsito', `Carga despachada. Aguardando recebimento no destino.`);
  };

  const receiveTransfer = (
    transferId: string,
    receivedItems: { productId: string; receivedQty: number; divergenceReason?: string }[]
  ) => {
    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return;

    // Add to destination branch stock
    for (const rec of receivedItems) {
      adjustStock(
        rec.productId,
        trf.destBranchId,
        rec.receivedQty,
        'transferencia_entrada',
        `Entrada por Transferência ${trf.code}${rec.divergenceReason ? ` (Divergência: ${rec.divergenceReason})` : ''}`
      );
    }

    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        return {
          ...t,
          status: 'recebido_conferido',
          receivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          items: t.items.map((it) => {
            const match = receivedItems.find((r) => r.productId === it.productId);
            return {
              ...it,
              receivedQty: match ? match.receivedQty : it.requestedQty,
              divergenceReason: match?.divergenceReason,
            };
          }),
        };
      })
    );
    logAudit('APROVACAO', `Transferência ${trf.code}`, `Conferida e recebida na filial destino.`);
    addToast('success', 'Recebimento Concluído', `Itens conferidos e adicionados ao estoque da filial destino.`);
  };

  // Purchases
  const createPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'code' | 'createdAt'>) => {
    const code = `PC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: `po-${Date.now()}`,
      code,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    logAudit('CRIACAO', `Pedido de Compra ${code}`, `Criado pedido no valor de R$ ${(po.totalAmount ?? 0).toFixed(2)}`);
    addToast('success', 'Pedido de Compra Criado', `Pedido #${code} enviado para o fornecedor.`);
  };

  const receivePurchaseOrder = (
    orderId: string,
    divergences: { productId: string; expected: number; received: number; type: 'falta' | 'sobra' | 'avaria' }[],
    invoiceNumber: string
  ) => {
    const po = purchaseOrders.find((p) => p.id === orderId);
    if (!po) return;

    for (const item of po.items) {
      const div = divergences.find((d) => d.productId === item.productId);
      const effectiveQty = div ? div.received : item.quantity;
      adjustStock(
        item.productId,
        po.targetBranchId,
        effectiveQty,
        'entrada',
        `Recebimento Compra #${po.code} (NF ${invoiceNumber})`
      );
    }

    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id !== orderId) return p;
        return {
          ...p,
          status: divergences.some((d) => d.received < d.expected) ? 'recebido_parcial' : 'recebido_total',
          invoiceNumber,
          items: p.items.map((it) => {
            const div = divergences.find((d) => d.productId === it.productId);
            return {
              ...it,
              quantityReceived: div ? div.received : it.quantity,
            };
          }),
          receivingCheck: {
            receivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            checkedBy: currentUser.name,
            divergences,
          },
        };
      })
    );

    logAudit('APROVACAO', `Recebimento Compra ${po.code}`, `Entrada no estoque sob NF ${invoiceNumber}`);
    addToast('success', 'Mercadoria Recebida', `Estoque atualizado e contas a pagar geradas automaticamente.`);
  };

  const createQuotation = (quoteData: Omit<Quotation, 'id' | 'code' | 'createdAt'>): Quotation => {
    const code = `COT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newQuote: Quotation = {
      ...quoteData,
      id: `quot-${Date.now()}`,
      code,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setQuotations((prev) => [newQuote, ...prev]);
    logAudit('CRIACAO', `Cotação ${code}`, `Nova cotação criada para ${quoteData.productName}`);
    addToast('success', 'Cotação Registrada', `Cotação #${code} criada com ${quoteData.options.length} fornecedor(es).`);
    return newQuote;
  };

  const approveQuotationOption = (quotationId: string, supplierId: string, targetBranchId?: string) => {
    const quote = quotations.find((q) => q.id === quotationId);
    if (!quote) return;
    const opt = quote.options.find((o) => o.supplierId === supplierId);
    if (!opt) return;

    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotationId
          ? {
              ...q,
              status: 'concluida',
              options: q.options.map((o) => ({ ...o, isWinner: o.supplierId === supplierId })),
            }
          : q
      )
    );

    const destBranch = targetBranchId || (currentBranchId !== 'all' ? currentBranchId : 'branch-cd-sp');
    const totalAmount = opt.pricePerUnit * quote.requestedQuantity;
    const deliveryDays = opt.deliveryDays || 5;
    const expectedDelivery = new Date(Date.now() + deliveryDays * 86400000).toISOString().substring(0, 10);

    createPurchaseOrder({
      supplierId: opt.supplierId,
      supplierName: opt.supplierName,
      targetBranchId: destBranch,
      status: 'enviado',
      expectedDeliveryDate: expectedDelivery,
      items: [
        {
          productId: quote.productId,
          productName: quote.productName,
          quantity: quote.requestedQuantity,
          unitCost: opt.pricePerUnit,
          totalCost: totalAmount,
        },
      ],
      totalAmount,
      notes: `Gerado a partir da Cotação Vencedora #${quote.code} (${opt.paymentTerm}).`,
    });
  };

  // CRM
  const addCustomer = (cust: Customer) => {
    setCustomers((prev) => [cust, ...prev]);
    logAudit('CRIACAO', `Cliente: ${cust.name}`, `Novo cadastro no CRM`);
    addToast('success', 'Cliente Cadastrado', `${cust.name} adicionado.`);
  };

  const updateCustomerStage = (customerId: string, stage: Customer['relationshipStage']) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, relationshipStage: stage } : c))
    );
    addToast('info', 'Estágio do Funil Atualizado', `Cliente movido para ${stage.replace('_', ' ').toUpperCase()}`);
  };

  const addCRMTask = (task: Omit<CRMTask, 'id'>) => {
    const newTask: CRMTask = { ...task, id: `task-${Date.now()}` };
    setCrmTasks((prev) => [newTask, ...prev]);
    addToast('success', 'Tarefa Criada', `Follow-up agendado para ${task.dueDate}`);
  };

  const toggleCRMTask = (taskId: string) => {
    setCrmTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Inventory count & cycle
  const startInventoryCount = (categoryFilter?: string): InventoryCount => {
    const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;
    const code = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const filteredProds = categoryFilter
      ? products.filter((p) => p.category === categoryFilter)
      : products.slice(0, 8); // Top items for cycle count

    const newCount: InventoryCount = {
      id: `inv-${Date.now()}`,
      code,
      branchId: targetBranch,
      date: new Date().toISOString().substring(0, 10),
      countedBy: currentUser.name,
      status: 'em_andamento',
      categoryFilter,
      items: filteredProds.map((p) => {
        const sysQty = p.stockByBranch[targetBranch]?.current || 0;
        return {
          productId: p.id,
          productName: p.name,
          barcode: p.barcode,
          systemQuantity: sysQty,
          countedQuantity: sysQty, // default match until scanned
          difference: 0,
          costImpact: 0,
        };
      }),
    };

    setInventoryCounts((prev) => [newCount, ...prev]);
    logAudit('CRIACAO', `Inventário Cíclico ${code}`, `Iniciada contagem na filial`);
    addToast('info', 'Inventário Aberto', `Coleta de dados iniciada: #${code}`);
    return newCount;
  };

  const updateInventoryItemCount = (
    countId: string,
    productId: string,
    countedQty: number,
    lotNumber?: string
  ) => {
    setInventoryCounts((prev) =>
      prev.map((inv) => {
        if (inv.id !== countId) return inv;
        return {
          ...inv,
          items: inv.items.map((it) => {
            if (it.productId !== productId) return it;
            const diff = countedQty - it.systemQuantity;
            const prod = products.find((p) => p.id === productId);
            const costImpact = Number((diff * (prod?.costPrice || 0)).toFixed(2));
            return {
              ...it,
              countedQuantity: countedQty,
              difference: diff,
              costImpact,
              lotNumber,
            };
          }),
        };
      })
    );
  };

  const finalizeInventoryCount = (countId: string) => {
    const inv = inventoryCounts.find((i) => i.id === countId);
    if (!inv) return;

    // Apply adjustments to stock
    for (const item of inv.items) {
      if (item.difference !== 0) {
        adjustStock(
          item.productId,
          inv.branchId,
          item.difference,
          'ajuste_inventario',
          `Ajuste por Inventário ${inv.code}`,
          item.lotNumber
        );
      }
    }

    setInventoryCounts((prev) =>
      prev.map((i) => (i.id === countId ? { ...i, status: 'finalizado_ajustado' } : i))
    );
    logAudit('AJUSTE_ESTOQUE', `Inventário ${inv.code}`, `Finalizado com ajustes aplicados`);
    addToast('success', 'Inventário Finalizado', `Ajustes aplicados ao estoque.`);
  };

  const updatePickingItem = (pickingId: string, productId: string, pickedQty: number, isVerified: boolean) => {
    setOrderPickings((prev) =>
      prev.map((p) => {
        if (p.id !== pickingId) return p;
        const updatedItems = p.items.map((it) =>
          it.productId === productId ? { ...it, pickedQty, isVerified } : it
        );
        const allDone = updatedItems.every((it) => it.isVerified && it.pickedQty >= it.requestedQty);
        return {
          ...p,
          items: updatedItems,
          status: allDone ? 'conferido' : 'separando',
        };
      })
    );
    if (isVerified) {
      addToast('success', 'Item Bipado', `Item conferido na separação.`);
    }
  };

  // Alerts & Rules
  const markAlertRead = (alertId: string) => {
    setSmartAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    );
  };

  const toggleAutomationRule = (ruleId: string) => {
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
    addToast('info', 'Regra Alterada', 'Estado da automação atualizado.');
  };

  // Offline queue engine
  const queueOfflineAction = (type: OfflineAction['type'], payload: any, description: string) => {
    const action: OfflineAction = {
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      type,
      payload,
      status: 'pendente',
      description,
    };
    setOfflineQueue((prev) => [...prev, action]);
    addToast('warning', 'Ação Salva Offline', `${description} entrará na fila de sincronização.`);
  };

  const syncOfflineQueue = () => {
    if (offlineQueue.length === 0) {
      addToast('info', 'Sincronização', 'Nenhuma ação pendente na fila offline.');
      return;
    }

    const count = offlineQueue.length;
    // Process queued actions
    for (const item of offlineQueue) {
      if (item.type === 'AJUSTE_RAPIDO' && item.payload) {
        adjustStock(
          item.payload.productId,
          item.payload.branchId,
          item.payload.delta,
          'ajuste_inventario',
          `Sincronizado Offline: ${item.description}`
        );
      }
    }

    setOfflineQueue([]);
    logAudit('SINCRONIZACAO_OFFLINE', 'Fila Offline', `${count} operações sincronizadas com o servidor.`);
    addToast('success', 'Sincronização Concluída!', `${count} operações offline foram integradas com sucesso.`);
  };

  // Barcode scanner modal trigger
  const openBarcodeScanner = (onScanned: (barcode: string) => void) => {
    setScannerCallback(() => onScanned);
    setIsScannerOpen(true);
  };

  const closeBarcodeScanner = () => {
    setIsScannerOpen(false);
    setScannerCallback(null);
  };

  return (
    <AppContext.Provider
      value={{
        surface,
        setSurface,
        mobileDeviceFrame,
        setMobileDeviceFrame,
        activeTab,
        setActiveTab,
        companies,
        allCompanies: companies,
        currentCompanyId,
        setCurrentCompanyId,
        currentBranchId,
        setCurrentBranchId,
        setBranchId: setCurrentBranchId,
        currentCompany,
        currentBranch,
        allBranches,
        users,
        currentUser,
        switchUserRole,
        checkPermission,
        products,
        lots,
        stockMovements,
        getProductById,
        getProductByBarcode,
        calculateKitAvailability,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        sales,
        cashierSession,
        completeSale,
        openCashierSession,
        closeCashierSession,
        addCashierMovement,
        transfers,
        createTransfer,
        approveTransfer,
        dispatchTransfer,
        receiveTransfer,
        suppliers,
        purchaseOrders,
        quotations,
        createPurchaseOrder,
        createQuotation,
        approveQuotationOption,
        receivePurchaseOrder,
        customers,
        crmTasks,
        addCustomer,
        updateCustomerStage,
        addCRMTask,
        toggleCRMTask,
        inventoryCounts,
        orderPickings,
        startInventoryCount,
        updateInventoryItemCount,
        finalizeInventoryCount,
        updatePickingItem,
        smartAlerts,
        markAlertRead,
        automationRules,
        toggleAutomationRule,
        auditLogs,
        logAudit,
        isOffline,
        setIsOffline,
        offlineQueue,
        queueOfflineAction,
        syncOfflineQueue,
        isScannerOpen,
        scannerCallback,
        openBarcodeScanner,
        closeBarcodeScanner,
        toasts,
        addToast,
        removeToast,
        isSearchOpen,
        setIsSearchOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
