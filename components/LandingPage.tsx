import React, { useState, useEffect, useCallback } from 'react';

interface Props {
  onSelectOwner: () => void;
  onSelectBroker: () => void;
  onSelectTools: () => void;
  onSelectValuation: () => void;
  onSelectMarket: () => void;
  onSelectShopping: () => void;
  onSelectLegal: () => void;
  t: any;
}

const LandingPage: React.FC<Props> = ({ 
  onSelectOwner, 
  onSelectBroker, 
  onSelectTools, 
  onSelectValuation, 
  onSelectMarket, 
  onSelectShopping, 
  onSelectLegal,
  t 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const modules = [
    { click: onSelectShopping, icon: "🛒", label: t.btnShopping, desc: "Ativos exclusivos e oportunidades off-market." },
    { click: onSelectMarket, icon: "📈", label: t.btnMarket, desc: "Monitoramento global de commodities em tempo real." },
    { click: onSelectLegal, icon: "📑", label: t.btnLegal, desc: "Burocracia, risco e orientação consultiva estratégica." },
    { click: onSelectTools, icon: "🛠️", label: t.btnTools, desc: "Inteligência técnica e cálculos de margem avançados." },
    { click: onSelectValuation, icon: "📋", label: t.btnValuation, desc: "Avaliação oficial e auditoria de portfólio rural." }
  ];

  const getIndex = (offset: number) => {
    return (activeIndex + offset + modules.length) % modules.length;
  };

  const nextModule = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % modules.length);
    setProgress(0);
  }, [modules.length]);

  const prevModule = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + modules.length) % modules.length);
    setProgress(0);
  }, [modules.length]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          nextModule();
          return 0;
        }
        return p + 0.5; // Aproximadamente 6s para 100%
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isPaused, nextModule]);

  return (
    <div className="w-full flex flex-col animate-fadeIn bg-[#FDFCFB]">
      
      {/* SECTION 1: HERO - ULTRA PREMIUM */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-prylom-dark px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2400" 
            alt="" 
            className="w-full h-full object-cover opacity-40 scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-prylom-dark/95 via-prylom-dark/40 to-[#FDFCFB]"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-4 shadow-2xl">
            <span className="w-1.5 h-1.5 bg-prylom-gold rounded-full animate-pulse"></span>
            <span className="text-white text-[9px] font-black uppercase tracking-[0.5em]">{t.heroTagline}</span>
          </div>
          
          <h1 className="text-6xl md:text-[8rem] lg:text-[10rem] font-black text-white mb-8 leading-[0.85] tracking-tighter drop-shadow-2xl">
            {t.heroTitle}
          </h1>
          
          <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto font-light leading-relaxed tracking-tight">
            {t.heroDesc}
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center pt-8">
            <button 
              onClick={onSelectOwner}
              className="bg-prylom-gold text-white font-black px-16 py-7 rounded-full text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-white hover:text-prylom-dark transition-all duration-700 w-full md:w-auto transform hover:-translate-y-2"
            >
              {t.btnAnnounce}
            </button>
            <button 
              onClick={onSelectBroker}
              className="bg-white/20 backdrop-blur-md text-white border border-white/30 font-black px-16 py-7 rounded-full text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-prylom-dark transition-all duration-700 w-full md:w-auto transform hover:-translate-y-2"
            >
              {t.btnLearnMore}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE HUB - FOCO COM CONSCIÊNCIA DO TODO */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <header className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <span className="text-prylom-gold font-black uppercase text-[10px] tracking-[0.4em] block">Terminal Operacional</span>
            <h2 className="text-3xl md:text-5xl font-black text-[#000080] tracking-tighter uppercase leading-tight">
              Módulos do <span className="text-prylom-gold">Ecossistema</span>
            </h2>
            <div className="flex items-center justify-center gap-4 mt-6">
               <span className="text-[10px] font-black text-prylom-dark uppercase tracking-widest">0{activeIndex + 1} / 0{modules.length}</span>
               <div className="w-24 h-px bg-gray-200 relative">
                  <div className="absolute top-0 left-0 h-full bg-prylom-gold transition-all duration-100" style={{ width: `${progress}%` }}></div>
               </div>
            </div>
          </header>

          <div 
            className="relative h-[480px] md:h-[550px] flex items-center justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* CARDS EM LOOP */}
            <div className="relative w-full max-w-7xl flex items-center justify-center gap-4 md:gap-10">
              
              {/* CARD ESQUERDA (SECUNDÁRIO) */}
              <div 
                onClick={prevModule}
                className="hidden lg:flex flex-col items-center text-center p-10 bg-[#FDFCFB] rounded-[3rem] border border-gray-100 opacity-40 scale-85 blur-[1px] grayscale transition-all duration-700 cursor-pointer w-[300px] shrink-0"
              >
                <div className="text-4xl mb-6">{modules[getIndex(-1)].icon}</div>
                <h4 className="text-lg font-black text-[#000080] uppercase tracking-tighter line-clamp-1">{modules[getIndex(-1)].label}</h4>
              </div>

              {/* CARD CENTRAL (ATIVO) */}
              <div 
                className="relative z-20 w-[92%] md:w-[600px] p-12 md:p-20 bg-[#FDFCFB] rounded-[4rem] border border-gray-100 shadow-3xl transform scale-100 transition-all duration-700 cursor-default flex flex-col items-center text-center"
              >
                {/* Barra de Progresso Segmetada Superior */}
                <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 px-1.5 pt-1.5">
                  {modules.map((_, idx) => (
                    <div key={idx} className="flex-1 h-full bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-prylom-gold transition-all duration-100 ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`} 
                        style={{ width: idx === activeIndex ? `${progress}%` : '0%' }}
                      ></div>
                    </div>
                  ))}
                </div>

                <div key={activeIndex} className="animate-fadeIn space-y-8 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-sm border border-gray-50 transform hover:scale-110 hover:rotate-2 transition-all duration-500">
                    {modules[activeIndex].icon}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-5xl font-black text-[#000080] uppercase tracking-tighter">
                      {modules[activeIndex].label}
                    </h3>
                    <p className="text-gray-600 text-base md:text-lg font-medium leading-relaxed max-w-sm mx-auto">
                      {modules[activeIndex].desc}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); modules[activeIndex].click(); }}
                    className="mt-6 bg-[#000080] text-white px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-prylom-gold shadow-2xl transition-all active:scale-95"
                  >
                    Acessar Módulo
                  </button>
                </div>
              </div>

              {/* CARD DIREITA (SECUNDÁRIO) */}
              <div 
                onClick={nextModule}
                className="hidden lg:flex flex-col items-center text-center p-10 bg-[#FDFCFB] rounded-[3rem] border border-gray-100 opacity-40 scale-85 blur-[1px] grayscale transition-all duration-700 cursor-pointer w-[300px] shrink-0"
              >
                <div className="text-4xl mb-6">{modules[getIndex(1)].icon}</div>
                <h4 className="text-lg font-black text-[#000080] uppercase tracking-tighter line-clamp-1">{modules[getIndex(1)].label}</h4>
              </div>

            </div>

            {/* CONTROLES SUTIS DE NAVEGAÇÃO */}
            <button onClick={prevModule} className="absolute left-4 md:left-12 p-5 bg-white shadow-xl rounded-full text-prylom-dark hover:text-prylom-gold transition-all z-30 border border-gray-50 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextModule} className="absolute right-4 md:right-12 p-5 bg-white shadow-xl rounded-full text-prylom-dark hover:text-prylom-gold transition-all z-30 border border-gray-50 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* INDICADORES MINIMALISTAS */}
          <div className="flex justify-center gap-3 mt-8">
            {modules.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => { setActiveIndex(idx); setProgress(0); }}
                className={`h-1 rounded-full transition-all duration-700 ${idx === activeIndex ? 'w-10 bg-prylom-gold' : 'w-4 bg-gray-200'}`}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: INSTITUCIONAL & FOUNDER */}
      <section className="py-32 px-6 bg-[#FDFCFB] border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          
          <div className="lg:col-span-6 space-y-12">
             <div className="space-y-4">
                <span className="text-prylom-gold font-black uppercase text-[10px] tracking-[0.4em] block">{t.aboutMainTitle}</span>
                <h3 className="text-5xl md:text-6xl font-black text-[#000080] tracking-tighter leading-tight">Visão <span className="italic font-light">Estratégica</span> em cada elo.</h3>
             </div>
             <p className="text-xl text-[#000080] leading-relaxed font-medium max-w-xl">
               {t.aboutMainDesc}
             </p>
          </div>

          <div className="lg:col-span-6">
             <div className="relative group overflow-hidden rounded-[5rem] shadow-3xl aspect-[4/5] lg:aspect-auto lg:h-[700px] border border-gray-200">
                <img 
                  src="https://raw.githubusercontent.com/ai-gen-images/prylom/main/jairo-founder.png" 
                  alt="Founder Jairo Alves" 
                  className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=1200";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>

                <div className="absolute inset-0 p-16 flex flex-col justify-end">
                  <div className="flex items-center gap-3 mb-10 group-hover:translate-x-2 transition-transform duration-500">
                    <div className="font-black text-4xl flex items-center tracking-tighter text-[#000080]">
                      <span className="text-prylom-gold mr-1 font-black">〈</span>
                      <span>Prylom</span>
                      <span className="text-prylom-gold ml-1 font-black">〉</span>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <span className="text-prylom-gold font-black uppercase text-[10px] tracking-[0.4em] block">{t.ceoRole}</span>
                    <h4 className="text-5xl font-black text-[#000080] tracking-tighter">{t.ceoName}</h4>
                    <p className="text-[#000080]/80 text-lg leading-relaxed font-bold">
                      "Segurança e rentabilidade são os pilares da nossa consultoria estratégica para o produtor rural."
                    </p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;