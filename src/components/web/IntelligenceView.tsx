import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Zap,
  Sliders,
} from 'lucide-react';

export const IntelligenceView: React.FC = () => {
  const { smartAlerts, products, purchaseOrders, currentBranch, createTransfer, addToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'sugestoes' | 'parados' | 'automacoes'>('sugestoes');

  // Purchase suggestions based on consumption and lead times
  const suggestions = [
    {
      id: 'sug-1',
      productId: 'prod-furadeira-750w',
      productName: 'Furadeira de Impacto 750W',
      currentStock: 6,
      safetyStock: 8,
      leadTimeDays: 4,
      avgDailySales: 2.2,
      runoutInDays: 2.7, // will run out in 2.7 days
      suggestedQuantity: 30,
      estimatedCost: 5670.0,
      preferredSupplier: 'TitanPro Máquinas',
    },
    {
      id: 'sug-2',
      productId: 'prod-oleo-500ml',
      productName: 'Óleo Lubrificante Sintético 500ml',
      currentStock: 14,
      safetyStock: 15,
      leadTimeDays: 2,
      avgDailySales: 4.8,
      runoutInDays: 2.9,
      suggestedQuantity: 60,
      estimatedCost: 1110.0,
      preferredSupplier: 'LubiMax Distribuidora',
    },
  ];

  // Slow-moving items (estoque parado)
  const deadStockItems = [
    {
      id: 'prod-disco-inox',
      name: 'Disco de Corte Inox 115mm',
      branch: 'Filial Jardins',
      daysWithoutSale: 74,
      quantityStagnant: 45,
      capitalTiedUp: 306.0,
      suggestedAction: 'Transferir 30 un. para o CD São Paulo (demanda 5x maior)',
    },
    {
      id: 'prod-trena-40m',
      name: 'Trena Laser Digital 40m',
      branch: 'Filial Campinas',
      daysWithoutSale: 62,
      quantityStagnant: 18,
      capitalTiedUp: 1710.0,
      suggestedAction: 'Aplicar desconto de 15% em kit ou combo promocional',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" /> Operação Inteligente & Automações
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sugestão preditiva de compras, detecção de ruptura preventiva, capital parado e transferências recomendadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('sugestoes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'sugestoes' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            🛒 Sugestão de Compras
          </button>
          <button
            onClick={() => setActiveSubTab('parados')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'parados' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            🛑 Estoque Sem Giro ({deadStockItems.length})
          </button>
        </div>
      </div>

      {/* Subtab 1: Predictive Purchase Suggestions */}
      {activeSubTab === 'sugestoes' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between text-xs text-indigo-950">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <strong>Motor de Reabastecimento Contínuo:</strong> Baseado em média móvel de 30 dias, prazo de
                entrega dos fornecedores e estoque de segurança.
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 rounded text-indigo-800 shrink-0">
              Atualizado a cada hora
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700">
                        RUPTURA EM ~{sug.runoutInDays} DIAS
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1">{sug.productName}</h3>
                      <div className="text-[11px] text-slate-500">
                        Fornecedor Homologado: <strong>{sug.preferredSupplier}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Sugerido</div>
                      <div className="text-xl font-black text-indigo-600">{sug.suggestedQuantity} un.</div>
                    </div>
                  </div>

                  {/* Calculations grid */}
                  <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Estoque Atual</div>
                      <div className="text-xs font-bold text-slate-800">{sug.currentStock} un.</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Consumo Diário</div>
                      <div className="text-xs font-bold text-slate-800">{sug.avgDailySales} un./dia</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Lead Time</div>
                      <div className="text-xs font-bold text-slate-800">{sug.leadTimeDays} dias</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400">Total Previsto: </span>
                    <strong className="text-slate-900">
                      R$ {sug.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <button
                    onClick={() => {
                      addToast(
                        'success',
                        'Pedido Gerado com Sucesso!',
                        `Pedido de ${sug.suggestedQuantity} un. criado para ${sug.preferredSupplier}.`
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Dead Stock / Sem Giro */}
      {activeSubTab === 'parados' && (
        <div className="space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Capital Parado & Giro Lento:</strong> Produtos sem venda há mais de 60 dias ocupando
                espaço físico e gerando custo de oportunidade.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deadStockItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {item.daysWithoutSale} DIAS SEM VENDA
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1">{item.name}</h3>
                      <div className="text-[11px] text-slate-500">Local: {item.branch}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Capital Parado</div>
                      <div className="text-base font-extrabold text-slate-900">
                        R$ {(item.capitalTiedUp ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Ação Recomendada pela IA:
                    </div>
                    <p className="text-slate-700 font-medium">{item.suggestedAction}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() =>
                      addToast('success', 'Transferência Iniciada', 'Ordem de remanejamento entre filiais gerada.')
                    }
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    Executar Transferência
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
