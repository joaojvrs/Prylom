
import React from 'react';

interface Props {
  onSelectOwner: () => void;
  onSelectBroker: () => void;
  onSelectTools: () => void;
  onSelectValuation: () => void;
  onSelectMarket: () => void;
  onSelectShopping: () => void;
  t: any;
}

const LandingPage: React.FC<Props> = ({ 
  onSelectOwner, 
  onSelectBroker, 
  onSelectTools, 
  onSelectValuation, 
  onSelectMarket, 
  onSelectShopping, 
  t 
}) => {
  return (
    <div className="w-full flex flex-col animate-fadeIn bg-[#FDFCFB]">
      
      {/* SECTION 1: HERO - ULTRA PREMIUM */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-prylom-dark px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2400" 
            alt="Agro High End" 
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

      {/* SECTION 2: THE HUB */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <header className="max-w-3xl mx-auto text-center mb-24">
            <span className="text-prylom-gold font-black uppercase text-[10px] tracking-[0.4em] mb-4 block">Ecossistema Digital</span>
            <h2 className="text-5xl md:text-7xl font-black text-[#000080] tracking-tighter leading-tight">
              Terminal <span className="text-prylom-gold">Hub</span>
            </h2>
            <div className="w-20 h-1.5 bg-prylom-gold mx-auto mt-8 rounded-full"></div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { click: onSelectShopping, icon: "🛒", label: t.btnShopping, desc: "Ativos exclusivos e oportunidades off-market." },
              { click: onSelectMarket, icon: "📈", label: t.btnMarket, desc: "Monitoramento global de commodities em tempo real." },
              { click: onSelectTools, icon: "🛠️", label: t.btnTools, desc: "Inteligência técnica e cálculos de margem avançados." },
              { click: onSelectValuation, icon: "📋", label: t.btnValuation, desc: "Avaliação oficial e auditoria de portfólio rural." }
            ].map((tool, idx) => (
              <div 
                key={idx}
                onClick={tool.click}
                className="group relative p-12 bg-[#FDFCFB] rounded-[4rem] border border-gray-100 cursor-pointer transition-all duration-700 hover:bg-prylom-dark hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] hover:-translate-y-4"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 mb-8 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:bg-prylom-gold group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">{tool.icon}</div>
                  <h4 className="text-2xl font-black text-[#000080] group-hover:text-white uppercase tracking-tighter mb-4">{tool.label}</h4>
                  <p className="text-gray-700 group-hover:text-gray-200 text-sm leading-relaxed mb-10 flex-1">
                    {tool.desc}
                  </p>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-prylom-gold">
                    Acessar Módulo <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              </div>
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
