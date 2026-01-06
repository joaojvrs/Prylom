import React, { useState, useEffect, useMemo } from 'react';
import { AppLanguage, AppCurrency } from '../types';
import { supabase } from '../supabaseClient';

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
  
  const rates = useMemo(() => ({
    [AppCurrency.BRL]: 1, [AppCurrency.USD]: 0.19, [AppCurrency.CNY]: 1.42, [AppCurrency.RUB]: 18.5
  }), []);

  const flagMap: Record<string, string> = {
    [AppLanguage.PT]: "https://flagcdn.com/w80/br.png",
    [AppLanguage.EN]: "https://flagcdn.com/w80/us.png",
    [AppLanguage.ZH]: "https://flagcdn.com/w80/cn.png",
    [AppLanguage.RU]: "https://flagcdn.com/w80/ru.png"
  };

  const languageNameMap: Record<string, string> = {
    [AppLanguage.PT]: "Português",
    [AppLanguage.EN]: "English",
    [AppLanguage.ZH]: "中文 (Mandarin)",
    [AppLanguage.RU]: "Русский (Russian)"
  };

  const formatV = (val: number, isCurrency = true) => {
    if (val === undefined || val === null) return '---';
    const converted = val * rates[currency];
    const symbol = currency === AppCurrency.BRL ? 'R$' : currency === AppCurrency.USD ? '$' : currency === AppCurrency.CNY ? '¥' : '₽';
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: isCurrency ? 2 : 0,
      maximumFractionDigits: isCurrency ? 2 : 0
    }).format(converted);
    return isCurrency 
      ? <span className="flex items-baseline gap-1"><span className="text-[0.6em] font-black opacity-60">{symbol}</span><span>{formatted}</span></span>
      : formatted;
  };

  useEffect(() => {
    if (productId) fetchFullProductData();
  }, [productId]);

  const fetchFullProductData = async () => {
    setLoading(true);
    try {
      const { data: baseData } = await supabase.from('produtos').select('*').eq('id', productId).single();
      const { data: specData } = await supabase.from(baseData.categoria).select('*').eq('produto_id', productId).maybeSingle();
      const { data: imgData } = await supabase.from('produtos_imagens').select('*').eq('produto_id', productId).order('ordem', { ascending: true });
      const { data: audioData } = await supabase.from('produtos_audios').select('*').eq('produto_id', productId);
      
      setProduct(baseData);
      setSpec(specData);
      if (imgData) {
        setImages(imgData);
        if (imgData.length > 0) setActiveImage(imgData[0].image_url);
      }
      if (audioData) {
        setAvailableAudios(audioData);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="p-40 text-center animate-pulse text-prylom-gold font-black uppercase text-[10px]">Auditando Ativo Financeiro...</div>;

  const isFarm = product.categoria === 'fazendas';
  const isGrain = product.categoria === 'graos';
  const isPlane = product.categoria === 'avioes';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fadeIn pb-40 space-y-12">
      <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase text-prylom-gold tracking-widest hover:opacity-70 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Terminal Hub / Marketplace
      </button>

      {/* Header do Produto */}
      <section className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ativo Estratégico</p>
           <h1 className="text-3xl font-black text-[#000080] tracking-tighter leading-none">{product.titulo}</h1>
           <p className="text-[10px] font-bold text-prylom-gold mt-2 uppercase">{isGrain ? `Origem: ${spec?.origem || 'N/A'}` : `${product.cidade} — ${product.estado}`}</p>
        </div>
        <div>
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{isFarm ? 'Área Total' : isPlane ? 'Horas Totais' : isGrain ? 'Safra / Ciclo' : 'Ano / Modelo'}</p>
           <p className="text-3xl font-black text-[#000080]">{isFarm ? `${spec?.area_total_ha} ha` : isPlane ? `${spec?.horas_voo || '---'} h` : isGrain ? (spec?.safra || '---') : `${spec?.ano || '---'}`}</p>
        </div>
        <div>
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{isFarm ? 'Aptidão Principal' : isPlane ? 'Status CA/CM' : isGrain ? 'Status Estoque' : 'Uso Acumulado'}</p>
           <p className="text-2xl font-black text-prylom-gold uppercase">{isFarm ? (spec?.area_lavoura_ha > 0 ? 'Lavoura' : 'Pecuária') : isGrain ? (spec?.estoque_toneladas > 0 ? 'Disponível' : 'Em Trânsito') : isPlane ? 'Válido' : `${spec?.horas_trabalhadas || 0} h`}</p>
        </div>
        <div>
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Preço Sugerido</p>
           <p className="text-3xl font-black text-[#000080]">{formatV(product.valor)}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Galeria e Dossiê */}
        <div className="lg:col-span-8 space-y-8">
           <div className="aspect-video bg-gray-100 rounded-[3.5rem] overflow-hidden border border-gray-200 shadow-xl relative group">
              <img src={activeImage} className="w-full h-full object-cover" />
              <div className="absolute top-8 left-8 flex gap-2">
                 {product.certificacao && <span className="bg-[#000080] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-2xl">Auditado Prylom</span>}
              </div>
           </div>

           <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100">
              <h3 className="text-xl font-black text-[#000080] uppercase tracking-tighter mb-8">Dossiê Técnico</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                 {Object.entries(spec || {}).map(([key, value]) => {
                   if (!value || ['id', 'produto_id', 'created_at'].includes(key)) return null;
                   return (
                     <div key={key}>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-bold text-prylom-dark uppercase">{String(value)}</p>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>

        {/* Sidebar com Call to Action e Áudios */}
        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-[#000080] text-white p-10 rounded-[3rem] shadow-2xl">
              <h4 className="text-lg font-black uppercase tracking-tighter mb-6">Terms & Execution</h4>
              <button className="w-full bg-white text-[#000080] font-black py-6 rounded-full text-[11px] uppercase tracking-widest hover:bg-prylom-gold hover:text-white transition-all shadow-xl">Solicitar Atendimento</button>
           </div>

           <div className="bg-[#FDFCFB] p-10 rounded-[3rem] border-2 border-prylom-gold/10 shadow-sm">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4">Apresentação Estratégica</p>
                  <p className="text-xs font-medium text-[#000080] leading-relaxed italic mb-8">"{product.descricao}"</p>
                </div>
                
                {availableAudios.length > 0 && (
                  <div className="space-y-4">
                    {availableAudios.map((audio) => {
                      const langKey = (audio.lang || "").toUpperCase();
                      const flagUrl = flagMap[langKey] || flagMap[AppLanguage.PT];
                      const langName = languageNameMap[langKey] || audio.lang;

                      return (
                        <div key={audio.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <img 
                              src={flagUrl} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-50 shadow-sm" 
                              alt={langKey} 
                            />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-[#000080] uppercase tracking-widest">
                                Idioma: <span className="text-prylom-gold ml-1">{langName}</span>
                              </span>
                            </div>
                          </div>
                          <audio controls className="w-full h-10 accent-prylom-gold rounded-full">
                            <source src={audio.audio_url} />
                            Seu navegador não suporta áudio.
                          </audio>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default ProductDetails;