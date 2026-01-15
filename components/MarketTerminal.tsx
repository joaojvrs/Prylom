import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { AppLanguage, MarketNews, AppCurrency } from '../types';

interface Props {
  onBack: () => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const MarketTerminal: React.FC<Props> = ({ onBack, t, lang, currency }) => {
  const [news, setNews] = useState<MarketNews[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<{ newsId: string; text: string } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const scriptId = 'tradingview-ticker-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js";
      script.type = "module";
      script.async = true;
      document.body.appendChild(script);
    }

    fetchLiveAgroNews();
  }, [lang]);

  const fetchLiveAgroNews = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for the 5 most recent and relevant agribusiness news and events today. 
        Focus on: Soybean/Corn Prices, USDA Reports, Port Logistics and Climate. 
        Return the response strictly in the language: ${lang}.
        Format as a JSON ARRAY of objects: [{ "id": "string", "source": "string", "title": "string", "summary": "string", "sentiment": "BULLISH|BEARISH", "timestamp": "string" }]`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                source: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                sentiment: { type: Type.STRING },
                timestamp: { type: Type.STRING }
              },
              required: ["id", "source", "title", "summary", "sentiment", "timestamp"]
            }
          }
        },
      });

      const newsData = JSON.parse(response.text || "[]");
      setNews(newsData);
      
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setSources(response.candidates[0].groundingMetadata.groundingChunks);
      }
    } catch (e) {
      console.error("Erro ao buscar notícias em tempo real:", e);
    } finally {
      setLoading(false);
    }
  };

  const getAiImpact = async (item: MarketNews) => {
    setLoadingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the strategic impact of this news for a rural producer: "${item.title} - ${item.summary}". Respond strictly in ${lang} in a premium Prylom consultative tone.`,
        config: {
           tools: [{ googleSearch: {} }]
        }
      });
      setAiInsight({ newsId: item.id, text: response.text || "N/A" });
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingInsight(false); 
    }
  };

  const tickerSymbols = useMemo(() => JSON.stringify([
    { proName: "FX_IDC:USDBRL", title: "Dólar / Real" },
    { proName: "CBOT:ZS1!", title: "Soja (CBOT)" },
    { proName: "CBOT:ZC1!", title: "Milho (CBOT)" },
    { proName: "CME:LE1!", title: "Boi Gordo" },
    { proName: "ICEUS:KC1!", title: "Café Arábica" },
    { proName: "ICEUS:SB1!", title: "Açúcar" },
    { proName: "INDEX:DXY", title: "DXY Index" }
  ]), []);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 animate-fadeIn pb-40 flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-prylom-gold uppercase tracking-[0.3em]">{t.liveFeed}</span>
          </div>
          <h1 className="text-4xl font-black text-[#000080] tracking-tighter uppercase">{t.btnMarket}</h1>
          <p className="text-gray-500 text-sm font-bold">{t.livePulse}</p>
        </div>
        <button onClick={onBack} className="bg-white text-prylom-dark border-2 border-gray-100 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:border-prylom-gold transition-all">
          {t.btnBack}
        </button>
      </div>

      <div className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 min-h-[72px]">
        {React.createElement('tv-ticker-tape', { 
          symbols: tickerSymbols,
          colorTheme: "light",
          isTransparent: false,
          displayMode: "adaptive",
          locale: lang.toLowerCase()
        } as any)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
             <h2 className="text-xl font-black text-[#000080] uppercase tracking-widest">{t.terminalMainEvents}</h2>
             <button onClick={fetchLiveAgroNews} className="text-[9px] font-black text-prylom-gold uppercase tracking-widest hover:underline">{t.terminalUpdateScan}</button>
          </div>
          
          {loading ? (
             <div className="py-20 flex flex-col items-center justify-center gap-6 bg-white rounded-[2.5rem] border border-gray-100">
                <div className="w-10 h-10 border-4 border-prylom-gold/20 border-t-prylom-gold rounded-full animate-spin"></div>
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">{t.terminalGlobalScan}</p>
             </div>
          ) : (
            <div className="space-y-6">
              {news.length === 0 && <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px]">{t.marketEmpty}</p>}
              {news.map(item => (
                <div key={item.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      {item.source} • {item.timestamp}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.sentiment === 'BULLISH' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.sentiment}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-prylom-dark mb-4 leading-tight">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 font-medium">{item.summary}</p>
                  
                  <button 
                    onClick={() => getAiImpact(item)} 
                    disabled={loadingInsight}
                    className="flex items-center gap-2 text-prylom-gold font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {loadingInsight ? t.adminProcessing : t.aiAnalysis}
                  </button>
                  
                  {aiInsight?.newsId === item.id && (
                    <div className="mt-6 p-6 bg-prylom-dark text-white rounded-3xl border-l-4 border-prylom-gold animate-fadeIn">
                       <p className="text-xs font-bold leading-relaxed opacity-90 whitespace-pre-wrap">{aiInsight.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sources.length > 0 && (
            <div className="mt-8 px-4">
               <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.terminalSources}</h4>
               <div className="flex flex-wrap gap-3">
                  {sources.map((source, idx) => (
                    <a key={idx} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-prylom-gold hover:underline">
                      [{idx + 1}] {source.web?.title || 'External Reference'}
                    </a>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="bg-[#000080] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">{t.terminalDisclaimer}</span>
                <h4 className="text-xl font-black mb-4 tracking-tight">{t.terminalExecution}</h4>
                <p className="text-xs font-medium leading-relaxed opacity-70">
                  {t.terminalDisclaimerDesc}
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-prylom-gold/10 rounded-full blur-3xl"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTerminal;
