import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  QrCode,
  User,
  Percent,
  CheckCircle2,
  Printer,
  X,
  Lock,
  Unlock,
  Coins,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, SaleItem, Sale } from '../../types';

export const PDVView: React.FC = () => {
  const {
    products,
    customers,
    currentUser,
    cashierSession,
    openCashierSession,
    closeCashierSession,
    addCashierMovement,
    completeSale,
    openBarcodeScanner,
    addToast,
    calculateKitAvailability,
    currentBranch,
    currentBranchId,
  } = useApp();

  // Cart state
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [productQuery, setProductQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'credito_loja'>('pix');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Cashier management modals
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [cashierActionType, setCashierActionType] = useState<'abertura' | 'fechamento' | 'sangria' | 'reforco'>('sangria');
  const [cashierAmount, setCashierAmount] = useState<number>(100);
  const [cashierReason, setCashierReason] = useState<string>('');

  const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;

  // Selected customer details
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Apply customer default discount if set
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.customDiscountPct) {
      setDiscountPercent(selectedCustomer.customDiscountPct);
    }
  }, [selectedCustomer]);

  // Keyboard shortcuts (F2 for search focus, F8 for checkout, F4 for discount)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('pdv-search-input')?.focus();
      }
      if (e.key === 'F8' && cartItems.length > 0 && !isCheckoutOpen) {
        e.preventDefault();
        setIsCheckoutOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isCheckoutOpen]);

  // Add item to cart
  const addToCart = (product: Product) => {
    const currentStock = product.isKit
      ? calculateKitAvailability(product, targetBranch)
      : product.stockByBranch[targetBranch]?.available ?? 0;

    const existingIndex = cartItems.findIndex((i) => i.productId === product.id);
    const existingQty = existingIndex >= 0 ? cartItems[existingIndex].quantity : 0;

    if (existingQty + 1 > currentStock) {
      addToast('error', 'Estoque Insuficiente', `${product.name} possui apenas ${currentStock} un. disponíveis.`);
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total =
        updated[existingIndex].quantity *
        updated[existingIndex].unitPrice *
        (1 - updated[existingIndex].discountPct / 100);
      setCartItems(updated);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity: 1,
        unitPrice: product.salePrice,
        costPrice: product.costPrice,
        discountPct: discountPercent,
        total: product.salePrice * (1 - discountPercent / 100),
        isKit: product.isKit,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateItemQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const prod = products.find((p) => p.id === productId);
    const currentStock = prod?.isKit
      ? calculateKitAvailability(prod, targetBranch)
      : prod?.stockByBranch[targetBranch]?.available ?? 0;

    if (newQty > currentStock) {
      addToast('error', 'Limite Atingido', `Estoque disponível: ${currentStock} un.`);
      return;
    }

    setCartItems(
      cartItems.map((item) => {
        if (item.productId !== productId) return item;
        return {
          ...item,
          quantity: newQty,
          total: Number((newQty * item.unitPrice * (1 - item.discountPct / 100)).toFixed(2)),
        };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((i) => i.productId !== productId));
  };

  // Subtotal & Totals
  const subtotal = cartItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const discountTotal = cartItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice * i.discountPct) / 100, 0);
  const total = Math.max(0, subtotal - discountTotal);

  // Execute payment & complete sale
  const handleFinalizeSale = () => {
    if (cartItems.length === 0) return;

    const sale = completeSale({
      items: cartItems,
      subtotal,
      discountAmount: discountTotal,
      total,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      paymentMethods: [{ type: paymentMethod, amount: total }],
      sellerId: currentUser.id,
      sellerName: currentUser.name,
    });

    if (sale) {
      setCompletedSale(sale);
      setCartItems([]);
      setIsCheckoutOpen(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Filter products for quick selection
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.barcode.includes(productQuery) ||
      p.internalCode.toLowerCase().includes(productQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  // If cashier session is closed
  if (cashierSession.status === 'fechado') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Caixa Fechado</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          A sessão de vendas do PDV está encerrada. Abra o caixa com um fundo de troco para iniciar as vendas.
        </p>
        <button
          onClick={() => {
            setCashierActionType('abertura');
            setCashierAmount(300);
            setIsCashierModalOpen(true);
          }}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Unlock className="w-4 h-4" /> Abrir Caixa com Fundo Inicial
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Session Status Bar */}
      <div className="bg-white rounded-2xl p-3 px-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold text-slate-900">Frente de Caixa (PDV) Ativa</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">
            Operador: <strong className="text-slate-800">{cashierSession.openedBy}</strong>
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Troco Inicial: <strong>R$ {(cashierSession.initialBalance ?? 0).toFixed(2)}</strong>
          </span>
        </div>

        {/* Session Actions: Sangria, Reforço, Fechar Caixa */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCashierActionType('sangria');
              setCashierAmount(100);
              setIsCashierModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
          >
            💸 Sangria
          </button>
          <button
            onClick={() => {
              setCashierActionType('reforco');
              setCashierAmount(50);
              setIsCashierModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
          >
            💰 Reforço
          </button>
          <button
            onClick={() => {
              setCashierActionType('fechamento');
              setIsCashierModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold border border-red-200 transition-colors"
          >
            🔒 Fechar Caixa
          </button>
        </div>
      </div>

      {/* Main PDV Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Product Selection & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search bar + Camera Bip */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pdv-search-input"
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Buscar por nome, código de barras ou SKU (F2)..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <button
              onClick={() => {
                openBarcodeScanner((code) => {
                  const found = products.find((p) => p.barcode === code);
                  if (found) {
                    addToCart(found);
                    addToast('success', 'Produto Bipado!', `${found.name} adicionado ao carrinho.`);
                  } else {
                    addToast('error', 'Código não encontrado', `EAN ${code} não cadastrado no estoque.`);
                  }
                });
              }}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Bipar código com a câmera ou leitor"
            >
              <Barcode className="w-4 h-4" /> Bipar (Câmera)
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeCategory === c
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {c === 'all' ? 'Todos os Produtos' : c}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const stock = p.isKit
                ? calculateKitAvailability(p, targetBranch)
                : p.stockByBranch[targetBranch]?.available ?? 0;

              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={stock <= 0}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group bg-white shadow-2xs ${
                    stock <= 0
                      ? 'opacity-50 cursor-not-allowed border-slate-200'
                      : 'hover:border-blue-500 hover:shadow-xs border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 mb-2 relative">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {p.isKit && (
                        <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-purple-600 text-white text-[9px] font-extrabold uppercase">
                          KIT
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.barcode}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-blue-700">R$ {(p.salePrice ?? 0).toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">{stock} disp.</div>
                    </div>
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full min-h-[580px]">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-sm text-slate-900">Cupom de Venda</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} itens
            </span>
          </div>

          {/* Customer selection in cart */}
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-white text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="">👤 Cliente Balcão (Não Identificado)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.segmentTags.includes('VIP') ? '⭐ VIP' : ''} ({c.document})
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Carrinho vazio</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Bipe um produto ou selecione ao lado.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.productId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{item.productName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      R$ {(item.unitPrice ?? 0).toFixed(2)} x {item.quantity} ={' '}
                      <strong className="text-slate-800">R$ {(item.total ?? 0).toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold font-mono">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="w-6 h-6 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Checkout */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">R$ {(subtotal ?? 0).toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-slate-400" /> Desconto:
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-12 text-right px-1.5 py-0.5 text-xs border border-slate-200 rounded font-bold"
                />
                <span>% (-R$ {(discountTotal ?? 0).toFixed(2)})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total a Pagar</span>
                <div className="text-2xl font-black text-slate-900">R$ {(total ?? 0).toFixed(2)}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCartItems([])}
                  disabled={cartItems.length === 0}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold disabled:opacity-40"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  disabled={cartItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm disabled:opacity-40 flex items-center gap-1.5 transition-colors"
                >
                  Finalizar (F8) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Checkout & Payment */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">Fechamento de Venda</h3>
                <p className="text-[11px] text-slate-400">Total a pagar: R$ {(total ?? 0).toFixed(2)}</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" /> Pix Instantâneo
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cartao_credito')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'cartao_credito' ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-2xs' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" /> Cartão Crédito
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cartao_debito')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'cartao_debito' ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-2xs' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600" /> Cartão Débito
                  </button>
                  <button
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'dinheiro' ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-2xs' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-amber-600" /> Dinheiro
                  </button>
                </div>
              </div>

              {/* Dynamic Pix Simulation */}
              {paymentMethod === 'pix' && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
                  <div className="w-32 h-32 bg-white rounded-lg border border-emerald-300 mx-auto flex items-center justify-center shadow-xs">
                    <QrCode className="w-24 h-24 text-slate-800" />
                  </div>
                  <div className="text-[11px] font-mono text-emerald-800 font-semibold">
                    Chave Pix Copia e Cola Gerada
                  </div>
                  <div className="text-[10px] text-emerald-600">
                    Aprovação automática ao detectar pagamento
                  </div>
                </div>
              )}

              {/* Cash change calculator */}
              {paymentMethod === 'dinheiro' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Valor Recebido:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={`Ex: ${(Math.ceil((total || 0) / 10) * 10).toFixed(2)}`}
                      className="w-28 px-2 py-1 text-right text-xs border border-slate-300 rounded font-bold"
                    />
                  </div>
                  {parseFloat(cashTendered) > total && (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-1 border-t border-slate-200">
                      <span>Troco a Devolver:</span>
                      <span className="text-sm font-mono">
                        R$ {((parseFloat(cashTendered) || 0) - (total || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleFinalizeSale}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirmar Pagamento & Emitir Cupom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printed Receipt Dialog */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-5 text-center border-b border-slate-100 bg-emerald-50">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Venda Concluída!</h3>
              <p className="text-xs text-slate-600 font-mono mt-0.5">{completedSale.code}</p>
            </div>

            {/* Thermal Receipt Simulator */}
            <div className="p-5 font-mono text-[11px] bg-slate-50 space-y-2 border-b border-slate-200">
              <div className="text-center font-bold text-slate-800">
                AURORA DISTRIBUIÇÃO E VAREJO S/A
                <div className="text-[10px] font-normal text-slate-500">
                  {currentBranch?.name || 'Filial Jardins'}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                {(completedSale.items || []).map((it) => (
                  <div key={it.productId} className="flex justify-between">
                    <span className="truncate max-w-[170px]">{it.quantity}x {it.productName}</span>
                    <span>R$ {(it.total ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-bold text-slate-900 text-xs">
                <span>TOTAL PAGO:</span>
                <span>R$ {(completedSale.total ?? 0).toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-slate-400 text-center pt-1">
                Vendedor: {completedSale.sellerName} &bull; {completedSale.date}
              </div>
            </div>

            <div className="p-4 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Imprimir Cupom
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cashier Session Actions */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 capitalize">
                {cashierActionType === 'abertura' && 'Abertura de Caixa'}
                {cashierActionType === 'sangria' && 'Sangria de Caixa (Retirada)'}
                {cashierActionType === 'reforco' && 'Reforço de Caixa (Suprimento)'}
                {cashierActionType === 'fechamento' && 'Fechamento de Sessão de Caixa'}
              </h3>
              <button onClick={() => setIsCashierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cashierActionType === 'abertura') {
                  openCashierSession(cashierAmount);
                } else if (cashierActionType === 'sangria' || cashierActionType === 'reforco') {
                  addCashierMovement(cashierActionType, cashierAmount, cashierReason || 'Movimentação padrão');
                } else if (cashierActionType === 'fechamento') {
                  closeCashierSession(cashierAmount);
                }
                setIsCashierModalOpen(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {cashierActionType === 'fechamento' ? 'Valor Contado em Dinheiro na Gaveta (R$)' : 'Valor (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cashierAmount}
                  onChange={(e) => setCashierAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-extrabold text-slate-900 border border-slate-300 rounded-xl"
                />
              </div>

              {cashierActionType !== 'abertura' && cashierActionType !== 'fechamento' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Justificativa</label>
                  <input
                    type="text"
                    required
                    value={cashierReason}
                    onChange={(e) => setCashierReason(e.target.value)}
                    placeholder="Ex: Retirada de segurança para cofre"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCashierModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
