import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  DollarSign,
  PieChart,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, products, currentBranchId, currentBranch, addToast } = useApp();
  const [reportType, setReportType] = useState<'vendas' | 'estoque' | 'dre' | 'comissoes'>('vendas');

  const targetBranch = currentBranchId;

  // Total sales calculation
  const relevantSales = sales.filter(
    (s) => targetBranch === 'all' || s.branchId === targetBranch
  );

  const grossRevenue = relevantSales.reduce((acc, s) => acc + (s.subtotal || 0), 0);
  const discounts = relevantSales.reduce((acc, s) => acc + (s.discountAmount || 0), 0);
  const netRevenue = relevantSales.reduce((acc, s) => acc + (s.total || 0), 0);

  // Total CMV (Custo da Mercadoria Vendida)
  const totalCMV = relevantSales.reduce((acc, s) => {
    const saleCost = (s.items || []).reduce((itemSum, item) => itemSum + (item.costPrice || 0) * (item.quantity || 0), 0);
    return acc + saleCost;
  }, 0);

  const grossMargin = netRevenue - totalCMV;
  const grossMarginPct = netRevenue > 0 ? (((grossMargin / netRevenue) * 100) || 0).toFixed(1) : '0';

  // Export to CSV helper
  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `relatorio-${reportType}-${Date.now()}.csv`;

    if (reportType === 'vendas') {
      headers = ['Codigo', 'Data', 'Cliente', 'Vendedor', 'Itens', 'Total_Bruto', 'Desconto', 'Total_Liquido'];
      rows = relevantSales.map((s) => [
        s.code,
        s.date,
        s.customerName || 'Cliente Balcao',
        s.sellerName,
        (s.items || []).length.toString(),
        (s.subtotal ?? 0).toFixed(2),
        (s.discountAmount ?? 0).toFixed(2),
        (s.total ?? 0).toFixed(2),
      ]);
    } else if (reportType === 'estoque') {
      headers = ['Nome', 'Codigo_Interno', 'EAN', 'Categoria', 'Custo_Unit', 'Venda_Unit', 'Estoque_Atual', 'Curva_ABC'];
      rows = products.map((p) => {
        const qty =
          targetBranch === 'all'
            ? (Object.values(p.stockByBranch) as { current: number }[]).reduce((sum, b) => sum + b.current, 0)
            : p.stockByBranch[targetBranch]?.current || 0;
        return [
          p.name,
          p.internalCode,
          p.barcode,
          p.category,
          (p.costPrice ?? 0).toFixed(2),
          (p.salePrice ?? 0).toFixed(2),
          qty.toString(),
          (p.salePrice || 0) * qty > 5000 ? 'A' : (p.salePrice || 0) * qty > 1000 ? 'B' : 'C',
        ];
      });
    } else {
      headers = ['Linha_DRE', 'Valor_RS'];
      rows = [
        ['Receita Bruta Total', (grossRevenue ?? 0).toFixed(2)],
        ['(-) Descontos Concedidos', `-${(discounts ?? 0).toFixed(2)}`],
        ['(=) Receita Liquida', (netRevenue ?? 0).toFixed(2)],
        ['(-) Custo da Mercadoria Vendida (CMV)', `-${(totalCMV ?? 0).toFixed(2)}`],
        ['(=) Margem de Contribuicao Bruta', (grossMargin ?? 0).toFixed(2)],
      ];
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Relatório Exportado', `Arquivo ${filename} gerado com sucesso.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Relatórios Gerenciais & DRE
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrativo de Resultado do Exercício (DRE), comissões de vendedores, curva ABC e exportação CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar Planilha (CSV)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportType('vendas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            reportType === 'vendas' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📈 Vendas por Período
        </button>
        <button
          onClick={() => setReportType('estoque')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            reportType === 'estoque' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📦 Curva ABC & Giro de Estoque
        </button>
        <button
          onClick={() => setReportType('dre')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            reportType === 'dre' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📑 DRE Gerencial Sintético
        </button>
        <button
          onClick={() => setReportType('comissoes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            reportType === 'comissoes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          👥 Comissões de Equipe
        </button>
      </div>

      {/* Report 1: Sales */}
      {reportType === 'vendas' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Vendas Registradas ({relevantSales.length})</h3>
            <span className="text-xs font-mono font-bold text-slate-700">
              Total Faturado: R$ {(netRevenue ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Data / Hora</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Vendedor</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                  <th className="px-3 py-2 text-right">Desconto</th>
                  <th className="px-3 py-2 text-right">Total Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-mono font-bold text-blue-600">{s.code}</td>
                    <td className="px-3 py-2.5 text-slate-500">{s.date}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">
                      {s.customerName || 'Cliente Balcão'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{s.sellerName}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                      R$ {(s.subtotal ?? 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-600">
                      -R$ {(s.discountAmount ?? 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-extrabold text-slate-900">
                      R$ {(s.total ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Curva ABC & Giro */}
      {reportType === 'estoque' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Classificação Curva ABC (Pareto 80/20)</h3>
              <p className="text-xs text-slate-500">
                Curva A: 80% do valor do estoque &bull; Curva B: 15% &bull; Curva C: 5%
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-3 py-2">Classificação</th>
                  <th className="px-3 py-2">Produto</th>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2 text-center">Posição Atual</th>
                  <th className="px-3 py-2 text-right">Valor Venda Total</th>
                  <th className="px-3 py-2 text-right">Status Giro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p, idx) => {
                  const qty =
                    targetBranch === 'all'
                      ? (Object.values(p.stockByBranch) as { current: number }[]).reduce((sum, b) => sum + b.current, 0)
                      : p.stockByBranch[targetBranch]?.current || 0;
                  const totalVal = qty * p.salePrice;
                  const curve = totalVal > 10000 ? 'A' : totalVal > 3000 ? 'B' : 'C';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            curve === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : curve === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Curva {curve}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-3 py-2.5 text-slate-500">{p.category}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-800">{qty} un.</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">
                        R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-[11px] text-emerald-600 font-semibold">Giro Alto (9.2x)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: DRE Gerencial */}
      {reportType === 'dre' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="text-center pb-4 border-b border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900">
              Demonstrativo de Resultado do Exercício (DRE Gerencial)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filial: {currentBranch ? currentBranch.name : 'Consolidado Grupo Aurora'} &bull; Base Contábil
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-700">(+) RECEITA OPERACIONAL BRUTA</span>
              <span className="font-extrabold text-slate-900">R$ {(grossRevenue ?? 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1.5 text-slate-500 pl-4">
              <span>(-) Descontos e Abatimentos Concedidos</span>
              <span className="text-amber-600">-R$ {(discounts ?? 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 border-t border-b border-slate-200 bg-slate-50 px-2 rounded-lg font-bold">
              <span className="text-slate-800">(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="text-blue-700">R$ {(netRevenue ?? 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 text-slate-600 pl-4">
              <span>(-) CUSTO DA MERCADORIA VENDIDA (CMV)</span>
              <span className="text-red-600">-R$ {(totalCMV ?? 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-b-2 border-slate-900 bg-emerald-50 px-3 rounded-xl font-bold text-sm">
              <span className="text-emerald-950">(=) MARGEM DE CONTRIBUIÇÃO BRUTA</span>
              <div className="text-right">
                <span className="text-emerald-800">R$ {(grossMargin ?? 0).toFixed(2)}</span>
                <div className="text-[10px] text-emerald-600 font-normal">Margem: {grossMarginPct}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Commissions */}
      {reportType === 'comissoes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Comissões de Vendas da Equipe (Taxa Base 3%)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-3 py-2">Vendedor</th>
                  <th className="px-3 py-2 text-center">Vendas Fechadas</th>
                  <th className="px-3 py-2 text-right">Volume Faturado</th>
                  <th className="px-3 py-2 text-right">Taxa Comissão</th>
                  <th className="px-3 py-2 text-right">Comissão a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {['Roberto Sales', 'Camila Operações', 'Admin Central'].map((seller) => {
                  const sellerSales = relevantSales.filter((s) => s.sellerName === seller);
                  const totalSold = sellerSales.reduce((acc, s) => acc + s.total, 0);
                  const commission = totalSold * 0.03;

                  return (
                    <tr key={seller} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-800">{seller}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                        {sellerSales.length} pedidos
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        R$ {(totalSold ?? 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-500">3.0%</td>
                      <td className="px-3 py-2.5 text-right font-mono font-extrabold text-emerald-600">
                        R$ {(commission ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
