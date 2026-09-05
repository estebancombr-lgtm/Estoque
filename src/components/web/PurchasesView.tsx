import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileCheck2,
  Plus,
  Barcode,
  Truck,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  X,
  Package,
  Search,
  Filter,
  Calendar,
  Building2,
  Store,
  FileText,
  Check,
  ShieldCheck,
  Layers,
  Eye,
  Trash2,
  ArrowDownLeft,
  Sparkles,
  Award,
  TrendingDown,
  Info,
  CheckCheck,
} from 'lucide-react';
import { PurchaseOrder, Quotation } from '../../types';

export const PurchasesView: React.FC = () => {
  const {
    purchaseOrders,
    suppliers,
    quotations,
    products,
    allBranches,
    currentBranchId,
    createPurchaseOrder,
    createQuotation,
    approveQuotationOption,
    receivePurchaseOrder,
    addToast,
    openBarcodeScanner,
  } = useApp();

  // Navigation tabs
  const [activeTabSub, setActiveTabSub] = useState<'pedidos' | 'cotacoes' | 'recebimento'>('pedidos');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [branchFilter, setBranchFilter] = useState<string>('todos');

  // Modals state
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);
  const [isStartReceivingModalOpen, setIsStartReceivingModalOpen] = useState(false);
  const [conferringOrder, setConferringOrder] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // Conference state
  const [scannedCounts, setScannedCounts] = useState<Record<string, number>>({});
  const [damagedCounts, setDamagedCounts] = useState<Record<string, number>>({});
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');

  // ---------------------------------------------------------
  // FORM STATE: NOVO PEDIDO DE COMPRA
  // ---------------------------------------------------------
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poBranchId, setPoBranchId] = useState(
    currentBranchId !== 'all' ? currentBranchId : allBranches[0]?.id || 'branch-cd-sp'
  );
  const [poDeliveryDate, setPoDeliveryDate] = useState(() => {
    const d = new Date(Date.now() + 5 * 86400000);
    return d.toISOString().substring(0, 10);
  });
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    { productId: string; productName: string; quantity: number; unitCost: number }[]
  >([]);

  // Item being added to PO
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState<number>(10);
  const [selectedUnitCost, setSelectedUnitCost] = useState<number>(0);

  // ---------------------------------------------------------
  // FORM STATE: NOVA COTAÇÃO
  // ---------------------------------------------------------
  const [quoteProductId, setQuoteProductId] = useState('');
  const [quoteQuantity, setQuoteQuantity] = useState<number>(50);
  const [quoteOptions, setQuoteOptions] = useState<
    { supplierId: string; supplierName: string; pricePerUnit: number; deliveryDays: number; paymentTerm: string }[]
  >([]);

  // Option being added to Quotation
  const [quoteSupplierId, setQuoteSupplierId] = useState('');
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteDeliveryDays, setQuoteDeliveryDays] = useState<number>(3);
  const [quotePaymentTerm, setQuotePaymentTerm] = useState('30 dias');

  // Reset PO Form
  const resetPOForm = () => {
    setPoSupplierId('');
    setPoBranchId(currentBranchId !== 'all' ? currentBranchId : allBranches[0]?.id || 'branch-cd-sp');
    setPoDeliveryDate(new Date(Date.now() + 5 * 86400000).toISOString().substring(0, 10));
    setPoNotes('');
    setPoItems([]);
    setSelectedProductId('');
    setSelectedQty(10);
    setSelectedUnitCost(0);
  };

  // Reset Quotation Form
  const resetQuoteForm = () => {
    setQuoteProductId('');
    setQuoteQuantity(50);
    setQuoteOptions([]);
    setQuoteSupplierId('');
    setQuotePrice(0);
    setQuoteDeliveryDays(3);
    setQuotePaymentTerm('30 dias');
  };

  // Handle product select in PO form
  const handleSelectProductForPO = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSelectedUnitCost(prod.costPrice || 0);
    }
  };

  // Add Item to PO
  const handleAddItemToPO = () => {
    if (!selectedProductId) {
      addToast('warning', 'Produto Obrigatório', 'Selecione um produto para adicionar ao pedido.');
      return;
    }
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (selectedQty <= 0) {
      addToast('warning', 'Quantidade Inválida', 'A quantidade deve ser maior que zero.');
      return;
    }

    const existingIndex = poItems.findIndex((it) => it.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...poItems];
      updated[existingIndex].quantity += selectedQty;
      updated[existingIndex].unitCost = selectedUnitCost;
      setPoItems(updated);
    } else {
      setPoItems([
        ...poItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: selectedQty,
          unitCost: selectedUnitCost,
        },
      ]);
    }

    // Reset item selector
    setSelectedProductId('');
    setSelectedQty(10);
    setSelectedUnitCost(0);
  };

  // Remove Item from PO
  const handleRemoveItemFromPO = (productId: string) => {
    setPoItems(poItems.filter((i) => i.productId !== productId));
  };

  // Submit PO
  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      addToast('error', 'Fornecedor Obrigatório', 'Selecione um fornecedor para emitir o pedido.');
      return;
    }
    if (!poBranchId) {
      addToast('error', 'Filial Obrigatória', 'Selecione a filial de destino do pedido.');
      return;
    }
    if (poItems.length === 0) {
      addToast('error', 'Itens Obrigatórios', 'Adicione pelo menos um item ao pedido de compra.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === poSupplierId);
    const totalAmount = poItems.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);

    createPurchaseOrder({
      supplierId: poSupplierId,
      supplierName: supplier?.name || 'Fornecedor Não Identificado',
      targetBranchId: poBranchId,
      status: 'enviado',
      expectedDeliveryDate: poDeliveryDate,
      items: poItems.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitCost: it.unitCost,
        totalCost: it.quantity * it.unitCost,
      })),
      totalAmount,
      notes: poNotes || 'Pedido emitido via Painel de Compras.',
    });

    setIsNewPOModalOpen(false);
    resetPOForm();
  };

  // Add Option to Quotation
  const handleAddOptionToQuote = () => {
    if (!quoteSupplierId) {
      addToast('warning', 'Fornecedor Obrigatório', 'Selecione um fornecedor para a proposta.');
      return;
    }
    if (quotePrice <= 0) {
      addToast('warning', 'Preço Inválido', 'O valor unitário deve ser maior que zero.');
      return;
    }

    const supp = suppliers.find((s) => s.id === quoteSupplierId);
    if (!supp) return;

    if (quoteOptions.some((o) => o.supplierId === quoteSupplierId)) {
      addToast('info', 'Fornecedor Já Adicionado', 'Este fornecedor já foi adicionado à cotação.');
      return;
    }

    setQuoteOptions([
      ...quoteOptions,
      {
        supplierId: supp.id,
        supplierName: supp.name,
        pricePerUnit: quotePrice,
        deliveryDays: quoteDeliveryDays,
        paymentTerm: quotePaymentTerm,
      },
    ]);

    setQuoteSupplierId('');
    setQuotePrice(0);
    setQuoteDeliveryDays(3);
    setQuotePaymentTerm('30 dias');
  };

  // Submit Quotation
  const handleCreateQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteProductId) {
      addToast('error', 'Produto Obrigatório', 'Selecione o produto a ser cotado.');
      return;
    }
    if (quoteQuantity <= 0) {
      addToast('error', 'Quantidade Inválida', 'A quantidade deve ser maior que zero.');
      return;
    }
    if (quoteOptions.length === 0) {
      addToast('error', 'Propostas Obrigatórias', 'Adicione pelo menos uma proposta de fornecedor.');
      return;
    }

    const prod = products.find((p) => p.id === quoteProductId);

    createQuotation({
      productId: quoteProductId,
      productName: prod?.name || 'Produto Não Identificado',
      requestedQuantity: quoteQuantity,
      status: 'em_aberto',
      options: quoteOptions,
    });

    setIsNewQuotationModalOpen(false);
    resetQuoteForm();
  };

  // Start conference for a PO
  const handleStartConferrence = (order: PurchaseOrder) => {
    const counts: Record<string, number> = {};
    const damaged: Record<string, number> = {};
    order.items.forEach((item) => {
      counts[item.productId] = item.quantityReceived || 0;
      damaged[item.productId] = 0;
    });
    setScannedCounts(counts);
    setDamagedCounts(damaged);
    setInvoiceNumberInput(order.invoiceNumber || `NF-${Math.floor(100000 + Math.random() * 900000)}-A`);
    setConferringOrder(order);
  };

  // Bipar produto
  const handleBipProduct = (barcode: string) => {
    if (!conferringOrder) return;
    const prod = products.find((p) => p.barcode === barcode);
    if (!prod) {
      addToast('error', 'Código Desconhecido', `EAN ${barcode} não pertence a este catálogo.`);
      return;
    }

    const orderItem = conferringOrder.items.find((i) => i.productId === prod.id);
    if (!orderItem) {
      addToast('warning', 'Item Fora do Pedido', `${prod.name} não consta no pedido #${conferringOrder.code}!`);
      return;
    }

    const current = scannedCounts[prod.id] || 0;
    const nextCount = current + 1;
    setScannedCounts((prev) => ({ ...prev, [prod.id]: nextCount }));
    addToast('success', 'Item Bipado com Sucesso', `${prod.name}: ${nextCount}/${orderItem.quantity} un.`);
  };

  // Finish conference
  const handleFinishConferrence = () => {
    if (!conferringOrder) return;

    if (!invoiceNumberInput.trim()) {
      addToast('warning', 'Número da NF Obrigatório', 'Informe o número da Nota Fiscal ou Chave de Acesso para dar entrada fiscal.');
      return;
    }

    const divergences: { productId: string; expected: number; received: number; type: 'falta' | 'sobra' | 'avaria' }[] = [];

    conferringOrder.items.forEach((item) => {
      const received = scannedCounts[item.productId] || 0;
      const damaged = damagedCounts[item.productId] || 0;

      if (damaged > 0) {
        divergences.push({
          productId: item.productId,
          expected: item.quantity,
          received,
          type: 'avaria',
        });
      } else if (received < item.quantity) {
        divergences.push({
          productId: item.productId,
          expected: item.quantity,
          received,
          type: 'falta',
        });
      } else if (received > item.quantity) {
        divergences.push({
          productId: item.productId,
          expected: item.quantity,
          received,
          type: 'sobra',
        });
      }
    });

    receivePurchaseOrder(conferringOrder.id, divergences, invoiceNumberInput.trim());
    setConferringOrder(null);
  };

  // Filter Purchase Orders
  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items.some((it) => it.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'aguardando' && (po.status === 'enviado' || po.status === 'aprovado')) ||
      (statusFilter === 'recebido' && (po.status === 'recebido_total' || po.status === 'recebido_parcial')) ||
      po.status === statusFilter;

    const matchesBranch = branchFilter === 'todos' || po.targetBranchId === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Calculate high level metrics
  const activeOrdersCount = purchaseOrders.filter((p) => p.status === 'enviado' || p.status === 'aprovado').length;
  const inTransitValue = purchaseOrders
    .filter((p) => p.status === 'enviado' || p.status === 'aprovado')
    .reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);
  const totalReceivedCount = purchaseOrders.filter(
    (p) => p.status === 'recebido_total' || p.status === 'recebido_parcial'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-blue-600" />
            Compras, Cotações & Recebimento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão integrada de cotações multifornecedor, emissão de pedidos de compra, conferência física/bipada e entrada fiscal de estoque.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-new-purchase-order"
            onClick={() => {
              resetPOForm();
              setIsNewPOModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Pedido de Compra
          </button>
          <button
            id="btn-new-quotation"
            onClick={() => {
              resetQuoteForm();
              setIsNewQuotationModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Nova Cotação
          </button>
          <button
            id="btn-start-receiving-shortcut"
            onClick={() => setIsStartReceivingModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Barcode className="w-4 h-4" /> Iniciar Recebimento
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pedidos em Aberto</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{activeOrdersCount} pedidos</div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Aguardando entrega do fornecedor</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor em Trânsito</div>
            <div className="text-xl font-black text-blue-700 mt-0.5">
              R$ {inTransitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">Custo de mercadorias contratadas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entradas Concluídas</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{totalReceivedCount} recebidos</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Estoque e custos atualizados</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          id="tab-pedidos"
          onClick={() => setActiveTabSub('pedidos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSub === 'pedidos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Pedidos de Compra ({purchaseOrders.length})
        </button>

        <button
          id="tab-cotacoes"
          onClick={() => setActiveTabSub('cotacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSub === 'cotacoes'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Cotações & Matriz ({quotations.length})
        </button>

        <button
          id="tab-recebimento"
          onClick={() => setActiveTabSub('recebimento')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTabSub === 'recebimento'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Barcode className="w-4 h-4" />
          Recebimento & Conferência ({activeOrdersCount})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PEDIDOS DE COMPRA */}
      {/* ========================================================================= */}
      {activeTabSub === 'pedidos' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, fornecedor ou item..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="todos">Todos os Status</option>
                <option value="aguardando">Aguardando Entrega</option>
                <option value="recebido">Recebidos (Total / Parcial)</option>
                <option value="enviado">Enviado ao Fornecedor</option>
                <option value="recebido_total">Recebido 100%</option>
                <option value="recebido_parcial">Recebido Parcial</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">Filial:</span>
              </div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="todos">Todas as Filiais</option>
                {allBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Orders */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">Nenhum Pedido de Compra Encontrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'todos' || branchFilter !== 'todos'
                  ? 'Nenhum pedido atende aos filtros selecionados. Tente ajustar os termos de busca.'
                  : 'Nenhum pedido de compra foi cadastrado ainda. Clique no botão abaixo para criar o primeiro pedido.'}
              </p>
              <button
                onClick={() => {
                  resetPOForm();
                  setIsNewPOModalOpen(true);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Criar Novo Pedido
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredOrders.map((po) => {
                const branch = allBranches.find((b) => b.id === po.targetBranchId);
                const isFullyReceived = po.status === 'recebido_total';
                const isPartiallyReceived = po.status === 'recebido_parcial';
                const isWaiting = po.status === 'enviado' || po.status === 'aprovado';

                return (
                  <div
                    key={po.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 font-mono tracking-tight">
                              {po.code}
                            </span>
                            {isFullyReceived && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> RECEBIDO & CONFERIDO
                              </span>
                            )}
                            {isPartiallyReceived && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> RECEBIMENTO PARCIAL
                              </span>
                            )}
                            {isWaiting && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> AGUARDANDO ENTREGA
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-slate-800 mt-1.5 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {po.supplierName}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Store className="w-3 h-3 text-slate-400" /> Filial: {branch?.name || 'CD Central'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" /> Previsão: {po.expectedDeliveryDate}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor Total</div>
                          <div className="text-lg font-black text-slate-900">
                            R$ {(po.totalAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Criado em: {po.createdAt}</div>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                            <tr>
                              <th className="px-3 py-2">Item / Descrição</th>
                              <th className="px-3 py-2 text-center">Previsto</th>
                              <th className="px-3 py-2 text-center">Conferido</th>
                              <th className="px-3 py-2 text-right">Custo Unit.</th>
                              <th className="px-3 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {po.items.map((it) => {
                              const received = it.quantityReceived ?? (isFullyReceived ? it.quantity : 0);
                              return (
                                <tr key={it.productId} className="hover:bg-slate-50/60">
                                  <td className="px-3 py-2 font-medium text-slate-800">{it.productName}</td>
                                  <td className="px-3 py-2 text-center font-bold text-slate-700">
                                    {it.quantity} un.
                                  </td>
                                  <td className="px-3 py-2 text-center font-bold">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[11px] ${
                                        received >= it.quantity
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : received > 0
                                          ? 'bg-amber-50 text-amber-700'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {received} un.
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-slate-600">
                                    R$ {(it.unitCost ?? 0).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                                    R$ {(it.totalCost ?? (it.quantity * it.unitCost) ?? 0).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Notes or NF Info */}
                      {po.invoiceNumber && (
                        <div className="mt-2 text-[11px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between text-slate-600">
                          <span className="font-semibold">Nota Fiscal / Chave: {po.invoiceNumber}</span>
                          {po.receivingCheck && (
                            <span className="text-slate-500">
                              Recebido por {po.receivingCheck.checkedBy} em {po.receivingCheck.receivedAt}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setViewingPO(po)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Espelho do Pedido
                      </button>

                      <div className="flex items-center gap-2">
                        {!isFullyReceived ? (
                          <button
                            onClick={() => handleStartConferrence(po)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <Barcode className="w-3.5 h-3.5" /> Receber / Conferir Carga
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Estoque Atualizado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COTAÇÕES & MATRIZ MULTIFORNECEDOR */}
      {/* ========================================================================= */}
      {activeTabSub === 'cotacoes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Matriz Comparativa de Cotações Multifornecedor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare preços, prazos de entrega e condições de pagamento entre múltiplos parceiros homologados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    resetQuoteForm();
                    setIsNewQuotationModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" /> Nova Cotação
                </button>
              </div>
            </div>

            {quotations.length === 0 ? (
              <div className="py-12 text-center">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <div className="font-bold text-slate-700 text-sm">Nenhuma cotação em aberto</div>
                <p className="text-xs text-slate-500 mt-1">Crie uma cotação para negociar o melhor custo de reposição.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {quotations.map((quote) => {
                  const isConcluded = quote.status === 'concluida';
                  // Calculate best price
                  const sortedByPrice = [...quote.options].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
                  const lowestPrice = sortedByPrice[0]?.pricePerUnit;

                  return (
                    <div
                      key={quote.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {quote.code}
                            </span>
                            <span className="font-bold text-sm text-slate-900">{quote.productName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isConcluded ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isConcluded ? 'COTAÇÃO CONCLUÍDA' : 'EM NEGOCIAÇÃO'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Qtd. Solicitada: <strong>{quote.requestedQuantity} unidades</strong> &bull; Criada em:{' '}
                            {quote.createdAt}
                          </div>
                        </div>

                        {isConcluded && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1 self-start sm:self-auto">
                            <Award className="w-3.5 h-3.5" /> Fornecedor Escolhido & Pedido Gerado
                          </span>
                        )}
                      </div>

                      {/* Proposals Grid / Matrix */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {quote.options.map((opt) => {
                          const isLowest = opt.pricePerUnit === lowestPrice;
                          const isWinningOption = opt.isWinner;

                          return (
                            <div
                              key={opt.supplierId}
                              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                isWinningOption
                                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30'
                                  : isLowest
                                  ? 'bg-white border-emerald-300 shadow-xs'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between">
                                  <div className="font-extrabold text-xs text-slate-800 truncate pr-2">
                                    {opt.supplierName}
                                  </div>
                                  {isLowest && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                                      Menor Preço
                                    </span>
                                  )}
                                </div>

                                <div className="mt-3">
                                  <div className="text-lg font-black text-slate-900">
                                    R$ {(opt.pricePerUnit ?? 0).toFixed(2)}{' '}
                                    <span className="text-[10px] font-normal text-slate-500">/ un.</span>
                                  </div>
                                  <div className="text-xs font-mono text-slate-500">
                                    Total:{' '}
                                    <strong>
                                      R${' '}
                                      {(opt.pricePerUnit * quote.requestedQuantity).toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </strong>
                                  </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Prazo de Entrega:</span>
                                    <span className="font-semibold">{opt.deliveryDays} dias úteis</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Condição Comercial:</span>
                                    <span className="font-semibold">{opt.paymentTerm}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-2">
                                {isWinningOption ? (
                                  <div className="text-center py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Vencedor Aprovado
                                  </div>
                                ) : !isConcluded ? (
                                  <button
                                    onClick={() => approveQuotationOption(quote.id, opt.supplierId)}
                                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Aprovar & Emitir Pedido
                                  </button>
                                ) : (
                                  <div className="text-center text-[11px] text-slate-400 italic py-1">
                                    Não selecionado
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RECEBIMENTO & CONFERÊNCIA FÍSICA / BIPADA */}
      {/* ========================================================================= */}
      {activeTabSub === 'recebimento' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-indigo-600" />
                  Módulo de Recebimento de Mercadorias & Entrada Fiscal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conferência física às cegas ou bipada com leitor de código de barras. Validação contra divergências e atualização automática do estoque.
                </p>
              </div>

              <button
                onClick={() => setIsStartReceivingModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Selecionar Carga para Conferir
              </button>
            </div>

            {/* List of pending deliveries */}
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Cargas Aguardando Conferência ({activeOrdersCount})
              </div>

              {activeOrdersCount === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">Todas as cargas foram conferidas e recebidas!</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Quando novos pedidos forem emitidos para fornecedores, eles aparecerão aqui para recebimento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {purchaseOrders
                    .filter((p) => p.status === 'enviado' || p.status === 'aprovado' || p.status === 'recebido_parcial')
                    .map((po) => {
                      const branch = allBranches.find((b) => b.id === po.targetBranchId);
                      return (
                        <div
                          key={po.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-slate-900">{po.code}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Previsão: {po.expectedDeliveryDate}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-slate-800 mt-1">{po.supplierName}</div>
                            <div className="text-[11px] text-slate-500">
                              Destino: {branch?.name || 'Filial'} &bull; {po.items.length} itens a conferir
                            </div>
                          </div>

                          <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-700">
                              R$ {(po.totalAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              onClick={() => handleStartConferrence(po)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Barcode className="w-3.5 h-3.5" /> Abrir Conferência
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Recently received deliveries */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                Histórico de Cargas Recebidas Recentemente
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Fornecedor</th>
                      <th className="px-3 py-2">Filial Entrada</th>
                      <th className="px-3 py-2">Nota Fiscal</th>
                      <th className="px-3 py-2">Conferido Por</th>
                      <th className="px-3 py-2 text-right">Valor Total</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseOrders
                      .filter((p) => p.status === 'recebido_total' || p.status === 'recebido_parcial')
                      .map((po) => {
                        const branch = allBranches.find((b) => b.id === po.targetBranchId);
                        return (
                          <tr key={po.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono font-bold text-slate-900">{po.code}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{po.supplierName}</td>
                            <td className="px-3 py-2 text-slate-600">{branch?.name}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{po.invoiceNumber || 'NF-e Registrada'}</td>
                            <td className="px-3 py-2 text-slate-500">
                              {po.receivingCheck?.checkedBy || 'Equipe de Almoxarifado'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                              R$ {(po.totalAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  po.status === 'recebido_total'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {po.status === 'recebido_total' ? '100% Conferido' : 'Com Divergência'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NOVO PEDIDO DE COMPRA */}
      {/* ========================================================================= */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  Emitir Novo Pedido de Compra (Inbound PO)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Defina o fornecedor, filial de destino e os produtos com quantidades e custos negociados.
                </p>
              </div>
              <button
                onClick={() => setIsNewPOModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fornecedor *</label>
                  <select
                    required
                    value={poSupplierId}
                    onChange={(e) => {
                      setPoSupplierId(e.target.value);
                      const supp = suppliers.find((s) => s.id === e.target.value);
                      if (supp) {
                        const days = supp.leadTimeDays || 5;
                        const d = new Date(Date.now() + days * 86400000);
                        setPoDeliveryDate(d.toISOString().substring(0, 10));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione o Fornecedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Lead: {s.leadTimeDays}d)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filial de Destino *</label>
                  <select
                    required
                    value={poBranchId}
                    onChange={(e) => setPoBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {allBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city}/{b.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Previsão de Entrega *</label>
                  <input
                    type="date"
                    required
                    value={poDeliveryDate}
                    onChange={(e) => setPoDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Adicionar Produtos ao Pedido</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {poItems.length} produto(s) no pedido
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Produto</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleSelectProductForPO(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Selecione um produto do catálogo...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (EAN: {p.barcode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Custo Unit. (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={selectedUnitCost}
                      onChange={(e) => setSelectedUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToPO}
                      className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Table of selected items */}
                {poItems.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mt-3">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 text-center">Qtd.</th>
                          <th className="px-3 py-2 text-right">Custo Unit.</th>
                          <th className="px-3 py-2 text-right">Subtotal</th>
                          <th className="px-3 py-2 text-center w-10">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {poItems.map((item) => (
                          <tr key={item.productId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800">{item.productName}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-700">{item.quantity} un.</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-600">
                              R$ {(item.unitCost ?? 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                              R$ {(item.quantity * item.unitCost).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemFromPO(item.productId)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instruções / Observações</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Ex: Entregar pela portaria 2 com NF e certificado de garantia..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Total & Submit */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Valor Total do Pedido</div>
                  <div className="text-xl font-black text-slate-900">
                    R${' '}
                    {poItems
                      .reduce((acc, it) => acc + it.quantity * it.unitCost, 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsNewPOModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Emitir Pedido de Compra
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NOVA COTAÇÃO MULTIFORNECEDOR */}
      {/* ========================================================================= */}
      {isNewQuotationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Nova Cotação Multifornecedor
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cadastre as propostas de múltiplos fornecedores para comparar preço, prazo e condições.
                </p>
              </div>
              <button
                onClick={() => setIsNewQuotationModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotationSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Produto a Cotar *</label>
                  <select
                    required
                    value={quoteProductId}
                    onChange={(e) => {
                      setQuoteProductId(e.target.value);
                      const p = products.find((prod) => prod.id === e.target.value);
                      if (p) {
                        setQuotePrice(p.costPrice || 0);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione o produto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (EAN: {p.barcode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qtd. Solicitada *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quoteQuantity}
                    onChange={(e) => setQuoteQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Add Supplier Proposal Section */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="text-xs font-bold text-slate-800">Adicionar Proposta de Fornecedor</div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Fornecedor</label>
                    <select
                      value={quoteSupplierId}
                      onChange={(e) => {
                        setQuoteSupplierId(e.target.value);
                        const supp = suppliers.find((s) => s.id === e.target.value);
                        if (supp) {
                          setQuoteDeliveryDays(supp.leadTimeDays || 3);
                          setQuotePaymentTerm(supp.paymentTerms || '30 dias');
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Selecione o fornecedor...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Preço Unit. (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={quotePrice || ''}
                      onChange={(e) => setQuotePrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Prazo (Dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={quoteDeliveryDays}
                      onChange={(e) => setQuoteDeliveryDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddOptionToQuote}
                      className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Proposals list */}
                {quoteOptions.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mt-3">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Fornecedor</th>
                          <th className="px-3 py-2 text-right">Preço Unit.</th>
                          <th className="px-3 py-2 text-center">Prazo</th>
                          <th className="px-3 py-2">Condição</th>
                          <th className="px-3 py-2 text-center w-10">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quoteOptions.map((opt) => (
                          <tr key={opt.supplierId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800">{opt.supplierName}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                              R$ {(opt.pricePerUnit ?? 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-600">{opt.deliveryDays} dias</td>
                            <td className="px-3 py-2 text-slate-600">{opt.paymentTerm}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setQuoteOptions(quoteOptions.filter((o) => o.supplierId !== opt.supplierId))
                                }
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewQuotationModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar & Abrir Cotação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SELETOR DE CARGA PARA RECEBIMENTO */}
      {/* ========================================================================= */}
      {isStartReceivingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-indigo-400" />
                  Iniciar Conferência de Recebimento
                </h3>
                <p className="text-[11px] text-slate-400">
                  Selecione o pedido de compra que está sendo descarregado na doca.
                </p>
              </div>
              <button
                onClick={() => setIsStartReceivingModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
              {purchaseOrders.filter((p) => p.status !== 'recebido_total' && p.status !== 'cancelado').length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Não há pedidos aguardando entrega no momento.
                </div>
              ) : (
                purchaseOrders
                  .filter((p) => p.status !== 'recebido_total' && p.status !== 'cancelado')
                  .map((po) => {
                    const branch = allBranches.find((b) => b.id === po.targetBranchId);
                    return (
                      <div
                        key={po.id}
                        onClick={() => {
                          setIsStartReceivingModalOpen(false);
                          handleStartConferrence(po);
                        }}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{po.code}</span>
                            <span className="text-[11px] text-slate-500">&bull; {po.supplierName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Destino: {branch?.name || 'Filial'} &bull; {po.items.length} itens &bull; R${' '}
                            {(po.totalAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs group-hover:bg-indigo-700 transition-colors">
                          Conferir
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFERÊNCIA FÍSICA & BIPADA DE RECEBIMENTO */}
      {/* ========================================================================= */}
      {conferringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-blue-400" /> Conferência Física de Recebimento
                </h3>
                <p className="text-[11px] text-slate-400">
                  {conferringOrder.code} &bull; Fornecedor: {conferringOrder.supplierName}
                </p>
              </div>
              <button onClick={() => setConferringOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* NF-e Input */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="w-full sm:w-auto flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Número da Nota Fiscal (NF-e) ou Chave de Acesso *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumberInput}
                    onChange={(e) => setInvoiceNumberInput(e.target.value)}
                    placeholder="Ex: 009.841-A ou 3526..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => openBarcodeScanner(handleBipProduct)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors self-end"
                >
                  <Barcode className="w-4 h-4" /> Bipar com Câmera
                </button>
              </div>

              {/* Items in conference */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {conferringOrder.items.map((item) => {
                  const scanned = scannedCounts[item.productId] || 0;
                  const damaged = damagedCounts[item.productId] || 0;
                  const isDone = scanned === item.quantity;
                  const hasDivergence = scanned !== item.quantity || damaged > 0;

                  return (
                    <div
                      key={item.productId}
                      className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        damaged > 0
                          ? 'bg-red-50/70 border-red-200'
                          : isDone
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : scanned > item.quantity
                          ? 'bg-purple-50/70 border-purple-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-xs text-slate-800">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          EAN: {products.find((p) => p.id === item.productId)?.barcode || 'Sem código'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Status Label */}
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {scanned} / {item.quantity} un.
                          </div>
                          <div className="text-[10px] font-bold">
                            {damaged > 0 ? (
                              <span className="text-red-600">{damaged} avariada(s)</span>
                            ) : isDone ? (
                              <span className="text-emerald-700">Conferido OK</span>
                            ) : scanned < item.quantity ? (
                              <span className="text-amber-600">Faltam {item.quantity - scanned} un.</span>
                            ) : (
                              <span className="text-purple-600">Sobra de {scanned - item.quantity} un.</span>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const current = scannedCounts[item.productId] || 0;
                              setScannedCounts({ ...scannedCounts, [item.productId]: current + 1 });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs shadow-2xs"
                          >
                            +1 Bip
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScannedCounts({ ...scannedCounts, [item.productId]: item.quantity });
                            }}
                            className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-semibold text-[11px] text-slate-700 shadow-2xs"
                            title="Preencher 100%"
                          >
                            Tudo
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conference Summary */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Ao concluir, o estoque da filial de destino será adicionado e o custo médio atualizado.
                </span>
                <button
                  type="button"
                  onClick={handleFinishConferrence}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Concluir & Dar Entrada no Estoque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ESPELHO DO PEDIDO DE COMPRA (PDF VIEW STYLE) */}
      {/* ========================================================================= */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Espelho do Pedido de Compra ({viewingPO.code})
                </h3>
                <p className="text-[11px] text-slate-400">Documento de emissão comercial para o fornecedor.</p>
              </div>
              <button onClick={() => setViewingPO(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Código</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{viewingPO.code}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Status</div>
                  <div className="font-bold text-blue-700 uppercase mt-0.5">{viewingPO.status.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Data de Emissão</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingPO.createdAt}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Entrega Prevista</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingPO.expectedDeliveryDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Fornecedor</div>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingPO.supplierName}</div>
                </div>
                <div className="p-3.5 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Filial de Destino</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {allBranches.find((b) => b.id === viewingPO.targetBranchId)?.name || 'Filial Principal'}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-center">Quantidade</th>
                      <th className="px-3 py-2 text-right">Custo Unit.</th>
                      <th className="px-3 py-2 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingPO.items.map((it) => (
                      <tr key={it.productId}>
                        <td className="px-3 py-2 font-medium text-slate-800">{it.productName}</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-700">{it.quantity} un.</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">
                          R$ {(it.unitCost ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                          R$ {(it.totalCost ?? (it.quantity * it.unitCost) ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right uppercase text-[11px] text-slate-500">
                        Total do Pedido:
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm text-slate-900">
                        R$ {(viewingPO.totalAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {viewingPO.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <strong>Observações:</strong> {viewingPO.notes}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingPO(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
