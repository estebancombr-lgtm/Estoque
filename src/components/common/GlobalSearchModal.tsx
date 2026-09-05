import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, Package, ShoppingCart, Truck, Users, ArrowRight } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    products,
    customers,
    sales,
    transfers,
    purchaseOrders,
    setActiveTab,
    setSurface,
  } = useApp();

  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProducts = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.internalCode.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    : [];

  const filteredCustomers = q
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.document.includes(q) ||
          c.email.toLowerCase().includes(q)
      )
    : [];

  const filteredSales = q
    ? sales.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q))
      )
    : [];

  const filteredTransfers = q
    ? transfers.filter((t) => t.code.toLowerCase().includes(q))
    : [];

  const filteredPurchases = q
    ? purchaseOrders.filter(
        (p) => p.code.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    filteredProducts.length > 0 ||
    filteredCustomers.length > 0 ||
    filteredSales.length > 0 ||
    filteredTransfers.length > 0 ||
    filteredPurchases.length > 0;

  const navigateTo = (tab: string) => {
    setSurface('web');
    setActiveTab(tab);
    setIsSearchOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por produto, código de barras EAN, cliente, pedido ou transferência..."
            autoFocus
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Digite para pesquisar em toda a plataforma</p>
              <div className="flex justify-center gap-2 mt-3 text-[11px] text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 rounded">Produtos</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">Clientes</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">Vendas PDV</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">Transferências</span>
              </div>
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum resultado encontrado para "{query}".
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-500" /> Produtos ({filteredProducts.length})
              </div>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigateTo('products')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        EAN: {p.barcode} &bull; R$ {(p.salePrice ?? 0).toFixed(2)} &bull; {p.category}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> Clientes ({filteredCustomers.length})
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigateTo('crm')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{c.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.document} &bull; {c.email} &bull; {c.city}/{c.state}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sales */}
          {filteredSales.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-purple-500" /> Vendas ({filteredSales.length})
              </div>
              <div className="space-y-1">
                {filteredSales.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigateTo('pdv')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {s.code} &bull; R$ {(s.total ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.customerName || 'Cliente Balcão'} &bull; {s.date}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transfers */}
          {filteredTransfers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-500" /> Transferências ({filteredTransfers.length})
              </div>
              <div className="space-y-1">
                {filteredTransfers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigateTo('transfers')}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{t.code}</div>
                      <div className="text-[11px] text-slate-500">
                        Status: {t.status.toUpperCase()} &bull; {t.items.length} itens
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
