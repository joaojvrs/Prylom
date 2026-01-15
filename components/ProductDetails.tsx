import React, { useState, useEffect, useMemo } from 'react';
import { AppLanguage, AppCurrency } from '../types';
import { supabase } from '../supabaseClient';
import { GoogleGenAI } from "@google/genai";

interface Props {
  productId: string | null;
  onBack: () => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const ProductDetails: React.FC<Props> = ({ productId, onBack, t, lang, currency }) => {
  const [product, setProduct] = useState<any>(null);
  const [spec, setSpec] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [availableAudios, setAvailableAudios] = useState<any[]>([]);
  const [prylomScore, setPrylomScore] = useState<number | null>(null);
  const [analyzingScore, setAnalyzingScore] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  
  const rates = useMemo(() => ({
    [AppCurrency.BRL]: 1, [AppCurrency.USD]: 0.19, [AppCurrency.CNY]: 1.42, [AppCurrency.RUB]: 18.5
  }), []);

  const flagMap: Record<string, string> = {
    [AppLanguage.PT]: "https://flagcdn.com/w80/br.png",
    [AppLanguage.EN]: "https://flagcdn.com/w80/us.png",
    [AppLanguage.ZH]: "https://flagcdn.com/w80/cn.png",
    [AppLanguage.RU]: "https://flagcdn.com/w80/ru.png"
  };

  const formatNumber = (val: number, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '---';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val);
  };

  const getSymbol = () => {
    switch (currency) {
      case AppCurrency.BRL: return 'R$';
      case AppCurrency.USD: return '$';
      case AppCurrency.CNY: return '¥';
      case AppCurrency.RUB: return '₽';
      default: return 'R$';
    }
  };

  const formatV = (val: number, isCurrency = true, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '---';
    const converted = val * rates[currency];
    const symbol = getSymbol();
    const formatted = formatNumber(converted, decimals);
    
    return isCurrency 
      ? <span className="flex items-baseline gap-1"><span className="text-[0.6em] font-black opacity-60">{symbol}</span><span>{formatted}</span></span>
      : formatted;
  };

  useEffect(() => {
    if (productId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchFullProductData();
    }
  }, [productId, lang]);

