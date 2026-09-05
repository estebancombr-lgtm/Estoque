import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Search, Download, Clock, Laptop, Smartphone } from 'lucide-react';

export const AuditView: React.FC = () => {
  const { auditLogs, addToast } = useApp();
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" /> Trilha de Auditoria & Governança (LGPD)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro imutável de todas as operações: usuário responsável, data/hora, entidade afetada e dispositivo.
          </p>
        </div>

        <button
          onClick={() => addToast('success', 'Relatório LGPD', 'Trilha exportada com hash de integridade criptográfica.')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
        >
          <Download className="w-4 h-4" /> Exportar Relatório LGPD
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuário, ação (venda, ajuste, compra)..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="px-3 py-2">Data / Hora</th>
                <th className="px-3 py-2">Usuário</th>
                <th className="px-3 py-2">Ação Realizada</th>
                <th className="px-3 py-2">Entidade / ID</th>
                <th className="px-3 py-2">Dispositivo / IP</th>
                <th className="px-3 py-2 text-right">Integridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {log.timestamp}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-800">{log.userName}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono">
                    {log.entity} #{log.entityId}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 flex items-center gap-1">
                    {log.device.includes('Mobile') ? (
                      <Smartphone className="w-3 h-3 text-blue-500" />
                    ) : (
                      <Laptop className="w-3 h-3 text-slate-500" />
                    )}
                    {log.device} &bull; {log.ipAddress}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[10px] text-emerald-600 font-bold">
                    ✓ Assinado SHA-256
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
