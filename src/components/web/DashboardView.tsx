import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  RotateCcw,
  Calendar,
  ShoppingCart,
  Truck,
  FileCheck2,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentBranch,
    currentBranchId,
    products,
    sales,
    lots,
    transfers,
    smartAlerts,
    setActiveTab,
    openBarcodeScanner,
    addToast,
  } = useApp();

  const targetBranchId = currentBranchId;

  // Filter products by branch or aggregate
  const relevantProducts = products;

  // Total stock value (Custo e Venda)
  const totalStockCost = relevantProducts.reduce((acc, p) => {
    const qty =
      targetBranchId === 'all'
        ? (Object.values(p.stockByBranch || {}) as { current: number }[]).reduce((s, b) => s + (b?.current || 0), 0)
        : p.stockByBranch?.[targetBranchId]?.current || 0;
    return acc + qty * (p.costPrice || 0);
  }, 0);

  const totalStockRetail = relevantProducts.reduce((acc, p) => {
    const qty =
      targetBranchId === 'all'
        ? (Object.values(p.stockByBranch || {}) as { current: number }[]).reduce((s, b) => s + (b?.current || 0), 0)
        : p.stockByBranch?.[targetBranchId]?.current || 0;
    return acc + qty * (p.salePrice || 0);
  }, 0);

  // Ruptura count: products where available < reorderPoint
  const ruptureItems = relevantProducts.filter((p) => {
    const qty =
      targetBranchId === 'all'
        ? (Object.values(p.stockByBranch || {}) as { available: number }[]).reduce((s, b) => s + (b?.available || 0), 0)
        : p.stockByBranch?.[targetBranchId]?.available || 0;
    return qty <= (p.reorderPoint || 0);
  });

  // Sales total today
  const todaySales = sales.filter((s) => targetBranchId === 'all' || s.branchId === targetBranchId);
  const totalSalesAmount = todaySales.reduce((acc, s) => acc + s.total, 0);

  // Lots expiring soon
  const criticalLots = lots.filter((l) => !l.isBlocked && (targetBranchId === 'all' || l.branchId === targetBranchId));

  // Pending transfers
  const pendingTransfers = transfers.filter(
    (t) => t.status === 'solicitado' || t.status === 'em_transito'
  );

  return (
    <div className="space-y-6">
      {/* Sleek Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral Operacional</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Consolidado em tempo real de todas as movimentações &bull; {currentBranch ? currentBranch.name : 'Todas as Filiais'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              addToast('info', 'Exportação Solicitada', 'Relatório gerencial em geração.');
            }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
          >
            Exportar PDF
          </button>
          <button
            onClick={() => setActiveTab('pdv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors"
          >
            Nova Venda
          </button>
        </div>
      </div>

      {/* Sleek 4-Column KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Vendas Hoje */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vendas Hoje</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              R$ {totalSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-600">+14%</span>
          </div>
        </div>

        {/* KPI 2: Itens Abaixo do Mínimo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Itens Abaixo do Mínimo</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">{ruptureItems.length}</span>
            <span className="text-xs font-medium text-slate-400">SKUs</span>
          </div>
        </div>

        {/* KPI 3: Valor em Estoque */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor em Estoque</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              R$ {(((totalStockRetail || 0) / 1000) || 0).toFixed(0)}k
            </span>
            <span className="text-xs font-medium text-slate-400">Total</span>
          </div>
        </div>

        {/* KPI 4: Transferências */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transferências</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {pendingTransfers.length < 10 ? `0${pendingTransfers.length}` : pendingTransfers.length}
            </span>
            <span className="text-xs font-medium text-slate-400">Em Trânsito</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Últimas Movimentações (col-span-2) + Alertas Inteligentes (col-span-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col-span-2: Últimas Movimentações */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col shadow-xs">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base">Últimas Movimentações</h3>
            <button
              onClick={() => setActiveTab('pdv')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver tudo
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Produto / Referência</th>
                  <th className="px-6 py-3 text-center">Qtd</th>
                  <th className="px-6 py-3">Origem/Destino</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(sales || []).slice(0, 4).map((sale, i) => {
                  const firstItem = (sale.items || [])[0];
                  const prod = (products || []).find((p) => p.id === firstItem?.productId);
                  const isIncoming = i === 1;
                  const isTransfer = i === 2;

                  return (
                    <tr key={sale.id} className="text-sm hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {prod ? prod.name : firstItem?.name || 'Smart TV 4K 55" LG'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          SKU: {prod ? prod.sku : 'TV-5509-LG'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
                        {isIncoming ? `+${firstItem?.quantity || 15}` : `-${firstItem?.quantity || 2}`}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                            isIncoming
                              ? 'bg-purple-50 text-purple-700'
                              : isTransfer
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isIncoming
                            ? 'Entrada Fornecedor'
                            : isTransfer
                            ? 'Transferência CD Matriz'
                            : `Saída PDV - ${currentBranch ? currentBranch.name : 'Loja 01'}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isIncoming ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Conferindo
                          </span>
                        ) : isTransfer ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Em Trânsito
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Concluído
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col-span-1: Alertas Inteligentes */}
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas Inteligentes
            </h3>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Amber Alert: Estoque Crítico */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Estoque Crítico</p>
              <p className="text-sm text-amber-900 mt-1">
                Cadeira Ergonômica X-Plus está com apenas 2 unidades. Média de venda: 1.2/dia.
              </p>
              <button
                onClick={() => setActiveTab('intelligence')}
                className="mt-2 text-xs font-bold text-amber-800 underline hover:text-amber-950 block"
              >
                Sugerir Compra
              </button>
            </div>

            {/* Red Alert: Validade Próxima */}
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs font-bold text-red-800 uppercase tracking-tight">Validade Próxima</p>
              <p className="text-sm text-red-900 mt-1">
                Lote #8829 de Suplemento Whey 900g vence em 15 dias (Filial Sul).
              </p>
              <button
                onClick={() => setActiveTab('products')}
                className="mt-2 text-xs font-bold text-red-800 underline hover:text-red-950 block"
              >
                Promover Item
              </button>
            </div>

            {/* Blue Alert: Divergência de Conferência */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-tight">Divergência de Conferência</p>
              <p className="text-sm text-blue-900 mt-1">
                Pedido #902 conferido pelo celular (Operador: Marcos) apresenta falta de 3 itens.
              </p>
              <button
                onClick={() => setActiveTab('purchases')}
                className="mt-2 text-xs font-bold text-blue-800 underline hover:text-blue-950 block"
              >
                Ver Detalhes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Composição do Estoque & Indicadores Adicionais */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-800">Composição do Estoque por Categoria</h3>
            <p className="text-xs text-slate-500">Distribuição física e financeira dos itens cadastrados</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            {relevantProducts.length} SKUs Ativos
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {Array.from(new Set((relevantProducts || []).map((p) => p.category))).map((cat) => {
            const catProds = (relevantProducts || []).filter((p) => p.category === cat);
            const catStock = catProds.reduce((sum, p) => {
              const qty =
                targetBranchId === 'all'
                  ? (Object.values(p.stockByBranch || {}) as { current: number }[]).reduce((s, b) => s + (b?.current || 0), 0)
                  : p.stockByBranch?.[targetBranchId]?.current || 0;
              return sum + qty;
            }, 0);
            const totalItems = (relevantProducts || []).reduce((sum, p) => {
              const qty =
                targetBranchId === 'all'
                  ? (Object.values(p.stockByBranch || {}) as { current: number }[]).reduce((s, b) => s + (b?.current || 0), 0)
                  : p.stockByBranch?.[targetBranchId]?.current || 0;
              return sum + qty;
            }, 0);
            const pct = totalItems > 0 ? Math.round((catStock / totalItems) * 100) : 0;

            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cat}</span>
                  <span className="font-mono text-slate-500">
                    {catStock} un. ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-center">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Giro Médio</div>
            <div className="text-base font-extrabold text-slate-800 mt-0.5">8.4x / ano</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-center">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Cobertura Média</div>
            <div className="text-base font-extrabold text-slate-800 mt-0.5">42 dias</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-center">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Margem Bruta</div>
            <div className="text-base font-extrabold text-emerald-600 mt-0.5">46.2%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
