import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileCheck2,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Plus,
} from 'lucide-react';
import { InventoryCount } from '../../types';

export const InventoryView: React.FC = () => {
  const {
    inventoryCounts,
    products,
    currentBranchId,
    currentBranch,
    updateInventoryItemCount,
    finalizeInventoryCount,
    startInventoryCount,
    addToast,
    openBarcodeScanner,
  } = useApp();

  const activeCount = inventoryCounts[0]; // Active or latest count session

  const handleBipCount = (barcode: string) => {
    if (!activeCount) return;
    const prod = products.find((p) => p.barcode === barcode);
    if (!prod) {
      addToast('error', 'Código não encontrado', `EAN ${barcode} não pertence ao catálogo.`);
      return;
    }

    const item = activeCount.items.find((i) => i.productId === prod.id);
    if (item) {
      updateInventoryItemCount(activeCount.id, prod.id, item.countedQty + 1);
      addToast('success', 'Contagem Registrada', `${prod.name}: ${item.countedQty + 1} contados.`);
    } else {
      addToast('warning', 'Fora do Escopo', `${prod.name} não faz parte deste inventário cíclico.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-600" /> Inventário Físico & Auditoria Cíclica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Contagem cega de mercadoria por bipagem de código de barras, apuração de divergências e ajuste contábil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => startInventoryCount()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Sessão
          </button>
          <button
            onClick={() => openBarcodeScanner(handleBipCount)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Barcode className="w-4 h-4" /> Bipar Contagem com Câmera
          </button>
        </div>
      </div>

      {/* Active Count Card */}
      {activeCount ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-slate-900">{activeCount.code}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeCount.status === 'em_contagem' || activeCount.status === 'aberto'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {activeCount.status === 'em_contagem' || activeCount.status === 'aberto'
                    ? 'CONTAGEM CEGA EM ANDAMENTO'
                    : 'AUDITORIA FINALIZADA'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tipo: <strong className="text-slate-800 uppercase">{activeCount.type}</strong> &bull; Responsável:{' '}
                {activeCount.responsibleName} &bull; Iniciado em: {activeCount.startedAt}
              </p>
            </div>

            {(activeCount.status === 'em_contagem' || activeCount.status === 'aberto') && (
              <button
                onClick={() => finalizeInventoryCount(activeCount.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Finalizar & Ajustar Estoque
              </button>
            )}
          </div>

          {/* Counts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Local / Endereço</th>
                  <th className="px-3 py-2 text-center">Estoque Sistema</th>
                  <th className="px-3 py-2 text-center">Contagem Cega</th>
                  <th className="px-3 py-2 text-center">Divergência</th>
                  <th className="px-3 py-2 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeCount.items.map((it) => {
                  const prod = products.find((p) => p.id === it.productId);
                  const isDivergent = it.divergenceQty !== 0;

                  return (
                    <tr
                      key={it.productId}
                      className={`hover:bg-slate-50 ${isDivergent ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800">{it.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">EAN: {prod?.barcode}</div>
                      </td>

                      <td className="px-3 py-3 font-mono text-slate-600">
                        {it.addressString || 'Corr. A / Box 01'}
                      </td>

                      <td className="px-3 py-3 text-center font-extrabold text-slate-800">
                        {it.expectedQty} un.
                      </td>

                      <td className="px-3 py-3 text-center font-black text-sm text-blue-700">
                        {it.countedQty} un.
                      </td>

                      <td className="px-3 py-3 text-center">
                        {it.divergenceQty === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Exato (0)
                          </span>
                        ) : it.divergenceQty > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            +{it.divergenceQty} Sobra
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            {it.divergenceQty} Falta
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateInventoryItemCount(
                                activeCount.id,
                                it.productId,
                                Math.max(0, it.countedQty - 1)
                              )
                            }
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                          >
                            -
                          </button>
                          <button
                            onClick={() =>
                              updateInventoryItemCount(activeCount.id, it.productId, it.countedQty + 1)
                            }
                            className="w-6 h-6 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          Nenhuma sessão de inventário ativa no momento.
        </div>
      )}
    </div>
  );
};
