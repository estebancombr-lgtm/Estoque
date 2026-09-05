import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Truck,
  FileCheck2,
  Users,
  Sparkles,
  BarChart3,
  Building2,
  ShieldCheck,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  roles?: string[];
}

export const WebSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setSurface,
    currentBranch,
    currentUser,
    smartAlerts,
    transfers,
  } = useApp();

  const pendingTransfersCount = transfers.filter((t) => t.status === 'solicitado' || t.status === 'em_transito').length;
  const criticalAlertsCount = smartAlerts.filter((a) => a.severity === 'critical' && !a.read).length;

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'VISÃO GERAL',
      items: [
        { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard },
      ],
    },
    {
      title: 'ESTOQUE & VENDAS',
      items: [
        { id: 'products', label: 'Catálogo & Estoque', icon: Package },
        { id: 'pdv', label: 'Frente de Caixa (PDV)', icon: ShoppingCart },
        { id: 'kits', label: 'Kits & Combos', icon: Boxes },
      ],
    },
    {
      title: 'SUPRIMENTOS & LOGÍSTICA',
      items: [
        { id: 'purchases', label: 'Compras & Recebimento', icon: FileCheck2 },
        {
          id: 'transfers',
          label: 'Transferências Filiais',
          icon: Truck,
          badge: pendingTransfersCount > 0 ? pendingTransfersCount : undefined,
        },
        { id: 'inventory', label: 'Inventário Físico', icon: FileCheck2 },
      ],
    },
    {
      title: 'CRM & INTELIGÊNCIA',
      items: [
        { id: 'crm', label: 'CRM & Clientes', icon: Users },
        {
          id: 'intelligence',
          label: 'Operação Inteligente',
          icon: Sparkles,
          badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}!` : undefined,
        },
        { id: 'reports', label: 'Relatórios & DRE', icon: BarChart3 },
      ],
    },
    {
      title: 'GOVERNANÇA',
      items: [
        { id: 'companies', label: 'Multi-Empresa & Filiais', icon: Building2 },
        { id: 'audit', label: 'Trilha de Auditoria', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 h-screen select-none">
      {/* Sleek Brand Logo Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80 shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-xs">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight leading-none">Estoque Pro</h1>
          <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">Multi-Filiais Web</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {sections.map((sec, idx) => (
          <div key={idx}>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-1.5 uppercase">
              {sec.title}
            </div>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          typeof item.badge === 'string' && item.badge.includes('!')
                            ? 'bg-red-500 text-white'
                            : isActive
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Shortcut to switch to mobile surface right inside sidebar */}
        <div className="pt-2">
          <button
            onClick={() => setSurface('mobile')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-white font-semibold">App Mobile</div>
                <div className="text-[10px] text-slate-400">Modo Coletor & Bipagem</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* Sleek Mobile Sync Ativo + User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            Mobile Sync Ativo
          </span>
        </div>

        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800/60">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full border border-slate-700 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentBranch ? currentBranch.name : 'Visão Consolidada'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
