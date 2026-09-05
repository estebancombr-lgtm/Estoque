import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  RotateCcw,
  Boxes,
  Truck,
  FileCheck2,
  Package,
  Layers,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Clock,
  Camera,
  Smartphone,
  Plus,
  Minus,
} from 'lucide-react';
import { Product } from '../../types';

export const MobileApp: React.FC = () => {
  const {
    products,
    currentBranch,
    currentBranchId,
    isOffline,
    toggleOfflineMode,
    offlineQueue,
    syncOfflineQueue,
    openBarcodeScanner,
    addToast,
    transfers,
    inventoryCounts,
    updateInventoryItemCount,
    adjustStock,
    setSurface,
    currentUser,
  } = useApp();

  const [activeScreen, setActiveScreen] = useState<
    'home' | 'scanner' | 'picking' | 'recebimento' | 'inventario' | 'detalhes_produto'
  >('home');
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [quickAdjustQty, setQuickAdjustQty] = useState(1);

  const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;

  // Handle barcode scanned from mobile camera
  const handleScanProduct = (barcode: string) => {
    const prod = products.find((p) => p.barcode === barcode);
    if (prod) {
      setInspectedProduct(prod);
      setActiveScreen('detalhes_produto');
      addToast('success', 'Produto Localizado', `${prod.name}`);
    } else {
      addToast('error', 'Não Cadastrado', `Código ${barcode} não encontrado.`);
    }
  };

  // Quick stock adjustment on mobile
  const handleQuickAdjust = (delta: number) => {
    if (!inspectedProduct) return;
    adjustStock(inspectedProduct.id, targetBranch, delta, 'ajuste_inventario', 'Ajuste rápido via Mobile App');
    // refresh inspected product reference
    const updated = products.find((p) => p.id === inspectedProduct.id);
    if (updated) setInspectedProduct(updated);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center py-0 sm:py-6 px-0 sm:px-4">
      {/* Smartphone frame container */}
      <div className="w-full max-w-md bg-slate-950 text-slate-100 flex flex-col sm:rounded-3xl sm:border sm:border-slate-800 sm:shadow-2xl overflow-hidden min-h-[780px]">
        {/* Mobile Top Status Bar */}
        <div className="bg-slate-950 px-5 pt-3 pb-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white">AURORA MOBILE</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 font-bold">
              COLETOR
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline simulation toggle */}
            <button
              onClick={toggleOfflineMode}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-all text-[10px] ${
                isOffline
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3 h-3" /> Offline ({offlineQueue.length})
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3" /> Online
                </>
              )}
            </button>

            {/* Back to Web button */}
            <button
              onClick={() => setSurface('web')}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              Voltar ao Web
            </button>
          </div>
        </div>

        {/* Offline Queue Sync Banner (if offline queue has pending items) */}
        {offlineQueue.length > 0 && !isOffline && (
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-xs font-bold text-white animate-in slide-in-from-top">
            <span>{offlineQueue.length} operações gravadas offline</span>
            <button
              onClick={syncOfflineQueue}
              className="px-2.5 py-1 rounded-lg bg-white text-blue-700 text-[11px] font-black shadow-xs"
            >
              Sincronizar Agora
            </button>
          </div>
        )}

        {/* Branch indicator */}
        <div className="bg-slate-900/90 px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-slate-200 truncate max-w-[200px]">
              {currentBranch ? currentBranch.name : 'Filial Central'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{currentUser.name.split(' ')[0]}</span>
        </div>

        {/* Mobile Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* SCREEN: HOME */}
          {activeScreen === 'home' && (
            <div className="space-y-4">
              {/* Massive 1-Tap Camera Barcode Scanner Hero */}
              <button
                onClick={() => openBarcodeScanner(handleScanProduct)}
                className="w-full py-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-98 transition-transform group"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <div className="font-extrabold text-base tracking-wide">BIPAR CÓDIGO DE BARRAS</div>
                <div className="text-[11px] text-blue-200">
                  Leitura por câmera para consulta, separação ou contagem
                </div>
              </button>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome ou código..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const found = products.find(
                        (p) =>
                          p.name.toLowerCase().includes((e.target as HTMLInputElement).value.toLowerCase()) ||
                          p.barcode === (e.target as HTMLInputElement).value
                      );
                      if (found) {
                        setInspectedProduct(found);
                        setActiveScreen('detalhes_produto');
                      }
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Operational Modules Menu (Field Actions) */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  Módulos de Chão de Loja & Coleta:
                </div>

                {/* 1. Separação de Pedidos (Picking) */}
                <button
                  onClick={() => setActiveScreen('picking')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Separação de Pedidos (Picking)</div>
                      <div className="text-[10px] text-slate-400">
                        Coleta por corredor e bipagem de conferência
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                {/* 2. Recebimento & Entrada de Carga */}
                <button
                  onClick={() => setActiveScreen('recebimento')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Recebimento de Mercadorias</div>
                      <div className="text-[10px] text-slate-400">
                        Conferência de compras e transferências
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                {/* 3. Contagem Cíclica de Inventário */}
                <button
                  onClick={() => setActiveScreen('inventario')}
                  className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Inventário Físico Coletor</div>
                      <div className="text-[10px] text-slate-400">
                        Contagem cega offline e divergências
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Quick Catalogue Peek */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  Produtos Frequentes nesta Filial:
                </div>
                <div className="space-y-1.5">
                  {products.slice(0, 4).map((p) => {
                    const st = p.stockByBranch[targetBranch]?.available ?? 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setInspectedProduct(p);
                          setActiveScreen('detalhes_produto');
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-200 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">EAN: {p.barcode}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-blue-400">{st} un.</div>
                          <div className="text-[9px] text-slate-400">disp.</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: DETALHES DO PRODUTO (3 TOQUES OU MENOS) */}
          {activeScreen === 'detalhes_produto' && inspectedProduct && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveScreen('home')}
                className="flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Início
              </button>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={inspectedProduct.imageUrl}
                    alt={inspectedProduct.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-950 text-blue-400">
                      {inspectedProduct.category}
                    </span>
                    <h2 className="text-sm font-extrabold text-white mt-1 leading-snug">
                      {inspectedProduct.name}
                    </h2>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      EAN: {inspectedProduct.barcode} &bull; SKU: {inspectedProduct.internalCode}
                    </div>
                  </div>
                </div>

                {/* Warehouse physical coordinates */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <MapPin className="w-4 h-4 text-emerald-400" /> Endereço Almoxarifado:
                  </div>
                  <div className="font-mono font-bold text-white">
                    Corr. {inspectedProduct.addressByBranch[targetBranch]?.aisle || 'A'} / Prat.{' '}
                    {inspectedProduct.addressByBranch[targetBranch]?.shelf || '01'} / Box{' '}
                    {inspectedProduct.addressByBranch[targetBranch]?.bin || '01'}
                  </div>
                </div>

                {/* Current Stock */}
                <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Físico</div>
                    <div className="text-sm font-black text-white">
                      {inspectedProduct.stockByBranch[targetBranch]?.current ?? 0}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Reservado</div>
                    <div className="text-sm font-bold text-amber-400">
                      {inspectedProduct.stockByBranch[targetBranch]?.reserved ?? 0}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Disponível</div>
                    <div className="text-sm font-black text-emerald-400">
                      {inspectedProduct.stockByBranch[targetBranch]?.available ?? 0}
                    </div>
                  </div>
                </div>

                {/* Fast In-Field Stock Adjustment */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ajuste Rápido de Campo (+/- Estoque):
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickAdjust(-1)}
                      className="flex-1 py-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200 font-black text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                      <Minus className="w-4 h-4" /> Baixa (-1)
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(1)}
                      className="flex-1 py-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 font-black text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4" /> Entrada (+1)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: PICKING / SEPARAÇÃO */}
          {activeScreen === 'picking' && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveScreen('home')}
                className="flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Início
              </button>

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">Separação de Pedido #PED-7701</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Em Separação
                </span>
              </div>

              <div className="space-y-2">
                {products.slice(0, 3).map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                        Corr. {p.addressByBranch[targetBranch]?.aisle || 'A'} / Box{' '}
                        {p.addressByBranch[targetBranch]?.bin || '01'}
                      </div>
                      <div className="text-[10px] text-slate-500">Qtd a coletar: 2 un.</div>
                    </div>

                    <button
                      onClick={() => {
                        addToast('success', 'Item Coletado', `${p.name} bipado.`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xs"
                    >
                      Bipar
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  addToast('success', 'Separação Concluída!', 'Pedido pronto para conferência e expedição.');
                  setActiveScreen('home');
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-colors"
              >
                Concluir Separação (Picking)
              </button>
            </div>
          )}

          {/* SCREEN: RECEBIMENTO */}
          {activeScreen === 'recebimento' && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveScreen('home')}
                className="flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Início
              </button>

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">Recebimento de Carga / Fornecedor</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  NF 009.841-A
                </span>
              </div>

              <button
                onClick={() =>
                  openBarcodeScanner((code) => {
                    addToast('success', 'Mercadoria Conferida', `Item com EAN ${code} registrado.`);
                  })
                }
                className="w-full py-4 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" /> Bipar Mercadorias Recebidas
              </button>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase px-1">Itens da Nota Fiscal:</div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Furadeira de Impacto 750W</div>
                    <div className="text-[10px] text-slate-400">Previsto: 10 un. &bull; Conferido: 10 un.</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: INVENTÁRIO COLETOR */}
          {activeScreen === 'inventario' && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveScreen('home')}
                className="flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Início
              </button>

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-white">Contagem Cega de Inventário</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  {isOffline ? 'MODO OFFLINE' : 'SINCRONIZADO'}
                </span>
              </div>

              <button
                onClick={() =>
                  openBarcodeScanner((code) => {
                    const prod = products.find((p) => p.barcode === code);
                    if (prod) {
                      const activeCount = inventoryCounts[0];
                      if (activeCount) {
                        updateInventoryItemCount(activeCount.id, prod.id, 1);
                      }
                      addToast('success', 'Contagem Registrada', `${prod.name}: +1 un.`);
                    }
                  })
                }
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Barcode className="w-5 h-5" /> Bipar e Contar Produto
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Todas as contagens realizadas sem sinal de internet são enfileiradas no aparelho e
                sincronizadas automaticamente com o servidor central quando a conexão for restabelecida.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="bg-slate-950 border-t border-slate-900 px-4 py-3 flex items-center justify-around text-slate-400">
          <button
            onClick={() => setActiveScreen('home')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeScreen === 'home' ? 'text-blue-400' : 'hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Início</span>
          </button>

          <button
            onClick={() => openBarcodeScanner(handleScanProduct)}
            className="w-10 h-10 -mt-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/50 hover:bg-blue-500"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveScreen('picking')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeScreen === 'picking' ? 'text-blue-400' : 'hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Separação</span>
          </button>
        </div>
      </div>
    </div>
  );
};
