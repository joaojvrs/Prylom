import { GoogleGenAI } from "@google/genai";
import React, { useEffect, useState, useMemo } from 'react';
import { AppCurrency, AppLanguage } from '../types';

interface Props {
  onBack: () => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const ToolsHub: React.FC<Props> = ({ onBack, t, lang, currency }) => {
  const [commodity, setCommodity] = useState('soja');
  const [commodityPrice, setCommodityPrice] = useState(135.50);
  const [inputCost, setInputCost] = useState(2500);
  const [region, setRegion] = useState('MT - Médio Norte');
  const [manualRegion, setManualRegion] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [localInsight, setLocalInsight] = useState<{technical: string, simple: string, coords: string, locationName: string} | null>(null);

  const rates = useMemo(() => ({
    [AppCurrency.BRL]: 1,
    [AppCurrency.USD]: 0.19,
    [AppCurrency.CNY]: 1.42,
    [AppCurrency.RUB]: 18.5
  }), []);

  const getSymbol = () => {
    switch (currency) {
      case AppCurrency.BRL: return 'R$';
      case AppCurrency.USD: return '$';
      case AppCurrency.CNY: return '¥';
      case AppCurrency.RUB: return '₽';
      default: return 'R$';
    }
  };

  const formatPrice = (valInBrl: number, decimals = 2) => {
    const converted = valInBrl * rates[currency];
    return `${getSymbol()} ${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const regionalCosts: Record<string, any> = {
    'MT - Médio Norte': { costHa: 4850, yieldBe: 52, location: "Pólo Regional de Sorriso/Sinop (MT)" },
    'GO - Sudoeste': { costHa: 4620, yieldBe: 49, location: "Eixo Rio Verde–Jataí (GO)" },
    'PR - Oeste': { costHa: 5100, yieldBe: 58, location: "Região de Cascavel/Toledo (PR)" },
    'MS - Sul': { costHa: 4400, yieldBe: 47, location: "Pólo de Maracaju–Dourados (MS)" }
  };

  const barterRatio = inputCost / commodityPrice;
  
  const historicalAverages: Record<string, number> = {
    'soja': 16,
    'milho': 45,
    'boi': 2.2,
    'cafe': 4.5,
    'algodao': 8.2,
    'trigo': 32
  };
  
  const historicalAvg = historicalAverages[commodity] || 16;
  const ratioHealth = barterRatio < historicalAvg ? 'success' : (barterRatio > historicalAvg * 1.2 ? 'danger' : 'warning');

  useEffect(() => {
    fetchLocalInsight();
  }, [lang]);

  const fetchLocalInsight = async (specificLocation?: string) => {
    setLoadingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const analyze = async (locInfo: string, lat?: number, lng?: number) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Atue como um Product Designer e Consultor Sênior de agronegócio Prylom especializado em análise regional de ativos rurais.
          Localização alvo: ${locInfo}. 
          ${lat ? `Coordenadas: ${lat}, ${lng}.` : ''}
          Forneça um insight estratégico curto no tom premium e técnico da Prylom. 
          Inclua informações sobre aptidão produtiva, regime de chuvas e potencial de valorização da região.
          Divida a resposta em Parte 1 (Análise Técnica Profunda) e Parte 2 (Resumo Executivo Simples) separando com "|||". 
          Responda estritamente no idioma: ${lang}.`,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        const [technical, simple] = (response.text || "").split("|||").map(s => s.trim());
        setLocalInsight({
          technical: technical || response.text || "",
          simple: simple || "",
          coords: lat ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : "Referência Geográfica",
          locationName: locInfo === "Sua Localização Atual" ? "Detectado por Geovisualização" : locInfo
        });

        // Tenta sincronizar a região do custo se houver correspondência parcial
        if (locInfo.toLowerCase().includes('mt') || locInfo.toLowerCase().includes('mato grosso')) setRegion('MT - Médio Norte');
        else if (locInfo.toLowerCase().includes('go') || locInfo.toLowerCase().includes('goiás')) setRegion('GO - Sudoeste');
        else if (locInfo.toLowerCase().includes('pr') || locInfo.toLowerCase().includes('paraná')) setRegion('PR - Oeste');
        else if (locInfo.toLowerCase().includes('ms') || locInfo.toLowerCase().includes('mato grosso do sul')) setRegion('MS - Sul');
      };

      if (specificLocation) {
        await analyze(specificLocation);
      } else {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await analyze("Sua Localização Atual", pos.coords.latitude, pos.coords.longitude);
        }, async () => {
          await analyze("Brasil - Hub Regional");
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualRegion.trim()) fetchLocalInsight(manualRegion);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-12 animate-fadeIn flex flex-col gap-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-prylom-dark tracking-tight">{t.btnTools}</h1>
          <p className="text-gray-700 font-bold text-sm mt-1">{t.economicDueDiligence}</p>
        </div>
        <button onClick={onBack} className="bg-white text-prylom-dark border border-gray-200 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           {t.backToStart}
        </button>
      </div>

      {/* Busca de Região Melhorada */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
         <form onSubmit={handleManualSearch} className="flex-1 w-full flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full space-y-2">
               <label className="text-[10px] font-black text-prylom-dark/60 uppercase tracking-widest block px-1">{t.manualLocationLabel}</label>
               <input 
                 type="text" 
                 value={manualRegion}
                 onChange={e => setManualRegion(e.target.value)}
                 placeholder={t.manualLocationPlaceholder} 
                 className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-prylom-gold rounded-2xl outline-none font-bold text-prylom-dark transition-all"
               />
            </div>
            <button type="submit" className="bg-prylom-dark text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-prylom-gold active:scale-95 transition-all w-full md:w-auto shadow-xl">
               Analisar Região
            </button>
         </form>
         <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
         <button onClick={() => fetchLocalInsight()} className="text-prylom-gold font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-prylom-gold/5 p-4 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            {t.useAutoLocation}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Dashboard Barter */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col gap-8">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-prylom-dark uppercase tracking-tight mb-1">{t.greenCurrency}</h3>
                <p className="text-gray-700 text-xs font-bold">Indicadores de Troca e Margem Operacional</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                ratioHealth === 'success' ? 'bg-green-100 text-green-700' : 
                ratioHealth === 'danger' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {ratioHealth === 'success' ? t.ratioSuccess : ratioHealth === 'danger' ? t.ratioAlert : t.ratioStable}
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-prylom-dark/60 uppercase tracking-widest block px-1">Cultura / Ativo</label>
                <select value={commodity} onChange={e => setCommodity(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-prylom-dark outline-none border-2 border-transparent focus:border-prylom-gold appearance-none cursor-pointer">
                  <option value="soja">{t.soy} (Saca 60kg)</option>
                  <option value="milho">{t.corn} (Saca 60kg)</option>
                  <option value="boi">Boi Gordo (@)</option>
                  <option value="cafe">Café Arábica (Saca 60kg)</option>
                  <option value="algodao">Algodão (Pluma)</option>
                  <option value="trigo">Trigo (Ton)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-prylom-dark/60 uppercase tracking-widest block px-1">{t.bagPriceLabel}</label>
                <input type="number" value={commodityPrice} onChange={e => setCommodityPrice(parseFloat(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-prylom-dark outline-none border-2 border-transparent focus:border-prylom-gold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-prylom-dark/60 uppercase tracking-widest block px-1">Custo Insumo ({getSymbol()})</label>
                <input type="number" value={inputCost} onChange={e => setInputCost(parseFloat(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-prylom-dark outline-none border-2 border-transparent focus:border-prylom-gold" />
              </div>
            </div>

            <div className="bg-prylom-dark text-white rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
               <div className="flex-1 text-center md:text-left z-10">
                  <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">{t.exchangeRatio}</span>
                  <p className="text-3xl md:text-4xl font-black leading-tight">
                    {barterRatio.toFixed(2)} 
                    <span className="text-sm text-gray-300 font-bold uppercase ml-2 block md:inline">unidades / insumo</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Referência de Mercado: {historicalAvg} unidades</p>
               </div>
               <div className="w-px h-16 bg-white/10 hidden md:block"></div>
               <div className="flex-1 text-center md:text-left z-10">
                  <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">{t.breakEven}</span>
                  <p className="text-3xl font-black">{regionalCosts[region]?.yieldBe} <span className="text-xs text-gray-300 font-bold uppercase">{t.bagsPerHa}</span></p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Base de Sustentabilidade</p>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
               </div>
            </div>
          </div>

          {/* Resultado da Análise AI */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 space-y-8 min-h-[400px]">
             <header className="flex items-center gap-4">
                <div className="w-12 h-12 bg-prylom-dark text-prylom-gold rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                   <h3 className="text-xl font-black text-prylom-dark uppercase tracking-tight">Análise de Região Prylom AI</h3>
                   <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{localInsight?.locationName || 'Detectando...'}</p>
                </div>
             </header>

             {loadingInsight ? (
               <div className="py-20 flex flex-col items-center justify-center gap-6">
                  <div className="w-10 h-10 border-4 border-prylom-gold/20 border-t-prylom-gold rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse tracking-[0.4em]">Auditando Dados Regionais...</p>
               </div>
             ) : localInsight ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fadeIn">
                  <div className="space-y-4">
                     <span className="text-prylom-gold text-[10px] font-black uppercase tracking-widest">Dossiê Técnico</span>
                     <p className="text-sm font-medium text-prylom-dark leading-relaxed whitespace-pre-wrap">{localInsight.technical}</p>
                  </div>
                  <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col">
                     <span className="text-prylom-dark/40 text-[10px] font-black uppercase tracking-widest mb-4">Em Resumo</span>
                     <p className="text-sm font-bold text-[#000080] italic leading-relaxed mb-8">"{localInsight.simple}"</p>
                     <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ref: {localInsight.coords}</span>
                        <div className="flex gap-2">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full opacity-40"></div>
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full opacity-10"></div>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="py-20 text-center opacity-40">
                  <p className="text-sm font-medium">Selecione uma região ou use sua localização para iniciar o diagnóstico.</p>
               </div>
             )}
          </div>
        </div>

        {/* Barra Lateral de Métricas */}
        <div className="space-y-8">
          <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 flex flex-col gap-6 shadow-inner">
            <div>
              <h3 className="text-lg font-black text-prylom-dark uppercase tracking-tight mb-1">{t.landMeasures}</h3>
              <p className="text-gray-700 text-xs font-bold">Fonte de Dados: IMEA / CONAB</p>
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-prylom-dark/60 uppercase tracking-widest block px-1">{t.selectRegion}</label>
               <select value={region} onChange={e => setRegion(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold text-prylom-dark border border-gray-200 outline-none appearance-none cursor-pointer">
                  {Object.keys(regionalCosts).map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>

            <div className="mt-4 space-y-4 flex-1">
               <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Custo Médio / Ha</span>
                 <span className="font-black text-prylom-dark">{formatPrice(regionalCosts[region]?.costHa, 0)}</span>
               </div>
               <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Aptidão Reg.</span>
                 <span className="text-[9px] font-black uppercase text-prylom-gold tracking-widest">Alta Performance</span>
               </div>
               <div className="p-4 bg-prylom-dark/5 rounded-2xl border border-prylom-dark/10">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Pólo Produtivo</p>
                  <p className="text-xs font-bold text-prylom-dark">{regionalCosts[region]?.location}</p>
               </div>
            </div>
          </div>

          <div className="bg-[#FDFCFB] p-8 rounded-[2.5rem] border-2 border-prylom-gold/10 shadow-sm">
             <h4 className="text-[10px] font-black text-[#000080] uppercase tracking-[0.2em] mb-4">Morning Call Resumo</h4>
             <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-medium text-gray-600"><span className="w-1.5 h-1.5 bg-prylom-gold rounded-full"></span> Mercado em tendência lateral.</div>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-600"><span className="w-1.5 h-1.5 bg-prylom-gold rounded-full"></span> Clima favorável no corredor central.</div>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-600"><span className="w-1.5 h-1.5 bg-prylom-gold rounded-full"></span> Atenção ao spread logístico.</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsHub;