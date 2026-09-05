import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Tag,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Customer } from '../../types';

export const CRMView: React.FC = () => {
  const { customers, sales, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);
  const [activeTabSub, setActiveTabSub] = useState<'clientes' | 'funil'>('clientes');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.document.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCustomer = selectedCustomer || filtered[0] || customers[0] || null;
  const customerSales = sales.filter((s) => s.customerId === activeCustomer?.id);

  const calculatedAvgTicket =
    customerSales.length > 0
      ? customerSales.reduce((acc, s) => acc + (s.total || 0), 0) / customerSales.length
      : activeCustomer?.avgTicket ?? (activeCustomer?.totalSpent ? activeCustomer.totalSpent / 3 : 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> CRM, Ficha 360º & Funil de Vendas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de relacionamento com clientes PF/PJ, limite de crédito, histórico de consumo e automações de recompra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabSub('clientes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTabSub === 'clientes' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            👥 Fichas 360º
          </button>
          <button
            onClick={() => setActiveTabSub('funil')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTabSub === 'funil' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            🎯 Funil de Oportunidades
          </button>
        </div>
      </div>

      {activeTabSub === 'clientes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Customer List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, CPF/CNPJ..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1 max-h-[560px] overflow-y-auto">
              {filtered.map((c) => {
                const isSelected = activeCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono text-slate-600">
                        {c.type}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">{c.document}</div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                      <span className="font-semibold text-slate-700">
                        Total: R$ {c.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex gap-1">
                        {c.segmentTags.map((t) => (
                          <span key={t} className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer 360 View (8 cols) */}
          {activeCustomer && (
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-900">{activeCustomer.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {(activeCustomer.segmentTags || []).join(' & ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span className="font-mono">{activeCustomer.document}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {activeCustomer.email}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {activeCustomer.phone}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Limite de Crédito</div>
                  <div className="text-lg font-black text-slate-900">
                    R$ {(activeCustomer.creditLimit ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Financial & Behavior Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Total Gasto Acumulado</div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    R$ {(activeCustomer.totalSpent ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Ticket Médio</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-1">
                    R$ {calculatedAvgTicket.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Última Compra</div>
                  <div className="text-base font-extrabold text-slate-800 mt-1">
                    {activeCustomer.lastPurchaseDate || (customerSales[0]?.date) || 'Recente'}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Histórico de Pedidos no Balcão (PDV)
                </h3>
                {customerSales.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma compra registrada para este cliente hoje.</p>
                ) : (
                  <div className="space-y-2">
                    {customerSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-blue-600">{sale.code}</div>
                          <div className="text-[11px] text-slate-500">
                            {sale.date} &bull; Vendedor: {sale.sellerName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900">R$ {(sale.total ?? 0).toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500">{(sale.items || []).length} produto(s)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Funnel View */}
      {activeTabSub === 'funil' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Prospecção', 'Qualificação & Proposta', 'Negociação', 'Fechamento Ganho'].map((stage, idx) => (
            <div key={stage} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold text-slate-900">{stage}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {idx === 0 ? '2' : idx === 1 ? '1' : idx === 2 ? '1' : '3'}
                </span>
              </div>

              {/* Sample Deal Cards */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1 text-xs">
                <div className="font-bold text-slate-800">Construtora Alpha S/A</div>
                <div className="text-[11px] text-slate-500">Fornecimento de Ferramentas Elétricas</div>
                <div className="text-xs font-black text-emerald-600 pt-1">R$ 14.800,00</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
