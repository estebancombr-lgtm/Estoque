import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Search,
  Plus,
  Barcode,
  SlidersHorizontal,
  MapPin,
  Clock,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  X,
  Check,
  Building2,
  DollarSign,
  Tag,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Product, PhysicalAddress } from '../../types';

export const ProductsView: React.FC = () => {
  const {
    products,
    lots,
    currentBranchId,
    currentBranch,
    allBranches,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    openBarcodeScanner,
    addToast,
    calculateKitAvailability,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTabSub, setActiveTabSub] = useState<'catalogo' | 'lotes' | 'enderecamento'>('catalogo');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Quick Stock Adjustment state
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'entrada' | 'perda_avaria' | 'ajuste_inventario'>('entrada');
  const [adjustNotes, setAdjustNotes] = useState('');

  // ---------------------------------------------------------
  // FORM STATE: NOVO PRODUTO
  // ---------------------------------------------------------
  const [newProd, setNewProd] = useState<{
    name: string;
    description: string;
    internalCode: string;
    barcode: string;
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
    initialStockQty: number;
    initialAisle: string;
    initialShelf: string;
    initialBin: string;
  }>({
    name: '',
    description: '',
    internalCode: '',
    barcode: '',
    category: 'Ferramentas',
    brand: 'TitanPro',
    unit: 'UN',
    costPrice: 50,
    salePrice: 100,
    minStock: 5,
    safetyStock: 2,
    maxStock: 50,
    reorderPoint: 10,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
    active: true,
    initialStockQty: 20,
    initialAisle: 'A',
    initialShelf: '01',
    initialBin: '01',
  });

  // ---------------------------------------------------------
  // FORM STATE: EDITAR PRODUTO
  // ---------------------------------------------------------
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    internalCode: string;
    barcode: string;
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
    branchStocks: Record<string, number>;
    branchAddresses: Record<string, PhysicalAddress>;
  }>({
    name: '',
    description: '',
    internalCode: '',
    barcode: '',
    category: '',
    brand: '',
    unit: 'UN',
    costPrice: 0,
    salePrice: 0,
    minStock: 0,
    safetyStock: 0,
    maxStock: 0,
    reorderPoint: 0,
    imageUrl: '',
    active: true,
    branchStocks: {},
    branchAddresses: {},
  });

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.internalCode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Open Edit Modal with product data
  const handleOpenEditModal = (prod: Product) => {
    const branchStocks: Record<string, number> = {};
    const branchAddresses: Record<string, PhysicalAddress> = {};

    allBranches.forEach((b) => {
      branchStocks[b.id] = prod.stockByBranch[b.id]?.current ?? 0;
      branchAddresses[b.id] = prod.addressByBranch[b.id] || { aisle: 'A', shelf: '01', bin: '01' };
    });

    setEditForm({
      name: prod.name,
      description: prod.description || '',
      internalCode: prod.internalCode,
      barcode: prod.barcode,
      category: prod.category,
      brand: prod.brand,
      unit: prod.unit,
      costPrice: prod.costPrice,
      salePrice: prod.salePrice,
      minStock: prod.minStock,
      safetyStock: prod.safetyStock,
      maxStock: prod.maxStock,
      reorderPoint: prod.reorderPoint,
      imageUrl: prod.imageUrl || '',
      active: prod.active,
      branchStocks,
      branchAddresses,
    });

    setEditingProduct(prod);
  };

  // Submit Edit Form
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editForm.name.trim() || !editForm.internalCode.trim() || !editForm.barcode.trim()) {
      addToast('error', 'Campos Obrigatórios', 'Nome, código interno e código de barras não podem ser vazios.');
      return;
    }

    // Reconstruct stockByBranch and addressByBranch
    const updatedStockByBranch: Record<string, { current: number; reserved: number; available: number }> = {};
    const updatedAddressByBranch: Record<string, PhysicalAddress> = {};

    allBranches.forEach((b) => {
      const prev = editingProduct.stockByBranch[b.id] || { current: 0, reserved: 0, available: 0 };
      const newCurrent = Number(editForm.branchStocks[b.id]) || 0;
      updatedStockByBranch[b.id] = {
        current: newCurrent,
        reserved: prev.reserved || 0,
        available: Math.max(0, newCurrent - (prev.reserved || 0)),
      };
      updatedAddressByBranch[b.id] = editForm.branchAddresses[b.id] || { aisle: 'A', shelf: '01', bin: '01' };
    });

    const updatedProduct: Product = {
      ...editingProduct,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      internalCode: editForm.internalCode.trim(),
      barcode: editForm.barcode.trim(),
      category: editForm.category.trim() || 'Geral',
      brand: editForm.brand.trim() || 'Genérico',
      unit: editForm.unit,
      costPrice: Number(editForm.costPrice) || 0,
      salePrice: Number(editForm.salePrice) || 0,
      minStock: Number(editForm.minStock) || 0,
      safetyStock: Number(editForm.safetyStock) || 0,
      maxStock: Number(editForm.maxStock) || 0,
      reorderPoint: Number(editForm.reorderPoint) || 0,
      imageUrl: editForm.imageUrl.trim() || editingProduct.imageUrl,
      active: editForm.active,
      stockByBranch: updatedStockByBranch,
      addressByBranch: updatedAddressByBranch,
    };

    updateProduct(updatedProduct);
    setEditingProduct(null);
  };

  // Submit Delete Product
  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
  };

  // Submit New Product
  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.barcode || !newProd.internalCode) {
      addToast('error', 'Campos Obrigatórios', 'Preencha nome, código interno e código de barras.');
      return;
    }

    const initialStockMap: Record<string, { current: number; reserved: number; available: number }> = {};
    const initialAddressMap: Record<string, PhysicalAddress> = {};

    const stockQty = Number(newProd.initialStockQty) || 0;

    allBranches.forEach((b) => {
      initialStockMap[b.id] = { current: stockQty, reserved: 0, available: stockQty };
      initialAddressMap[b.id] = {
        aisle: newProd.initialAisle || 'A',
        shelf: newProd.initialShelf || '01',
        bin: newProd.initialBin || '01',
      };
    });

    const fullProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProd.name.trim(),
      description: newProd.description.trim() || 'Produto cadastrado via painel web.',
      internalCode: newProd.internalCode.trim(),
      barcode: newProd.barcode.trim(),
      category: newProd.category.trim() || 'Geral',
      brand: newProd.brand.trim() || 'Aurora',
      unit: newProd.unit,
      costPrice: Number(newProd.costPrice) || 0,
      salePrice: Number(newProd.salePrice) || 0,
      minStock: Number(newProd.minStock) || 5,
      safetyStock: Number(newProd.safetyStock) || 2,
      maxStock: Number(newProd.maxStock) || 50,
      reorderPoint: Number(newProd.reorderPoint) || 10,
      imageUrl: newProd.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
      active: newProd.active,
      stockByBranch: initialStockMap,
      addressByBranch: initialAddressMap,
    };

    addProduct(fullProduct);
    setIsNewModalOpen(false);
    setNewProd({
      name: '',
      description: '',
      internalCode: '',
      barcode: '',
      category: 'Ferramentas',
      brand: 'TitanPro',
      unit: 'UN',
      costPrice: 50,
      salePrice: 100,
      minStock: 5,
      safetyStock: 2,
      maxStock: 50,
      reorderPoint: 10,
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
      active: true,
      initialStockQty: 20,
      initialAisle: 'A',
      initialShelf: '01',
      initialBin: '01',
    });
  };

  const handleExecuteAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    const branch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;
    const delta = adjustType === 'entrada' ? adjustQty : -adjustQty;

    adjustStock(adjustModalProduct.id, branch, delta, adjustType, adjustNotes || 'Ajuste manual de estoque');
    setAdjustModalProduct(null);
    setAdjustQty(1);
    setAdjustNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> Catálogo & Controle de Estoque por Filial
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro, edição e exclusão de itens, controle multi-filial de estoque, endereçamento físico e lotes com validade (FEFO).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-scan-barcode-catalog"
            onClick={() => {
              openBarcodeScanner((code) => {
                setSearch(code);
                addToast('info', 'Filtro Aplicado', `Filtrando por código de barras: ${code}`);
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
          >
            <Barcode className="w-4 h-4 text-indigo-600" /> Bipar Código
          </button>
          <button
            id="btn-create-new-product"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          id="subtab-catalogo"
          onClick={() => setActiveTabSub('catalogo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTabSub === 'catalogo' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📦 Posição de Estoque & Preços ({products.length})
        </button>
        <button
          id="subtab-lotes"
          onClick={() => setActiveTabSub('lotes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTabSub === 'lotes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🏷️ Lotes, Validades & FEFO ({lots.length})
        </button>
        <button
          id="subtab-enderecamento"
          onClick={() => setActiveTabSub('enderecamento')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTabSub === 'enderecamento' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📍 Endereçamento Físico (Corredor/Box)
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-catalog"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome, EAN-13 ou código interno..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Todas Categorias' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* View 1: Main Catalog Table */}
      {activeTabSub === 'catalogo' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-3 py-3">Códigos</th>
                  <th className="px-3 py-3">Categoria / Marca</th>
                  <th className="px-3 py-3">Custo / Venda</th>
                  <th className="px-3 py-3">Margem</th>
                  <th className="px-3 py-3 text-center">Posição Atual</th>
                  <th className="px-3 py-3 text-center">Status Estoque</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Nenhum produto encontrado. Clique em <strong>"Novo Produto"</strong> para cadastrar.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;
                    const currentStock = prod.isKit
                      ? calculateKitAvailability(prod, targetBranch)
                      : currentBranchId === 'all'
                      ? (Object.values(prod.stockByBranch) as { current: number }[]).reduce((s, b) => s + (b.current || 0), 0)
                      : prod.stockByBranch[targetBranch]?.current || 0;

                    const marginPct =
                      prod.salePrice > 0
                        ? Math.round(((prod.salePrice - prod.costPrice) / prod.salePrice) * 100)
                        : 0;

                    const isLow = currentStock <= prod.reorderPoint;
                    const isCritical = currentStock <= prod.minStock;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {prod.name}
                                {!prod.active && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                    INATIVO
                                  </span>
                                )}
                                {prod.isKit && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700">
                                    KIT
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">{prod.description}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 font-mono text-[11px]">
                          <div className="text-slate-800 font-bold">{prod.internalCode}</div>
                          <div className="text-slate-500 flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            {prod.barcode}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="text-slate-800 font-medium">{prod.category}</div>
                          <div className="text-slate-500 text-[10px]">{prod.brand}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900">R$ {(prod.salePrice ?? 0).toFixed(2)}</div>
                          <div className="text-slate-400 text-[10px]">Custo: R$ {(prod.costPrice ?? 0).toFixed(2)}</div>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              marginPct >= 40
                                ? 'bg-emerald-100 text-emerald-800'
                                : marginPct >= 20
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {marginPct}%
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <div className="font-extrabold text-sm text-slate-900">
                            {currentStock} <span className="text-xs font-normal text-slate-500">{prod.unit}</span>
                          </div>
                          {prod.isKit && (
                            <div className="text-[10px] text-purple-600 font-semibold">
                              Calculado por componente
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center">
                          {isCritical ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center justify-center gap-1 w-fit mx-auto">
                              <AlertTriangle className="w-3 h-3" /> Estoque Crítico
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center justify-center gap-1 w-fit mx-auto">
                              Reposição
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1 w-fit mx-auto">
                              <CheckCircle2 className="w-3 h-3" /> Normal
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!prod.isKit && (
                              <button
                                title="Ajustar Estoque"
                                onClick={() => setAdjustModalProduct(prod)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              title="Editar Produto"
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              title="Excluir Produto"
                              onClick={() => setDeletingProduct(prod)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Lots & Expirations (FEFO) */}
      {activeTabSub === 'lotes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Gestão de Lotes & Validades (Política FEFO)</h3>
              <p className="text-xs text-slate-500">
                First Expired, First Out: os lotes mais próximos da data de vencimento são consumidos prioritariamente.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
              Regra Automática Ativa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-3 py-2">Produto</th>
                  <th className="px-3 py-2">Nº do Lote</th>
                  <th className="px-3 py-2">Fabricação</th>
                  <th className="px-3 py-2">Validade</th>
                  <th className="px-3 py-2">Filial</th>
                  <th className="px-3 py-2 text-center">Quantidade</th>
                  <th className="px-3 py-2 text-right">Status FEFO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lots.map((lot) => {
                  const prod = products.find((p) => p.id === lot.productId);
                  const branch = allBranches.find((b) => b.id === lot.branchId);

                  return (
                    <tr key={lot.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-800">{prod?.name || lot.productId}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-600">{lot.lotNumber}</td>
                      <td className="px-3 py-2.5 text-slate-500">{lot.manufactureDate}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">{lot.expirationDate}</td>
                      <td className="px-3 py-2.5 text-slate-600">{branch?.name || lot.branchId}</td>
                      <td className="px-3 py-2.5 text-center font-extrabold text-slate-900">{lot.quantity} un.</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Prioridade 1 de Saída
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Physical Address */}
      {activeTabSub === 'enderecamento' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Endereçamento Físico de Almoxarifado</h3>
              <p className="text-xs text-slate-500">
                Localização no armazém (Corredor, Prateleira e Posição/Box) para agilizar coleta no celular.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => {
              const targetBranch = currentBranchId === 'all' ? 'branch-loja-jardins' : currentBranchId;
              const addr = p.addressByBranch[targetBranch] || { aisle: '-', shelf: '-', bin: '-' };

              return (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-800 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">EAN: {p.barcode}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-700">
                        Corr: {addr.aisle}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-700">
                        Prat: {addr.shelf}
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-blue-600">
                        Box: {addr.bin}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO PRODUTO */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Cadastrar Novo Produto
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Basic Info */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="Ex: Parafusadeira de Impacto Brushless 20V"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Código Interno (SKU) *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
                        setNewProd({ ...newProd, internalCode: randomSku });
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      Auto-gerar
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newProd.internalCode}
                    onChange={(e) => setNewProd({ ...newProd, internalCode: e.target.value })}
                    placeholder="Ex: FERR-882"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Código de Barras (EAN-13) *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomEan = `789${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                        setNewProd({ ...newProd, barcode: randomEan });
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      Auto-gerar EAN
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newProd.barcode}
                    onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                    placeholder="Ex: 7891234560999"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    placeholder="Ex: Ferramentas"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    placeholder="Ex: TitanPro"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={newProd.unit}
                    onChange={(e) => setNewProd({ ...newProd, unit: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="LT">LT (Litro)</option>
                    <option value="PC">PC (Peça)</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Margins */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Precificação & Margens</span>
                  {newProd.salePrice > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Margem Bruta: {Math.round(((newProd.salePrice - newProd.costPrice) / newProd.salePrice) * 100)}%
                      (Lucro: R$ {(newProd.salePrice - newProd.costPrice).toFixed(2)})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Preço de Custo (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={newProd.costPrice}
                      onChange={(e) => setNewProd({ ...newProd, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={newProd.salePrice}
                      onChange={(e) => setNewProd({ ...newProd, salePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Thresholds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={newProd.minStock}
                    onChange={(e) => setNewProd({ ...newProd, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Segurança</label>
                  <input
                    type="number"
                    min="0"
                    value={newProd.safetyStock}
                    onChange={(e) => setNewProd({ ...newProd, safetyStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ponto Reposição</label>
                  <input
                    type="number"
                    min="0"
                    value={newProd.reorderPoint}
                    onChange={(e) => setNewProd({ ...newProd, reorderPoint: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Estoque Máximo</label>
                  <input
                    type="number"
                    min="0"
                    value={newProd.maxStock}
                    onChange={(e) => setNewProd({ ...newProd, maxStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Initial Stock & Physical Address */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800">Estoque Inicial & Endereçamento Padrão</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Qtd. Inicial (Filiais)</label>
                    <input
                      type="number"
                      min="0"
                      value={newProd.initialStockQty}
                      onChange={(e) => setNewProd({ ...newProd, initialStockQty: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Corredor</label>
                    <input
                      type="text"
                      value={newProd.initialAisle}
                      onChange={(e) => setNewProd({ ...newProd, initialAisle: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Prateleira</label>
                    <input
                      type="text"
                      value={newProd.initialShelf}
                      onChange={(e) => setNewProd({ ...newProd, initialShelf: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Box / Posição</label>
                    <input
                      type="text"
                      value={newProd.initialBin}
                      onChange={(e) => setNewProd({ ...newProd, initialBin: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  placeholder="Informações técnicas, aplicações e observações do produto..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR / ALTERAR PRODUTO */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" /> Editar Dados do Produto
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Product Name & Status */}
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                  />
                </div>

                <div className="pt-5 flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    Produto Ativo no Catálogo
                  </label>
                </div>
              </div>

              {/* Codes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Interno (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.internalCode}
                    onChange={(e) => setEditForm({ ...editForm, internalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código de Barras (EAN-13) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.barcode}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category, Brand, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="LT">LT (Litro)</option>
                    <option value="PC">PC (Peça)</option>
                  </select>
                </div>
              </div>

              {/* Financials */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Precificação & Margens</span>
                  {editForm.salePrice > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Margem Bruta: {Math.round(((editForm.salePrice - editForm.costPrice) / editForm.salePrice) * 100)}%
                      (Lucro: R$ {(editForm.salePrice - editForm.costPrice).toFixed(2)})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Preço de Custo (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editForm.costPrice}
                      onChange={(e) => setEditForm({ ...editForm, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editForm.salePrice}
                      onChange={(e) => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono font-bold text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Thresholds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.minStock}
                    onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Segurança</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.safetyStock}
                    onChange={(e) => setEditForm({ ...editForm, safetyStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ponto Reposição</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.reorderPoint}
                    onChange={(e) => setEditForm({ ...editForm, reorderPoint: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Estoque Máximo</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.maxStock}
                    onChange={(e) => setEditForm({ ...editForm, maxStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Stock & Address Per Branch (Direct Editing) */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Estoque & Localização por Filial</span>
                  <span className="text-[10px] text-slate-500 font-normal">Edite diretamente por unidade</span>
                </div>

                <div className="space-y-2">
                  {allBranches.map((b) => {
                    const currentStock = editForm.branchStocks[b.id] ?? 0;
                    const addr = editForm.branchAddresses[b.id] || { aisle: 'A', shelf: '01', bin: '01' };

                    return (
                      <div
                        key={b.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{b.name}</div>
                          <div className="text-[10px] text-slate-500">{b.city}/{b.state}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Estoque:</span>
                            <input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  branchStocks: {
                                    ...editForm.branchStocks,
                                    [b.id]: Math.max(0, parseInt(e.target.value) || 0),
                                  },
                                })
                              }
                              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-bold text-slate-800 text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Corr:</span>
                            <input
                              type="text"
                              value={addr.aisle}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  branchAddresses: {
                                    ...editForm.branchAddresses,
                                    [b.id]: { ...addr, aisle: e.target.value },
                                  },
                                })
                              }
                              className="w-10 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Prat:</span>
                            <input
                              type="text"
                              value={addr.shelf}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  branchAddresses: {
                                    ...editForm.branchAddresses,
                                    [b.id]: { ...addr, shelf: e.target.value },
                                  },
                                })
                              }
                              className="w-10 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Box:</span>
                            <input
                              type="text"
                              value={addr.bin}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  branchAddresses: {
                                    ...editForm.branchAddresses,
                                    [b.id]: { ...addr, bin: e.target.value },
                                  },
                                })
                              }
                              className="w-12 px-1.5 py-1 text-xs border border-slate-200 rounded text-center text-blue-600 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL da Imagem do Produto</label>
                <input
                  type="text"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Atualizar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DE PRODUTO */}
      {/* ========================================================================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-red-600 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Excluir Item do Catálogo
              </h3>
              <button onClick={() => setDeletingProduct(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <img
                  src={deletingProduct.imageUrl}
                  alt={deletingProduct.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{deletingProduct.name}</h4>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: {deletingProduct.internalCode} &bull; EAN: {deletingProduct.barcode}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Categoria: {deletingProduct.category}
                  </div>
                </div>
              </div>

              {/* Total Stock warning */}
              {(() => {
                const totalStock = (Object.values(deletingProduct.stockByBranch) as { current: number }[]).reduce(
                  (sum, s) => sum + (s.current || 0),
                  0
                );
                return (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      totalStock > 0
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      {totalStock > 0 ? (
                        <span>Atenção: Este item possui {totalStock} un. em estoque físico.</span>
                      ) : (
                        <span>Item sem saldo em estoque físico.</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Ao confirmar, o item será removido permanentemente do catálogo ativo e do controle de estoque por filial.
                    </p>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUSTE RÁPIDO DE ESTOQUE */}
      {/* ========================================================================= */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Ajustar Estoque: {adjustModalProduct.name}
              </h3>
              <button onClick={() => setAdjustModalProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjust} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Movimento</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden bg-white"
                >
                  <option value="entrada">➕ Entrada Manual / Bonificação</option>
                  <option value="perda_avaria">❌ Baixa por Perda / Quebra / Avaria</option>
                  <option value="ajuste_inventario">⚖️ Ajuste de Auditoria de Inventário</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Documento</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Ex: Regularização pós-contagem física"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
