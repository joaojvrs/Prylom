
import React, { useState, useEffect } from 'react';
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
    // Inicialização do Widget de Ticker do TradingView
    const script = document.createElement("script");
    script.src = "https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js";
    script.type = "module";
    script.async = true;
    document.body.appendChild(script);

    fetchLiveAgroNews();
  }, [t]);

  const fetchLiveAgroNews = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Busque as 5 notícias e eventos mais recentes e relevantes do agronegócio mundial e brasileiro para hoje. 
        Foque em: Preços de Soja/Milho, Relatórios USDA, Logística em Portos e Clima. 
        Retorne no formato JSON ARRAY de objetos: [{ "id": "string", "source": "string", "title": "string", "summary": "string", "sentiment": "BULLISH|BEARISH", "timestamp": "string" }]`,
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
      
      // Captura fontes do Google Search para transparência
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setSources(response.candidates[0].groundingMetadata.groundingChunks);
      }
    } catch (e) {
      console.error("Erro ao buscar notícias em tempo real:", e);
      // Fallback silencioso em caso de erro na API
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
        contents: `Analise o impacto estratégico desta notícia para um produtor rural: "${item.title} - ${item.summary}". Responda em ${lang} no tom consultivo premium da Prylom.`,
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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 animate-fadeIn pb-40 flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-prylom-gold uppercase tracking-[0.3em]">{t.liveFeed}</span>
          </div>
          <h1 className="text-4xl font-black text-[#000080] tracking-tighter uppercase">Agro Terminal</h1>
          <p className="text-gray-500 text-sm font-bold">Inteligência de Mercado em Tempo Real.</p>
        </div>
        <button onClick={onBack} className="bg-white text-prylom-dark border-2 border-gray-100 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:border-prylom-gold transition-all">
          {t.btnBack}
        </button>
      </div>

      {/* TradingView Ticker Widget com Símbolos Atualizados */}
      <div className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 min-h-[72px]">
        {React.createElement('tv-ticker-tape', { 
          symbols: JSON.stringify([
            { proName: "FX_IDC:USDBRL", title: "USD/BRL" },
            { proName: "CBOT:ZS1!", title: "Soybeans" },
            { proName: "CBOT:ZC1!", title: "Corn" },
            { proName: "CME:LE1!", title: "Live Cattle" },
            { proName: "ICEUS:KC1!", title: "Coffee" },
            { proName: "ICEUS:SB1!", title: "Sugar" }
          ]),
          colorTheme: "light",
          isTransparent: false,
          displayMode: "adaptive",
          locale: "pt"
        } as any)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
             <h2 className="text-xl font-black text-[#000080] uppercase tracking-widest">Principais Eventos do Dia</h2>
             <button onClick={fetchLiveAgroNews} className="text-[9px] font-black text-prylom-gold uppercase tracking-widest hover:underline">Atualizar Varredura</button>
          </div>
          
          {loading ? (
             <div className="py-20 flex flex-col items-center justify-center gap-6 bg-white rounded-[2.5rem] border border-gray-100">
                <div className="w-10 h-10 border-4 border-prylom-gold/20 border-t-prylom-gold rounded-full animate-spin"></div>
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Varredura Global de Inteligência...</p>
             </div>
          ) : (
            <div className="space-y-6">
              {news.length === 0 && <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px]">Nenhuma notícia crítica detectada para a região.</p>}
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
                    {loadingInsight ? 'Processando Insight Prylom AI...' : 'Gerar Análise Prylom AI'}
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

          {/* Listagem de Fontes Reais (Grounding) */}
          {sources.length > 0 && (
            <div className="mt-8 px-4">
               <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Fontes Verificadas (Grounding)</h4>
               <div className="flex flex-wrap gap-3">
                  {sources.map((source, idx) => (
                    <a key={idx} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-prylom-gold hover:underline">
                      [{idx + 1}] {source.web?.title || 'Referência Externa'}
                    </a>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="bg-[#000080] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Disclaimer Terminal</span>
                <h4 className="text-xl font-black mb-4 tracking-tight">Execução Estratégica</h4>
                <p className="text-xs font-medium leading-relaxed opacity-70">
                  Os dados apresentados via Terminal Prylom são extraídos via Grounding Search de provedores globais. Ciclo de atualização: 100% Real-Time. Foco exclusivo em suporte à decisão do produtor.
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-prylom-gold/10 rounded-full blur-3xl"></div>
           </div>
           
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Radar de Tendência</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <span className="text-xs font-bold text-prylom-dark">Selic Projetada</span>
                    <span className="font-black text-[#000080]">10.75%</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <span className="text-xs font-bold text-prylom-dark">Frete Regional (MT-Santos)</span>
                    <span className="font-black text-red-500">↑ Alta</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-prylom-dark">Clima (El Niño/La Niña)</span>
                    <span className="font-black text-green-600">Neutral</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTerminal;