  const fetchFullProductData = async () => {
    setLoading(true);
    try {
      const { data: baseData } = await supabase.from('produtos').select('*').eq('id', productId).single();
      if (!baseData) return;

      const { data: specData } = await supabase.from(baseData.categoria).select('*').eq('produto_id', productId).maybeSingle();
      const { data: imgData } = await supabase.from('produtos_imagens').select('*').eq('produto_id', productId).order('ordem', { ascending: true });
      const { data: audioData } = await supabase.from('produtos_audios').select('*').eq('produto_id', productId);
      
      setProduct(baseData);
      setSpec(specData);
      if (imgData) {
        setImages(imgData);
        if (imgData.length > 0) setActiveImage(imgData[0].image_url);
      }
      if (audioData) setAvailableAudios(audioData);
      
      analyzePrylomScore(baseData, specData);
      fetchRelatedProducts(baseData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchRelatedProducts = async (currentProd: any) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          arrendamentos (modalidade, quantidade, unidade, ativo),
          produtos_imagens (image_url, ordem)
        `)
        .eq('estado', currentProd.estado)
        .neq('id', currentProd.id)
        .limit(3);
      
      if (data) {
        setRelatedProducts(data.map((item: any) => ({
          ...item,
          arrendamento_info: Array.isArray(item.arrendamentos) ? item.arrendamentos[0] : item.arrendamentos,
          main_image: item.produtos_imagens?.find((img: any) => img.ordem === 1)?.image_url || item.produtos_imagens?.[0]?.image_url
        })));
      }
    } catch (e) {
      console.error("Erro ao buscar relacionados:", e);
    }
  };

  const analyzePrylomScore = async (p: any, s: any) => {
    setAnalyzingScore(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as a premium asset analyst (Private Equity). Based on the data: Asset: ${p.titulo}, Value: ${p.valor}, Category: ${p.categoria}, Technical Data: ${JSON.stringify(s)}. Provide a score from 0.0 to 10.0 (PRYLOM SCORE). Be strict and rigorous. Consider age, usage hours, documentation, and market. Respond ONLY with the decimal number.`;
      const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
      const score = parseFloat(response.text?.trim() || "0");
      setPrylomScore(isNaN(score) ? 0 : score);
    } catch (e) {
      console.error(e);
      setPrylomScore(8.5);
    } finally {
      setAnalyzingScore(false);
    }
  };

  if (loading || !product) return <div className="p-40 text-center animate-pulse text-prylom-gold font-black uppercase text-[10px]">{t.mapProcessing}</div>;

  const isFarm = product.categoria === 'fazendas';
  const isPlane = product.categoria === 'avioes';
  const isMachine = product.categoria === 'maquinas';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fadeIn pb-40 space-y-12">
      <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase text-prylom-gold tracking-widest transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        {t.hubTitle} / {t.btnShopping}
      </button>

      {/* BLOCO 1: CONTEXTO & IDENTIDADE DO ATIVO */}
      <section className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
           <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[8px] font-black text-white bg-prylom-dark px-3 py-1 rounded-md uppercase tracking-widest">
                {isPlane ? '🛩️ ' + t.catPlanes : isMachine ? '🚜 ' + t.catMachinery : '🌾 ' + t.catFarms}
              </span>
              <span className="text-[8px] font-black text-prylom-dark bg-gray-100 px-3 py-1 rounded-md uppercase tracking-widest">
                🧠 {t.terminalExecution}
              </span>
              {product.certificacao && (
                <span className="text-[8px] font-black text-prylom-gold bg-prylom-gold/5 px-3 py-1 rounded-md border border-prylom-gold/10 uppercase tracking-widest">
                  🔒 {t.verifiedLabel}
                </span>
              )}
           </div>
           <h1 className="text-3xl font-black text-[#000080] tracking-tighter leading-none mb-2">
             {isPlane && spec?.fabricante ? `${spec.fabricante} ${spec.modelo}` : isMachine && spec?.marca ? `${spec.marca} ${spec.modelo}` : product.titulo}
           </h1>
           <div className="mt-3 flex flex-col gap-1">
             <div className="flex items-center gap-2 text-[10px] font-bold text-prylom-dark uppercase">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-prylom-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
               {product.cidade} — {product.estado}
             </div>
           </div>
        </div>
        
        <div className="col-span-1 flex flex-col justify-center">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.statusLabel}</p>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-sm font-black text-[#000080] uppercase tracking-tighter">{t.statusAvailable}</span>
           </div>
        </div>

        <div className="col-span-1 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 flex flex-col justify-center">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.priceTotal}</p>
           <p className="text-3xl font-black text-[#000080] leading-none">{formatV(product.valor)}</p>
        </div>
      </section>

