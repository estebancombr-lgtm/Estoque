import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Store,
  UserCheck,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  Search,
  Barcode,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Role } from '../../types';

export const Header: React.FC = () => {
  const {
    surface,
    setSurface,
    companies,
    currentCompanyId,
    setCurrentCompanyId,
    currentCompany,
    currentBranchId,
    setCurrentBranchId,
    currentUser,
    switchUserRole,
    isOffline,
    setIsOffline,
    offlineQueue,
    syncOfflineQueue,
    smartAlerts,
    markAlertRead,
    openBarcodeScanner,
    setIsSearchOpen,
    addToast,
  } = useApp();

  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const unreadAlerts = smartAlerts.filter((a) => !a.read);

  const roleLabels: Record<Role, { label: string; desc: string; color: string }> = {
    dono: { label: 'Dono / Gestor', desc: 'Visão total, alçadas e auditoria', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    gerente: { label: 'Gerente de Filial', desc: 'Estoque local, aprovações e caixa', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    caixa: { label: 'Operador de Caixa (PDV)', desc: 'Vendas rápidas e recebimentos', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    comprador: { label: 'Comprador / Suprimentos', desc: 'Cotações e pedidos de compra', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    operador_campo: { label: 'Operador de Campo / Logística', desc: 'Coleta móvel, bipagem e picking', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    financeiro: { label: 'Financeiro', desc: 'DRE, margens e fluxo de caixa', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0 z-20">
      {/* Left: Empresa & Filial Selectors */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Empresa Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa:</span>
          <select
            value={currentCompanyId}
            onChange={(e) => {
              setCurrentCompanyId(e.target.value);
              const firstBranch = (companies || []).find((c) => c.id === e.target.value)?.branches?.[0]?.id || 'all';
              setCurrentBranchId(firstBranch);
            }}
            className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            {(companies || []).map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Filial Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filial:</span>
          <select
            value={currentBranchId}
            onChange={(e) => setCurrentBranchId(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todas as Filiais (Consolidado)</option>
            {(currentCompany?.branches || []).map((br) => (
              <option key={br.id} value={br.id}>
                {br.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Search, Bip, Surface, Alerts, Role & User Avatar Badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sleek Search Pill Input */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Buscar produtos ou pedidos..."
            onClick={() => setIsSearchOpen(true)}
            readOnly
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-56 lg:w-64 focus:ring-2 focus:ring-blue-500 outline-hidden text-slate-800 placeholder-slate-400 cursor-pointer"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>

        {/* Quick Bip Trigger */}
        <button
          onClick={() => {
            openBarcodeScanner((code) => {
              addToast('info', 'Código Lido', `Código EAN: ${code}`);
            });
          }}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Abrir Leitor de Código de Barras"
        >
          <Barcode className="w-5 h-5 text-slate-600" />
        </button>

        {/* Surface Switcher: Web vs Mobile */}
        <div className="hidden sm:flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setSurface('web')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              surface === 'web'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Superfície Web (Escritório e Gestão)"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span>Web</span>
          </button>
          <button
            onClick={() => setSurface('mobile')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              surface === 'mobile'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Superfície Mobile (Operação de Campo)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>App</span>
          </button>
        </div>

        {/* Offline / Online Status */}
        <button
          onClick={() => {
            if (isOffline) {
              setIsOffline(false);
              syncOfflineQueue();
            } else {
              setIsOffline(true);
              addToast('warning', 'Modo Offline Ativado', 'Operações locais entrarão na fila de sincronização.');
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
            isOffline
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title={isOffline ? 'Clique para sincronizar fila' : 'Simular modo sem internet'}
        >
          {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
          <span className="hidden lg:inline">{isOffline ? `Offline (${offlineQueue.length})` : 'Online'}</span>
        </button>

        {/* Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Alertas Inteligentes da Operação"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {alertsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Alertas Operacionais Inteligentes
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {unreadAlerts.length} não lidos
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                {(smartAlerts || []).length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">Nenhum alerta no momento.</p>
                ) : (
                  (smartAlerts || []).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2.5 text-xs rounded-lg transition-colors ${
                        alert.read ? 'bg-white opacity-70' : 'bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : alert.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {alert.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                      </div>
                      <h4 className="font-semibold text-slate-800 mt-1">{alert.title}</h4>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{alert.message}</p>
                      {!alert.read && (
                        <button
                          onClick={() => markAlertRead(alert.id)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold mt-1 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Marcar como lido
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              roleLabels[currentUser.role].color
            }`}
            title="Alternar Papel / Persona (RBAC)"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{roleLabels[currentUser.role].label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Testar Papéis (RBAC)
              </div>
              <div className="space-y-1">
                {(Object.keys(roleLabels) as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchUserRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      currentUser.role === r ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{roleLabels[r].label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{roleLabels[r].desc}</div>
                    </div>
                    {currentUser.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sleek User Avatar Initials Badge */}
        <div
          className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-1 ring-blue-200 shrink-0"
          title={`${currentUser?.name || 'Usuário'} (${roleLabels[currentUser?.role || 'dono']?.label || 'Dono'})`}
        >
          {((currentUser?.name || 'AD'))
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'AD'}
        </div>
      </div>
    </header>
  );
};
