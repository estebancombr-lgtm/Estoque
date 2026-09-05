import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, MapPin, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const CompaniesView: React.FC = () => {
  const { companies, allCompanies, allBranches, currentCompany, currentBranchId, setCurrentBranchId, setBranchId } = useApp();
  const companyList = companies || allCompanies || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" /> Multi-Empresa & Filiais (Estrutura Corporativa)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Estrutura organizacional hierárquica, CNPJs, isolamento de dados contábeis e estoques por unidade.
          </p>
        </div>
      </div>

      {/* Companies List */}
      <div className="space-y-4">
        {companyList.map((comp) => {
          const compBranches = (allBranches || []).filter((b) => b.companyId === comp.id);

          return (
            <div key={comp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">{comp.tradeName}</span>
                    <span className="text-xs text-slate-400 font-mono">({comp.name})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">CNPJ: {comp.cnpj}</div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold w-fit">
                  {compBranches.length} Unidades Operacionais
                </span>
              </div>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {compBranches.map((branch) => {
                  const isCurrent = currentBranchId === branch.id;

                  return (
                    <div
                      key={branch.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{branch.name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-white rounded border border-slate-200">
                            {branch.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {branch.city}, {branch.state}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        {isCurrent ? (
                          <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Filial em Operação
                          </span>
                        ) : (
                          <button
                            onClick={() => (setCurrentBranchId || setBranchId)?.(branch.id)}
                            className="text-xs font-bold text-slate-600 hover:text-blue-600"
                          >
                            Alternar para cá &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
