
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppLanguage, AppCurrency } from '../types';
import { supabase } from '../supabaseClient';
import L from 'leaflet';

interface Props {
  onBack: () => void;
  onSelectProduct: (id: string) => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

interface Product {
  id: string;
  categoria: string;
  titulo: string;
  valor: number;
  unidade: string;
  descricao: string;
  estado: string;
  cidade: string;
  safra?: string;
  main_image?: string;
  qualidade?: string;
  coords?: [number, number];
}

const ShoppingCenter: React.FC<Props> = ({ onBack, onSelectProduct, t, lang, currency }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

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

  const formatPriceParts = (valInBrl: number) => {
    const converted = valInBrl * rates[currency];
    // Formatação brasileira explícita: 30.000.000,00
    const formattedNum = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(converted);
    
    return {
      symbol: getSymbol(),
      value: formattedNum
    };
  };

  useEffect(() => {
    fetchProducts();
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && !loading) {
      const timer = setTimeout(() => initGeneralMap(), 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, loading, activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`*, produtos_imagens (image_url, ordem)`)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      if (data) {
        setProducts(data.map((item: any) => ({
          ...item,
          main_image: item.produtos_imagens?.find((img: any) => img.ordem === 1)?.image_url || item.produtos_imagens?.[0]?.image_url
        })));
      }
    } catch (err) { 
      console.error("Error loading products:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredProducts = useMemo(() => {
    return activeCategory === 'all' 
      ? products 
      : products.filter(p => p.categoria === activeCategory);
  }, [products, activeCategory]);

  const initGeneralMap = async () => {
    if (!mapContainerRef.current || mapInstance.current) {
        if (mapInstance.current) {
            mapInstance.current.invalidateSize();
            renderMarkers();
        }
        return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      center: [-15.78, -47.93],
      zoom: 4,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg', {
      maxZoom: 19
    }).addTo(map);

    mapInstance.current = map;
    renderMarkers();
  };

  const renderMarkers = async () => {
    if (!mapInstance.current) return;
    
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) mapInstance.current?.removeLayer(layer);
    });

    const groupedByLocation = filteredProducts.reduce((acc, product) => {
      const key = `${product.cidade}-${product.estado}`.toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    const bounds = L.latLngBounds([]);

    for (const locationKey in groupedByLocation) {
      const items = groupedByLocation[locationKey];
      const firstItem = items[0];

      try {
        const query = `${firstItem.cidade}, ${firstItem.estado}, Brasil`;
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await resp.json();
        
        if (data && data.length > 0) {
          const pos = new L.LatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
          bounds.extend(pos);

          const hasMultiple = items.length > 1;
          const priceDataFirst = formatPriceParts(firstItem.valor);
          
          const marker = L.marker(pos, {
            icon: L.divIcon({
              className: 'custom-pin',
              html: `
                <div class="group relative">
                  <div class="bg-prylom-gold w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-all">
                    <span class="text-xs text-white font-black">${hasMultiple ? items.length : 'P'}</span>
                  </div>
                  
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white rounded-[2rem] shadow-3xl opacity-0 group-hover:opacity-100 transition-all pointer-events-auto w-64 border border-gray-100 overflow-hidden z-[500] invisible group-hover:visible">
                    <div class="bg-prylom-dark p-4 border-b border-white/10">
                       <p class="text-[9px] font-black text-prylom-gold uppercase tracking-[0.2em] mb-1">${hasMultiple ? 'Múltiplos Ativos' : firstItem.categoria}</p>
                       <p class="text-xs font-bold text-white truncate">${hasMultiple ? `${firstItem.cidade}, ${firstItem.estado}` : firstItem.titulo}</p>
                    </div>
                    <div class="max-h-48 overflow-y-auto no-scrollbar p-2 space-y-1">
                       ${items.map(p => {
                         const pd = formatPriceParts(p.valor);
                         return `
                         <div 
                           class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                           onclick="window.dispatchEvent(new CustomEvent('prylom-navigate', { detail: '${p.id}' }))"
                         >
                            <div class="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                               <img src="${p.main_image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=100'}" class="w-full h-full object-cover" />
                            </div>
                            <div class="flex-1 min-w-0">
                               <p class="text-[10px] font-black text-prylom-dark truncate uppercase tracking-tighter">${p.titulo}</p>
                               <p class="text-[10px] font-bold text-prylom-gold">${pd.symbol} ${pd.value}</p>
                            </div>
                         </div>
                       `}).join('')}
                    </div>
                    ${hasMultiple ? '' : `
                       <div class="p-3 bg-gray-50 border-t border-gray-100 text-center">
                          <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Clique para Detalhes</p>
                       </div>
                    `}
                  </div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })
          }).addTo(mapInstance.current);

          const handleNav = (e: any) => {
            if (e.detail) onSelectProduct(e.detail);
          };
          window.addEventListener('prylom-navigate', handleNav, { once: true });

          if (!hasMultiple) {
            marker.on('click', () => onSelectProduct(firstItem.id));
          }
        }
      } catch (e) {
        console.warn("Marker skip", e);
      }
    }

    if (bounds.isValid()) {
      mapInstance.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 });
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 animate-fadeIn pb-40 flex flex-col gap-10 h-full min-h-[80vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Prylom Assets Hub</span>
          <h1 className="text-4xl font-black text-prylom-dark tracking-tighter">{t.shoppingTitle}</h1>
          <p className="text-gray-700 text-sm font-bold">{t.shoppingSub}</p>
        </div>
        <div className="flex gap-4">
            <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400'}`}
                >
                    Grade
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400'}`}
                >
                    Mapa
                </button>
            </div>
            <button onClick={onBack} className="bg-white text-prylom-dark border-2 border-gray-100 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:border-prylom-gold transition-all">
            {t.btnBack}
            </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
         {[
           { id: 'all', label: t.catAll || 'Todos' },
           { id: 'fazendas', label: t.catFarms },
           { id: 'maquinas', label: t.catMachinery },
           { id: 'avioes', label: t.catPlanes },
           { id: 'graos', label: t.catGrains }
         ].map(cat => (
           <button 
             key={cat.id}
             onClick={() => setActiveCategory(cat.id)}
             className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
               activeCategory === cat.id ? 'bg-prylom-dark text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:border-prylom-gold'
             }`}
           >
             {cat.label}
           </button>
         ))}
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-prylom-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-black uppercase text-[10px] tracking-widest">{t.marketSync}</p>
        </div>
      ) : (
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map(product => {
                const priceData = formatPriceParts(product.valor);
                return (
                  <div 
                    key={product.id} 
                    onClick={() => onSelectProduct(product.id)}
                    className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col cursor-pointer"
                  >
                    <div className="h-72 relative overflow-hidden bg-gray-100">
                       <img 
                         src={product.main_image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'} 
                         alt={product.titulo} 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                       />
                       <div className="absolute top-6 left-6">
                          <span className="bg-prylom-dark/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">
                             {product.categoria}
                          </span>
                       </div>
                    </div>
                    
                    <div className="p-10 flex flex-col flex-1">
                       <div className="mb-6">
                          <h3 className="text-2xl font-black text-prylom-dark mb-2 tracking-tight line-clamp-1 group-hover:text-prylom-gold transition-colors">{product.titulo}</h3>
                          <div className="flex items-center gap-2 text-[10px] text-prylom-gold font-black uppercase tracking-widest">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                             {product.cidade} - {product.estado}
                          </div>
                       </div>
                       
                       <div className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <p className="text-prylom-gold text-[9px] font-black uppercase tracking-widest mb-1">Avaliação do Ativo</p>
                          <div className="flex items-baseline gap-1">
                             <span className="text-3xl font-black text-prylom-dark flex items-baseline">
                               <span className="text-lg mr-1">{priceData.symbol}</span>
                               <span>{priceData.value}</span>
                             </span>
                             {product.categoria !== 'fazendas' && (
                               <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest ml-1">
                                 / {product.unidade}
                               </span>
                             )}
                          </div>
                       </div>

                       <button className="w-full bg-prylom-dark text-white font-black py-6 rounded-full text-xs uppercase tracking-widest hover:bg-prylom-gold transition-all duration-500 shadow-xl group-hover:-translate-y-1">
                         {t.marketNegotiate}
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full h-[600px] md:h-[700px] rounded-[4rem] overflow-hidden border-8 border-white shadow-3xl relative bg-gray-100">
                <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
                <div className="absolute top-8 right-8 z-10 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-gray-100 pointer-events-none max-w-xs">
                    <p className="text-[10px] font-black text-prylom-gold uppercase tracking-[0.2em] mb-2">Visão Estratégica</p>
                    <p className="text-sm font-bold text-prylom-dark">Explore ativos geolocalizados. Agrupamentos mostram múltiplos anúncios no mesmo município.</p>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShoppingCenter;
