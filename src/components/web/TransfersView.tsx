import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Barcode,
  X,
} from 'lucide-react';
import { TransferRequest } from '../../types';

export const TransfersView: React.FC = () => {
  const {
    transfers,
    allBranches,
    products,
    currentUser,
    createTransfer,
    approveTransfer,
    dispatchTransfer,
    receiveTransfer,
    addToast,
    openBarcodeScanner,
  } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [originBranch, setOriginBranch] = useState('branch-cd-sp');
  const [destinationBranch, setDestinationBranch] = useState('branch-loja-jardins');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [transferQty, setTransferQty] = useState(10);
  const [transferNotes, setTransferNotes] = useState('');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (originBranch === destinationBranch) {
      addToast('error', 'Erro de Origem/Destino', 'A filial de origem deve ser diferente do destino.');
      return;
    }
    if (!selectedProductId) {
      addToast('error', 'Selecione o Produto', 'Escolha o produto a ser transferido.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    createTransfer({
      sourceBranchId: originBranch,
      destBranchId: destinationBranch,
      requestedBy: currentUser.name,
      totalValue: prod.costPrice * transferQty,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          requestedQty: transferQty,
        },
      ],
      notes: transferNotes || 'Transferência solicitada via painel web',
    });

    setIsNewModalOpen(false);
    setSelectedProductId('');
    setTransferNotes('');
  };

  const getBranchName = (id: string) => allBranches.find((b) => b.id === id)?.name || id;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" /> Transferências entre Filiais & Trânsito
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fluxo de suprimento entre lojas e CD: solicitação, alçada de aprovação, expedição com bipagem e recebimento.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Solicitação
        </button>
      </div>

      {/* Transfers Kanban / List */}
      <div className="space-y-3">
        {transfers.map((t) => {
          const origin = getBranchName(t.sourceBranchId);
          const dest = getBranchName(t.destBranchId);

          const statusColors: Record<string, { bg: string; text: string; label: string }> = {
            solicitado: { bg: 'bg-amber-100', text: 'text-amber-800', label: '1. SOLICITADO (AGUARDANDO APROVAÇÃO)' },
            aprovado: { bg: 'bg-blue-100', text: 'text-blue-800', label: '2. APROVADO (SEPARAÇÃO NA ORIGEM)' },
            em_transito: { bg: 'bg-purple-100', text: 'text-purple-800', label: '3. EM TRÂNSITO RODOVIÁRIO' },
            recebido_conferido: {
              bg: 'bg-emerald-100',
              text: 'text-emerald-800',
              label: '4. CONFERIDO & RECEBIDO NO DESTINO',
            },
            rejeitado: { bg: 'bg-red-100', text: 'text-red-800', label: 'REJEITADO' },
          };

          const s = statusColors[t.status] || { bg: 'bg-slate-100', text: 'text-slate-800', label: t.status };

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold font-mono text-sm text-slate-900">{t.code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
                    {s.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <span className="text-slate-600 font-normal">De:</span>
                  <strong>{origin}</strong>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600 font-normal">Para:</span>
                  <strong>{dest}</strong>
                </div>

                {/* Items summary */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    {t.items.length} item(ns):{' '}
                    <strong>
                      {t.items.map((i) => `${i.requestedQty}x ${i.productName}`).join(', ')}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>Criado: {t.requestedAt}</span>
                  <span>&bull;</span>
                  <span className="font-bold text-slate-700">Total: R$ {(t.totalValue ?? 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons according to workflow */}
              <div className="flex items-center gap-2 shrink-0">
                {t.status === 'solicitado' && (
                  <button
                    onClick={() => approveTransfer(t.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Aprovar (Alçada)
                  </button>
                )}

                {t.status === 'aprovado' && (
                  <button
                    onClick={() => dispatchTransfer(t.id)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Truck className="w-3.5 h-3.5" /> Despachar (Em Trânsito)
                  </button>
                )}

                {t.status === 'em_transito' && (
                  <button
                    onClick={() =>
                      receiveTransfer(
                        t.id,
                        t.items.map((it) => ({ productId: it.productId, receivedQty: it.requestedQty }))
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Conferir & Dar Entrada
                  </button>
                )}

                {t.status === 'recebido_conferido' && (
                  <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Processo Concluído
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Transfer Request */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" /> Nova Solicitação de Transferência
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filial Origem (Fornecedora)</label>
                  <select
                    value={originBranch}
                    onChange={(e) => setOriginBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    {allBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filial Destino (Requisitante)</label>
                  <select
                    value={destinationBranch}
                    onChange={(e) => setDestinationBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    {allBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produto</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="">Selecione o produto a transferir...</option>
                  {products.filter((p) => !p.isKit).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (EAN: {p.barcode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade a Transferir</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações / Justificativa</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Ex: Reforço de estoque para final de semana"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Criar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
