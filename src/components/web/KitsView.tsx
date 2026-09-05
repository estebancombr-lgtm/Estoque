import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Boxes,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Product } from '../../types';

export const KitsView: React.FC = () => {
  const {
    products,
    addProduct,
    calculateKitAvailability,
    currentBranchId,
    currentBranch,
    addToast,
    setActiveTab,
  } = useApp();

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [kitName, setKitName] = useState('');
  const [kitCode, setKitCode] = useState('');
  const [kitBarcode, setKitBarcode] = useState('');
  const [kitSalePrice, setKitSalePrice] = useState<number>(399.9);
  const [kitComponents, setKitComponents] = useState<{ productId: string; quantity: number }[]>([]);

  const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;

  // Filter existing kits
  const kits = products.filter((p) => p.isKit);
  const standardProducts = products.filter((p) => !p.isKit);

  // Calculate total cost of selected builder components
  const builderCost = kitComponents.reduce((acc, comp) => {
    const p = products.find((prod) => prod.id === comp.productId);
    return acc + (p?.costPrice || 0) * comp.quantity;
  }, 0);

  const builderMargin =
    kitSalePrice > 0 ? Math.round(((kitSalePrice - builderCost) / kitSalePrice) * 100) : 0;

  const handleAddComponentToBuilder = (prodId: string) => {
    if (!prodId) return;
    const existing = kitComponents.find((c) => c.productId === prodId);
    if (existing) {
      setKitComponents(
        kitComponents.map((c) => (c.productId === prodId ? { ...c, quantity: c.quantity + 1 } : c))
      );
    } else {
      setKitComponents([...kitComponents, { productId: prodId, quantity: 1 }]);
    }
  };

  const handleRemoveComponent = (prodId: string) => {
    setKitComponents(kitComponents.filter((c) => c.productId !== prodId));
  };

  const handleSaveKit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitName || !kitCode || !kitBarcode || kitComponents.length === 0) {
      addToast('error', 'Incompleto', 'Defina nome, códigos e adicione pelo menos 1 componente.');
      return;
    }

    const newKit: Product = {
      id: `kit-${Date.now()}`,
      name: kitName,
      description: `Kit Combo formado por ${kitComponents.length} itens. Baixa atômica no estoque.`,
      internalCode: kitCode,
      barcode: kitBarcode,
      category: 'Kits & Combos',
      brand: 'Aurora Kits',
      unit: 'UN',
      costPrice: builderCost,
      salePrice: kitSalePrice,
      minStock: 5,
      safetyStock: 3,
      maxStock: 50,
      reorderPoint: 8,
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80',
      active: true,
      isKit: true,
      components: kitComponents.map((c) => ({
        componentProductId: c.productId,
        quantityNeeded: c.quantity,
      })),
      addressByBranch: {
        'branch-cd-sp': { aisle: 'KIT', shelf: '01', bin: '01' },
        'branch-loja-jardins': { aisle: 'KIT', shelf: '01', bin: '01' },
        'branch-loja-campinas': { aisle: 'KIT', shelf: '01', bin: '01' },
        'branch-deposito-curitiba': { aisle: 'KIT', shelf: '01', bin: '01' },
      },
      stockByBranch: {
        'branch-cd-sp': { current: 10, reserved: 0, available: 10 },
        'branch-loja-jardins': { current: 10, reserved: 0, available: 10 },
        'branch-loja-campinas': { current: 10, reserved: 0, available: 10 },
        'branch-deposito-curitiba': { current: 10, reserved: 0, available: 10 },
      },
    };

    addProduct(newKit);
    setIsBuilderOpen(false);
    setKitName('');
    setKitCode('');
    setKitBarcode('');
    setKitComponents([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-purple-600" /> Kits, Combos & Fichas Técnicas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Combinações de produtos vendidos como item único. A disponibilidade é calculada pelo componente gargalo.
          </p>
        </div>

        <button
          onClick={() => setIsBuilderOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Construtor de Novo Kit
        </button>
      </div>

      {/* Kits Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {kits.map((kit) => {
          const availableUnits = calculateKitAvailability(kit, targetBranch);
          const components = kit.components || [];

          return (
            <div
              key={kit.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={kit.imageUrl}
                      alt={kit.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800">
                        KIT INTELIGENTE
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1">{kit.name}</h3>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {kit.internalCode} &bull; EAN: {kit.barcode}
                      </div>
                    </div>
                  </div>

                  {/* Stock Availability Badge */}
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase">Disponível</div>
                    <div
                      className={`text-2xl font-black ${
                        availableUnits <= 3 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {availableUnits} un.
                    </div>
                  </div>
                </div>

                {/* Price & Margins */}
                <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Preço Kit</div>
                    <div className="text-sm font-extrabold text-blue-700">R$ {(kit.salePrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Custo Soma</div>
                    <div className="text-sm font-bold text-slate-700">R$ {(kit.costPrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Margem Kit</div>
                    <div className="text-sm font-bold text-emerald-600">
                      {Math.round(((kit.salePrice - kit.costPrice) / kit.salePrice) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Component Breakdown with Bottleneck detection */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" /> Ficha Técnica dos Componentes:
                  </div>
                  <div className="space-y-1.5">
                    {components.map((comp) => {
                      const compProd = products.find((p) => p.id === comp.componentProductId);
                      const currentCompStock =
                        compProd?.stockByBranch[targetBranch]?.available ?? 0;
                      const maxBuildable = Math.floor(currentCompStock / comp.quantityNeeded);
                      const isBottleneck = maxBuildable === availableUnits;

                      return (
                        <div
                          key={comp.componentProductId}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                            isBottleneck
                              ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                              : 'bg-slate-50 border-slate-200/60 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                              {comp.quantityNeeded}x
                            </span>
                            <span className="font-medium truncate max-w-[180px]">
                              {compProd?.name || 'Componente'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            <span>
                              Estoque: <strong>{currentCompStock} un.</strong>
                            </span>
                            {isBottleneck && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                                Gargalo
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Baixa automática de todos os {components.length} itens ao vender no PDV.
                </span>
                <button
                  onClick={() => setActiveTab('pdv')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  Vender no PDV &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Kit Constructor */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Boxes className="w-4 h-4 text-purple-400" /> Construtor de Kit & Ficha Técnica
              </h3>
              <button onClick={() => setIsBuilderOpen(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Kit / Combo</label>
                  <input
                    type="text"
                    required
                    value={kitName}
                    onChange={(e) => setKitName(e.target.value)}
                    placeholder="Ex: Combo Ferramentas Manuais 12 Peças"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Interno</label>
                  <input
                    type="text"
                    required
                    value={kitCode}
                    onChange={(e) => setKitCode(e.target.value)}
                    placeholder="Ex: KIT-9002"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código de Barras (EAN-13)</label>
                  <input
                    type="text"
                    required
                    value={kitBarcode}
                    onChange={(e) => setKitBarcode(e.target.value)}
                    placeholder="Ex: 7891234569014"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Component selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adicionar Componentes do Catálogo</label>
                <select
                  onChange={(e) => {
                    handleAddComponentToBuilder(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium"
                >
                  <option value="">Selecione um produto para adicionar ao combo...</option>
                  {standardProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Custo: R$ {(p.costPrice ?? 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected components list */}
              <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Componentes do Kit ({kitComponents.length})</div>
                {kitComponents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">Nenhum componente incluído.</p>
                ) : (
                  kitComponents.map((comp) => {
                    const prod = products.find((p) => p.id === comp.productId);
                    return (
                      <div
                        key={comp.productId}
                        className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">{prod?.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={comp.quantity}
                            onChange={(e) => {
                              const q = parseInt(e.target.value) || 1;
                              setKitComponents(
                                kitComponents.map((c) =>
                                  c.productId === comp.productId ? { ...c, quantity: q } : c
                                )
                              );
                            }}
                            className="w-12 px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(comp.productId)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Price & Margins */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Custo Total Soma:</span>
                  <span className="font-extrabold text-slate-900">R$ {(builderCost ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Preço Sugerido (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={kitSalePrice}
                    onChange={(e) => setKitSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-purple-300 rounded font-bold bg-white"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block">Margem Resultante:</span>
                  <span className="font-extrabold text-emerald-700">{builderMargin}%</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                >
                  Criar Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
