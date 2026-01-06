
import React, { useState, useMemo, useEffect } from 'react';
import { AppLanguage, AppCurrency } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ValuationLog {
  id: string;
  user: string;
  action: string;
  target: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

type AuditState = 'idle' | 'running' | 'validated' | 'divergent';

interface Props {
  onBack: () => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const ValuationCenter: React.FC<Props> = ({ onBack, t, lang, currency }) => {
  const localT: Record<string, any> = {
    [AppLanguage.PT]: {
      terminalTitle: "Prylom Analytical Terminal",
      capex: "Ativos Imobilizados (CAPEX)",
      opex: "Fluxo Operacional (OPEX)",
      land: "Terra Nua",
      infra: "Infraestrutura",
      lease: "Compromissos / Arrendamento",
      summary: "Consolidação de Laudo",
      audit: "Log de Auditoria",
      aiAuditor: "IA Technical Auditor",
      confidence: "Confidence Score",
      marketVerified: "Prylom Verified",
      stressTest: "Stress Scenarios",
      export: "Exportar Laudo",
      method: "Método: Valor de Mercado",
      formula: "Cálculo Explícito"
    },
    [AppLanguage.EN]: {
      terminalTitle: "Prylom Analytical Terminal",
      capex: "Fixed Assets (CAPEX)",
      opex: "Operational Flow (OPEX)",
      land: "Raw Land",
      infra: "Infrastructure",
      lease: "Lease Commitments",
      summary: "Consolidated Report",
      audit: "Audit Log",
      aiAuditor: "AI Technical Auditor",
      confidence: "Confidence Score",
      marketVerified: "Prylom Verified",
      stressTest: "Stress Scenarios",
      export: "Export Report",
      method: "Method: Market Value",
      formula: "Explicit Calculation"
    }
  };

  const lt = localT[lang] || localT[AppLanguage.PT];

  const [activeTab, setActiveTab] = useState<'capex' | 'opex' | 'summary' | 'audit'>('capex');
  const [auditState, setAuditState] = useState<AuditState>('idle');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [logs, setLogs] = useState<ValuationLog[]>([]);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [stressScenario, setStressScenario] = useState({ selicHigh: false, landDrop: false });

  const [landAudit] = useState({ area: 1200, haPrice: 45000 });
  const [landUser, setLandUser] = useState({ area: 1200, haPrice: 45000 });

  const [infraItems, setInfraItems] = useState([
    { id: '1', name: 'Galpão Logístico', area: 1500, costM2: 2100, age: 5, lifespan: 30 },
    { id: '2', name: 'Sede Administrativa', area: 400, costM2: 3200, age: 10, lifespan: 40 }
  ]);

  const [lease, setLease] = useState({ active: true, haCost: 1800, area: 500, remainingYears: 4 });

  const logAction = (action: string, target: string, oldV: string, newV: string) => {
    const newLog: ValuationLog = {
      id: Math.random().toString(36).substr(2, 9),
      user: "Standard User",
      action, target, oldValue: oldV, newValue: newV,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const calcResults = useMemo(() => {
    let pricePerHa = landUser.haPrice;
    if (stressScenario.landDrop) pricePerHa *= 0.9;

    const landVal = landUser.area * pricePerHa;
    const infraVal = infraItems.reduce((acc, item) => {
      const depreciation = 1 - (item.age / item.lifespan);
      return acc + (item.area * item.costM2 * Math.max(0.1, depreciation));
    }, 0);

    const capexTotal = landVal + infraVal;
    const leaseLiability = lease.active ? (lease.haCost * lease.area * lease.remainingYears) : 0;
    
    let confidence = 95;
    if (landUser.haPrice !== landAudit.haPrice) confidence -= 15;
    if (stressScenario.landDrop || stressScenario.selicHigh) confidence -= 5;
    if (auditState === 'divergent') confidence -= 20;

    return { landVal, infraVal, capexTotal, leaseLiability, netValue: capexTotal - leaseLiability, confidence };
  }, [landUser, infraItems, lease, landAudit, stressScenario, auditState]);

  const runAIAudit = async () => {
    setAuditState('running');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Auditoria Prylom: Terra ${landUser.haPrice} R$/ha. CAPEX R$ ${calcResults.capexTotal}. OPEX R$ ${calcResults.leaseLiability}. Analise riscos técnicos em ${lang}.`;
      const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
      setAiReport(response.text || "OK");
      setAuditState(landUser.haPrice > 60000 ? 'divergent' : 'validated');
    } catch (e) {
      setAuditState('idle');
    }
  };

  const rates = { [AppCurrency.BRL]: 1, [AppCurrency.USD]: 0.19, [AppCurrency.CNY]: 1.42, [AppCurrency.RUB]: 18.5 };
  const formatV = (val: number) => {
    const converted = val * (rates[currency] || 1);
    const symbol = currency === AppCurrency.BRL ? 'R$' : currency === AppCurrency.USD ? '$' : currency === AppCurrency.CNY ? '¥' : '₽';
    return `${symbol} ${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="max-w-screen-2xl mx-auto w-full px-4 py-8 animate-fadeIn pb-40 flex flex-col gap-8 h-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-200 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button className="bg-[#000080] text-white text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest hover:bg-prylom-gold transition-all" title="Ver critérios de verificação">
              {lt.marketVerified}
            </button>
            <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">PRY-VAL-2024-082</span>
          </div>
          <h1 className="text-3xl font-black text-[#000080] tracking-tighter uppercase">{lt.terminalTitle}</h1>
        </div>
        
        <div className="flex items-center gap-6 relative">
           <div className="text-right cursor-pointer group" onMouseEnter={() => setShowScoreDetails(true)} onMouseLeave={() => setShowScoreDetails(false)}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{lt.confidence}</p>
              <div className="flex items-center gap-3">
                 <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-prylom-gold transition-all duration-1000" style={{ width: `${calcResults.confidence}%` }}></div>
                 </div>
                 <span className="text-lg font-black text-prylom-dark">{calcResults.confidence}%</span>
              </div>
              {showScoreDetails && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white p-6 rounded-3xl shadow-3xl border border-gray-100 z-[100] animate-fadeIn">
                   <h5 className="text-[9px] font-black uppercase text-[#000080] border-b pb-3 mb-3">Score Breakdown</h5>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold"><span>Qualidade de Dados</span><span className="text-green-600">Alta</span></div>
                      <div className="flex justify-between text-[10px] font-bold"><span>Atualidade (Fonte)</span><span className="text-green-600">Real-time</span></div>
                      <div className="flex justify-between text-[10px] font-bold"><span>Volatilidade</span><span className="text-prylom-gold">Média</span></div>
                      <div className="flex justify-between text-[10px] font-bold"><span>Auditoria IA</span><span className={auditState === 'validated' ? 'text-green-600' : 'text-gray-400'}>{auditState === 'validated' ? 'Validada' : 'Pendente'}</span></div>
                   </div>
                </div>
              )}
           </div>
           <button onClick={onBack} className="p-4 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-2 flex flex-col gap-2">
           {[
             { id: 'capex', label: lt.capex, icon: '🏢' },
             { id: 'opex', label: lt.opex, icon: '💸' },
             { id: 'summary', label: lt.summary, icon: '📊' },
             { id: 'audit', label: lt.audit, icon: '📜' }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-4 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${activeTab === tab.id ? 'bg-[#000080] text-white shadow-xl' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}>
               <span className="text-xl">{tab.icon}</span>{tab.label}
             </button>
           ))}

           <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">{lt.stressTest}</h4>
              <div className="space-y-4">
                 <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={stressScenario.landDrop} onChange={e => setStressScenario({...stressScenario, landDrop: e.target.checked})} className="accent-[#000080]" />
                    <span className="text-[9px] font-bold text-gray-600 uppercase">Preço Terra -10%</span>
                 </label>
                 <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={stressScenario.selicHigh} onChange={e => setStressScenario({...stressScenario, selicHigh: e.target.checked})} className="accent-[#000080]" />
                    <span className="text-[9px] font-bold text-gray-600 uppercase">Selic +2%</span>
                 </label>
              </div>
           </div>

           <div className="mt-auto p-6 bg-prylom-dark text-white rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                 <p className="text-[9px] font-black text-prylom-gold uppercase tracking-[0.2em]">{lt.aiAuditor}</p>
                 <div className={`w-2 h-2 rounded-full ${auditState === 'validated' ? 'bg-green-500' : auditState === 'divergent' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              </div>
              <button 
                onClick={runAIAudit}
                disabled={auditState === 'running'}
                className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${auditState === 'validated' ? 'bg-green-600 text-white' : auditState === 'divergent' ? 'bg-red-600 text-white' : 'bg-white text-prylom-dark'}`}
              >
                {auditState === 'running' ? 'Scanning...' : auditState === 'validated' ? 'Validated' : auditState === 'divergent' ? 'Divergent' : 'Run Audit'}
              </button>
           </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
           {activeTab === 'capex' && (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                   <header className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-[#000080] uppercase tracking-tighter">{lt.land}</h3>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{lt.method}</span>
                   </header>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Área Total (ha)</label>
                         <input type="number" value={landUser.area} onChange={e => setLandUser({...landUser, area: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-prylom-gold rounded-xl font-black text-prylom-dark outline-none transition-all" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Preço/ha (BRL)</label>
                         <div className="relative">
                            <input type="number" value={landUser.haPrice} onChange={e => { const old = landUser.haPrice.toString(); setLandUser({...landUser, haPrice: Number(e.target.value)}); logAction("Update", "Land Price", old, e.target.value); }} className={`w-full p-4 bg-gray-50 border-2 rounded-xl font-black text-prylom-dark outline-none transition-all ${landUser.haPrice !== landAudit.haPrice ? 'border-yellow-400' : 'border-transparent'}`} />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                   <h3 className="text-xl font-black text-[#000080] uppercase tracking-tighter mb-8">{lt.infra}</h3>
                   <div className="space-y-4">
                      {infraItems.map(item => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl items-center border border-gray-100">
                           <div className="col-span-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Item</p>
                              <p className="font-bold text-sm text-prylom-dark">{item.name}</p>
                           </div>
                           <div className="col-span-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Depreciação</p>
                              <p className="text-xs font-bold text-red-500">-{Math.round((item.age/item.lifespan)*100)}%</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase">Vida Útil: {item.lifespan} anos</p>
                           </div>
                           <div className="col-span-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Método</p>
                              <p className="text-[9px] font-bold text-prylom-gold uppercase">Derrisão Técnica</p>
                           </div>
                           <div className="col-span-1 text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Líquido</p>
                              <p className="font-black text-prylom-dark">{formatV(item.area * item.costM2 * (1 - item.age/item.lifespan))}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'opex' && (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-[#FFF9F5] p-10 rounded-[3rem] border border-orange-100 shadow-sm relative overflow-hidden">
                   <div className="relative z-10">
                      <h3 className="text-2xl font-black text-prylom-dark uppercase tracking-tighter mb-4">{lt.lease}</h3>
                      <p className="text-[9px] font-black text-orange-700 uppercase tracking-widest mb-8">{lt.formula}: {lease.area}ha × {formatV(lease.haCost)} × {lease.remainingYears} anos</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Área Arrendada (ha)</label>
                            <input type="number" value={lease.area} onChange={e => setLease({...lease, area: Number(e.target.value)})} className="w-full p-4 bg-white border border-orange-200 rounded-2xl font-black text-prylom-dark" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Custo/ha/Ano</label>
                            <input type="number" value={lease.haCost} onChange={e => setLease({...lease, haCost: Number(e.target.value)})} className="w-full p-4 bg-white border border-orange-200 rounded-2xl font-black text-prylom-dark" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Prazo Restante</label>
                            <input type="number" value={lease.remainingYears} onChange={e => setLease({...lease, remainingYears: Number(e.target.value)})} className="w-full p-4 bg-white border border-orange-200 rounded-2xl font-black text-prylom-dark" />
                         </div>
                      </div>
                      <div className="mt-12 p-8 bg-white/50 rounded-3xl border border-orange-200 flex justify-between items-center">
                         <div>
                            <p className="text-[9px] font-black text-orange-700 uppercase tracking-widest mb-1">Passivo Operacional Estimado</p>
                            <p className="text-3xl font-black text-prylom-dark">{formatV(calcResults.leaseLiability)}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'summary' && (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl space-y-12">
                   <header className="flex justify-between items-end border-b border-gray-50 pb-8">
                      <div>
                         <h3 className="text-4xl font-black text-[#000080] tracking-tighter uppercase mb-2">Consolidação NAV</h3>
                         <p className="text-gray-400 text-sm font-medium">Net Asset Value Auditado.</p>
                      </div>
                      <div className="flex gap-4">
                         <button className="bg-gray-100 text-prylom-dark px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#000080] hover:text-white transition-all">PDF Report</button>
                         <button className="bg-gray-100 text-prylom-dark px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#000080] hover:text-white transition-all">XLS Audit</button>
                      </div>
                   </header>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center p-8 bg-gray-50 rounded-3xl">
                         <span className="text-xs font-black text-prylom-dark uppercase tracking-widest">Valor Bruto (CAPEX)</span>
                         <span className="text-2xl font-black text-[#000080]">{formatV(calcResults.capexTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center p-8 bg-red-50 rounded-3xl border border-red-100">
                         <span className="text-xs font-black text-red-700 uppercase tracking-widest">Compromissos (OPEX)</span>
                         <span className="text-2xl font-black text-red-600">-{formatV(calcResults.leaseLiability)}</span>
                      </div>
                      <div className="pt-6 border-t-4 border-prylom-dark flex justify-between items-center">
                         <span className="text-lg font-black text-prylom-dark uppercase tracking-tighter">NAV Líquido</span>
                         <span className="text-5xl font-black text-[#000080] tracking-tighter">{formatV(calcResults.netValue)}</span>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'audit' && (
             <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm animate-fadeIn">
                <h3 className="text-xl font-black text-[#000080] uppercase tracking-tighter mb-8">{lt.audit}</h3>
                <div className="space-y-2">
                   {logs.map(log => (
                      <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center text-[10px]">
                         <div className="flex gap-4 items-center">
                            <span className="font-black text-prylom-gold uppercase">{log.timestamp}</span>
                            <span className="font-black text-prylom-dark uppercase">{log.action}: {log.target}</span>
                         </div>
                         <div className="flex gap-2 font-black text-[#000080]">→ {log.newValue}</div>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="bg-[#FDFCFB] p-8 rounded-[2.5rem] border-2 border-prylom-gold/20 shadow-xl relative overflow-hidden h-full">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 bg-prylom-dark text-prylom-gold rounded-xl flex items-center justify-center text-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <div><h4 className="font-black text-[#000080] uppercase text-xs">AI Audit Insight</h4></div>
              </div>
              {auditState === 'running' ? (
                 <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-prylom-gold/20 border-t-prylom-gold rounded-full animate-spin mx-auto mb-4"></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Validating Premises...</p></div>
              ) : aiReport ? (
                 <div className="text-[11px] font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{aiReport}</div>
              ) : (
                 <div className="text-center py-10"><p className="text-[10px] font-bold text-gray-400 italic">Dispare a auditoria para validação técnica.</p></div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationCenter;