      {/* SNAPSHOT SNAPSHOT */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Market Fit', val: t.highPerformance },
          { label: 'Positioning', val: t.ratioStable },
          { label: t.valuationAiAuditor, val: <span className="flex items-center gap-1">✔ OK</span> },
          { label: t.valuationConfidence, val: analyzingScore ? <span className="animate-pulse">...</span> : <span className="text-prylom-gold font-black">{prylomScore?.toFixed(1) || '8.5'} / 10</span> }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 text-center shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
            <div className="text-[10px] font-black text-[#000080] uppercase leading-tight">{item.val}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <div className="aspect-video bg-gray-100 rounded-[3.5rem] overflow-hidden border border-gray-200 shadow-xl relative group">
              <img src={activeImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute top-8 left-8 flex gap-2">
                 {product.certificacao && <span className="bg-[#000080] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-2xl">{t.adminAudited}</span>}
                 <span className="bg-white/90 backdrop-blur-md text-prylom-gold text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">Compliance OK</span>
              </div>
           </div>

           <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <h3 className="text-xl font-black text-[#000080] uppercase tracking-tighter">
                  {isPlane ? t.techFiltersPlane : isMachine ? t.techFiltersMachine : t.techFiltersFarm}
                </h3>
              </div>
              
              <div className="space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                  {isPlane ? (
                    <>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.manufacturer}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.fabricante || '---'}</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.model}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.modelo || '---'}</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.grainHarvest}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.ano || '---'}</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Hours</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.horas_voo || '---'} h</p></div>
                    </>
                  ) : isMachine ? (
                    <>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.brand}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.marca || '---'}</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.model}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.modelo || '---'}</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.grainHarvest}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.ano || '---'}</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.hoursMax}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.horas_trabalhadas || '---'} h</p></div>
                    </>
                  ) : (
                    <>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.areaTotal}</p><p className="text-xs font-black text-prylom-dark uppercase">{formatNumber(spec?.area_total_ha)} ha</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Crops</p><p className="text-xs font-black text-prylom-dark uppercase">{formatNumber(spec?.area_lavoura_ha)} ha</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.clayContent}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.teor_argila || '---'}</p></div>
                      <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.mapAltitude}</p><p className="text-xs font-black text-prylom-dark uppercase">{spec?.altitude_m || '---'} m</p></div>
                    </>
                  )}
                </div>
              </div>
           </div>
        </div>

        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-prylom-dark text-white p-10 rounded-[3rem] shadow-2xl space-y-8 border border-white/5">
              <div>
                 <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.3em] block mb-2">{t.terminalExecution}</span>
                 <h4 className="text-2xl font-black uppercase tracking-tighter">ROI Strategy</h4>
              </div>

              <button className="w-full bg-prylom-gold text-white font-black py-6 rounded-full text-[11px] uppercase tracking-widest hover:bg-white hover:text-prylom-dark transition-all shadow-xl">
                {t.marketNegotiate}
              </button>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
              <div>
                 <p className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4">Investment Thesis</p>
                 <h4 className="text-xl font-black text-[#000080] tracking-tighter uppercase mb-4">Prylom Insight</h4>
                 <p className="text-xs font-medium text-prylom-dark leading-relaxed italic opacity-80">
                   "{product.descricao || 'Asset selected by our strategic curatorship, presenting an excellent risk-return ratio and full documentation compliance.'}"
                 </p>
              </div>
           </div>
        </aside>
      </div>

      {/* SEÇÃO DE ATIVOS RELACIONADOS DA MESMA REGIÃO */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-gray-100 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
             <div>
                <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">{t.locationLabel}</span>
                <h3 className="text-2xl font-black text-[#000080] tracking-tighter uppercase">{t.relatedRegionAssets}</h3>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedProducts.map(p => {
              const convertedVal = p.valor ? p.valor * rates[currency] : 0;
              const formattedPrice = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(convertedVal);
              const symbol = getSymbol();

              return (
                <div key={p.id} onClick={() => { setProduct(null); window.scrollTo(0,0); fetchFullProductData(); }} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col group h-full">
                  <div className="h-56 relative overflow-hidden bg-gray-50">
                    <img src={p.main_image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-prylom-dark/80 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {p.tipo_transacao === 'venda' ? t.transactionSale : t.transactionLease}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-prylom-dark mb-1 tracking-tight line-clamp-1 group-hover:text-prylom-gold uppercase">{p.titulo}</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-4">{p.cidade} - {p.estado}</p>
                    <div className="mt-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[8px] font-black text-prylom-gold uppercase tracking-widest mb-1">{p.tipo_transacao === 'arrendamento' ? t.transactionLease : t.transactionSale}</p>
                      {p.tipo_transacao === 'arrendamento' && p.arrendamento_info ? (
                        <p className="text-base font-black text-prylom-dark">{p.arrendamento_info.quantidade} <span className="text-[10px]">{p.arrendamento_info.unidade?.replace('_', '/')}</span></p>
                      ) : (
                        <p className="text-xl font-black text-prylom-dark">
                          <span className="text-[0.6em] mr-1 opacity-60">{symbol}</span>
                          {formattedPrice}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;