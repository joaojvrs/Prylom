import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppLanguage, AppCurrency } from '../types';
import { supabase } from '../supabaseClient';
import L from 'leaflet';

interface Product {
  id: string;
  categoria: string;
  titulo: string;
  valor: number | null;
  unidade: string;
  descricao: string;
  estado: string;
  cidade: string;
  tipo_transacao: 'venda' | 'arrendamento';
  status: string;
  certificacao: boolean;
  tem_arrendamento_ativo?: boolean;
  arrendamento_info?: any;
  main_image?: string;
  area_total_ha?: number;
  fazenda_data?: any;
  maquina_data?: any;
  aviao_data?: any;
  grao_data?: any;
  coords?: [number, number];
}

interface Props {
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const ShoppingCenter: React.FC<Props> = ({ onBack, onSelectProduct, t, lang, currency }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<'all' | 'venda' | 'arrendamento'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Cache de Geocoding para evitar requisições repetidas e lentidão no render
  const geoCache = useRef<Record<string, L.LatLng>>({});

  // Filtros Universais
  const [filterState, setFilterState] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [priceMode, setPriceMode] = useState<'total' | 'hectare'>('total');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtros Inteligentes (Fazendas)
  const [minAreaTotal, setMinAreaTotal] = useState<string>('');
  const [maxAreaTotal, setMaxAreaTotal] = useState<string>('');
  const [minAreaLavoura, setMinAreaLavoura] = useState<string>('');
  const [soilType, setSoilType] = useState<string>('');
  const [clayContent, setClayContent] = useState<string>('');
  const [topography, setTopography] = useState<string>('');
  const [docOnlyOk, setDocOnlyOk] = useState<boolean>(false);

  // Filtros Inteligentes (Máquinas)
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [machineModelFilter, setMachineModelFilter] = useState<string>('');
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');
  const [maxHours, setMaxHours] = useState<string>('');
  const [conservationState, setConservationState] = useState<string>('');
  const [precisionAgFilter, setPrecisionAgFilter] = useState<string>('');
  const [minPower, setMinPower] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('');

  // Filtros Inteligentes (Aviões)
  const [planeTypeFilter, setPlaneTypeFilter] = useState<string>('');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('');
  const [minYearPlane, setMinYearPlane] = useState<string>('');
  const [maxHoursPlane, setMaxHoursPlane] = useState<string>('');
  const [anacHomologFilter, setAnacHomologFilter] = useState<string>('');

  // Filtros Inteligentes (Grãos)
  const [grainCulture, setGrainCulture] = useState<string>('');
  const [grainHarvest, setGrainHarvest] = useState<string>('');
  const [grainQuality, setGrainQuality] = useState<string>('');
  const [minVolume, setMinVolume] = useState<string>('');

  // Filtros de Arrendamento
  const [arrModalidade, setArrModalidade] = useState<string>('');
  const [arrAptidao, setArrAptidao] = useState<string>('');
  const [minArrArea, setMinArrArea] = useState<string>('');
  const [maxArrArea, setMaxArrArea] = useState<string>('');
  const [arrCulturaBase, setArrCulturaBase] = useState<string>('');
  const [arrSafraInicio, setArrSafraInicio] = useState<string>('');
  const [arrQtdSafras, setArrQtdSafras] = useState<string>('');
  const [arrInicioPrevisto, setArrInicioPrevisto] = useState<string>('');
  const [arrMesInicioColheita, setArrMesInicioColheita] = useState<string>('');

  // --- FILTROS DE MAPA ---
  const [mapGrouping, setMapGrouping] = useState<'municipio' | 'microrregiao'>('municipio');
  const [mapHeatmap, setMapHeatmap] = useState<'none' | 'price' | 'productivity'>('none');
  const [mapOnlyFarms, setMapOnlyFarms] = useState(false);
  const [mapOnlyLeases, setMapOnlyLeases] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const mapLayersRef = useRef<{ markers: L.LayerGroup, heatmap: L.LayerGroup } | null>(null);

  const rates = useMemo(() => ({
    [AppCurrency.BRL]: 1, [AppCurrency.USD]: 0.19, [AppCurrency.CNY]: 1.42, [AppCurrency.RUB]: 18.5
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

  const formatPriceParts = (valInBrl: number | null) => {
    if (valInBrl === null) return { symbol: getSymbol(), value: '---' };
    const converted = valInBrl * rates[currency];
    const formattedNum = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(converted);
    return { symbol: getSymbol(), value: formattedNum };
  };

  useEffect(() => {
    // Bridge global para cliques no tooltip do Leaflet
    (window as any).openPrylomProduct = (id: string) => {
      onSelectProduct(id);
    };

    fetchProducts();
    return () => { 
      if (mapInstance.current) mapInstance.current.remove(); 
      delete (window as any).openPrylomProduct;
    };
  }, []);

  // SOLUÇÃO: Atrasar inicialização para o DOM e animações estabilizarem
  useEffect(() => {
    if (viewMode === 'map' && !loading) {
      const timer = setTimeout(() => {
        initGeneralMap();
        // Invalida o tamanho após o render do container estar concluído
        setTimeout(() => mapInstance.current?.invalidateSize(), 100);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, loading]);

  useEffect(() => {
    if (mapInstance.current && mapLayersRef.current) {
        renderMarkers();
    }
  }, [mapGrouping, mapHeatmap, mapOnlyFarms, mapOnlyLeases, products, activeCategory, transactionType, filterState, filterCity, filterStatus, minPrice, maxPrice, minAreaTotal, brandFilter, grainCulture, planeTypeFilter, arrModalidade, arrAptidao, minArrArea, maxArrArea, arrCulturaBase, arrSafraInicio, arrQtdSafras, arrInicioPrevisto, arrMesInicioColheita]);

  useEffect(() => {
    if (activeCategory !== 'fazendas' && activeCategory !== 'all') {
      setTransactionType('all');
    }
  }, [activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          fazendas (*),
          maquinas (*),
          avioes (*),
          graos (*),
          arrendamentos (
            modalidade,
            quantidade,
            unidade,
            prazo_tipo,
            safra_inicio,
            quantidade_safras,
            anos_contrato,
            inicio_previsto,
            mes_inicio_colheita,
            mes_fim_colheita,
            ativo,
            area_arrendada_ha
          ),
          produtos_imagens (image_url, ordem)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setProducts(data.map((item: any) => {
          const arr = Array.isArray(item.arrendamentos) ? item.arrendamentos[0] : item.arrendamentos;
          const faz = Array.isArray(item.fazendas) ? item.fazendas[0] : item.fazendas;
          const maq = Array.isArray(item.maquinas) ? item.maquinas[0] : item.maquinas;
          const avi = Array.isArray(item.avioes) ? item.avioes[0] : item.avioes;
          const gra = Array.isArray(item.graos) ? item.graos[0] : item.graos;
          return {
            ...item,
            fazenda_data: faz,
            maquina_data: maq,
            aviao_data: avi,
            grao_data: gra,
            area_total_ha: faz?.area_total_ha || null,
            tem_arrendamento_ativo: !!arr && arr.ativo,
            arrendamento_info: arr,
            main_image: item.produtos_imagens?.find((img: any) => img.ordem === 1)?.image_url || item.produtos_imagens?.[0]?.image_url
          };
        }));
      }
    } catch (err) { 
      console.error("Erro ao carregar produtos:", err);
    } finally { 
      setLoading(false); 
    }
  };

  const availableStates = useMemo(() => Array.from(new Set(products.map(p => p.estado))).sort(), [products]);
  const availableCities = useMemo(() => Array.from(new Set(products.filter(p => !filterState || p.estado === filterState).map(p => p.cidade))).sort(), [products, filterState]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.categoria === activeCategory);
    }

    if (transactionType !== 'all') {
      filtered = filtered.filter(p => p.tipo_transacao === transactionType);
    }

    if (viewMode === 'map') {
        if (mapOnlyFarms) filtered = filtered.filter(p => p.categoria === 'fazendas');
        if (mapOnlyLeases) filtered = filtered.filter(p => p.tipo_transacao === 'arrendamento');
    }

    if (filterState) {
      filtered = filtered.filter(p => p.estado === filterState);
    }

    if (filterCity) {
      filtered = filtered.filter(p => p.cidade === filterCity);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'verified') filtered = filtered.filter(p => p.certificacao);
      else filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (minPrice || maxPrice) {
      filtered = filtered.filter(p => {
        if (p.tipo_transacao === 'arrendamento') return true;
        if (!p.valor) return false;
        let valueToCompare = p.valor;
        if (priceMode === 'hectare' && p.area_total_ha) {
          valueToCompare = p.valor / p.area_total_ha;
        }
        if (minPrice && valueToCompare < Number(minPrice)) return false;
        if (maxPrice && valueToCompare > Number(maxPrice)) return false;
        return true;
      });
    }

    // Filtros Técnicos de Fazendas
    if (activeCategory === 'fazendas' || activeCategory === 'all') {
      if (minAreaTotal) filtered = filtered.filter(p => p.area_total_ha && p.area_total_ha >= Number(minAreaTotal));
      if (maxAreaTotal) filtered = filtered.filter(p => p.area_total_ha && p.area_total_ha <= Number(maxAreaTotal));
      if (minAreaLavoura) filtered = filtered.filter(p => p.fazenda_data?.area_lavoura_ha && p.fazenda_data?.area_lavoura_ha >= Number(minAreaLavoura));
      if (soilType) filtered = filtered.filter(p => p.fazenda_data?.tipo_solo?.toLowerCase().includes(soilType.toLowerCase()));
      if (clayContent) filtered = filtered.filter(p => p.fazenda_data?.teor_argila?.includes(clayContent));
      if (topography) filtered = filtered.filter(p => p.fazenda_data?.topografia?.toLowerCase().includes(topography.toLowerCase()));
      if (docOnlyOk) filtered = filtered.filter(p => p.fazenda_data?.documentacao_ok?.toLowerCase().includes('sim') || p.fazenda_data?.documentacao_ok?.toLowerCase().includes('ok'));
    }

    // Filtros de Arrendamento
    if (transactionType === 'arrendamento' || mapOnlyLeases) {
      if (arrModalidade) filtered = filtered.filter(p => p.arrendamento_info?.modalidade === arrModalidade);
      if (arrAptidao) filtered = filtered.filter(p => p.fazenda_data?.vocacao?.toLowerCase().includes(arrAptidao.toLowerCase()));
      if (minArrArea) filtered = filtered.filter(p => p.arrendamento_info?.area_arrendada_ha && p.arrendamento_info?.area_arrendada_ha >= Number(minArrArea));
      if (maxArrArea) filtered = filtered.filter(p => p.arrendamento_info?.area_arrendada_ha && p.arrendamento_info?.area_arrendada_ha <= Number(maxArrArea));
      if (arrCulturaBase) filtered = filtered.filter(p => p.arrendamento_info?.unidade?.toLowerCase().includes(arrCulturaBase.toLowerCase()));
      if (arrSafraInicio) filtered = filtered.filter(p => p.arrendamento_info?.safra_inicio?.includes(arrSafraInicio));
      if (arrQtdSafras) filtered = filtered.filter(p => p.arrendamento_info?.quantidade_safras && p.arrendamento_info?.quantidade_safras >= Number(arrQtdSafras));
      if (arrInicioPrevisto) filtered = filtered.filter(p => p.arrendamento_info?.inicio_previsto && p.arrendamento_info?.inicio_previsto.includes(arrInicioPrevisto));
      if (arrMesInicioColheita) filtered = filtered.filter(p => p.arrendamento_info?.mes_inicio_colheita?.toString() === arrMesInicioColheita);
    }

    // Filtros Técnicos de Máquinas
    if (activeCategory === 'maquinas' || activeCategory === 'all') {
      if (brandFilter) filtered = filtered.filter(p => p.maquina_data?.marca?.toLowerCase().includes(brandFilter.toLowerCase()));
      if (machineModelFilter) filtered = filtered.filter(p => p.maquina_data?.modelo?.toLowerCase().includes(machineModelFilter.toLowerCase()));
      if (minYear) filtered = filtered.filter(p => p.maquina_data?.ano && p.maquina_data?.ano >= Number(minYear));
      if (maxYear) filtered = filtered.filter(p => p.maquina_data?.ano && p.maquina_data?.ano <= Number(maxYear));
      if (maxHours) filtered = filtered.filter(p => p.maquina_data?.horas_trabalhadas && p.maquina_data?.horas_trabalhadas <= Number(maxHours));
      if (conservationState) filtered = filtered.filter(p => p.maquina_data?.estado_conservacao?.toLowerCase().includes(conservationState.toLowerCase()));
      if (precisionAgFilter) filtered = filtered.filter(p => p.maquina_data?.agricultura_precisao?.toLowerCase().includes(precisionAgFilter.toLowerCase()));
      if (minPower) filtered = filtered.filter(p => {
        const powerValue = parseInt(p.maquina_data?.potencia);
        return !isNaN(powerValue) && powerValue >= Number(minPower);
      });
      if (fuelType) filtered = filtered.filter(p => p.maquina_data?.combustivel?.toLowerCase().includes(fuelType.toLowerCase()));
    }

    // Filtros Técnicos de Aviões
    if (activeCategory === 'avioes' || activeCategory === 'all') {
      if (planeTypeFilter) filtered = filtered.filter(p => p.aviao_data?.tipo_operacao?.toLowerCase().includes(planeTypeFilter.toLowerCase()));
      if (manufacturerFilter) filtered = filtered.filter(p => p.aviao_data?.fabricante?.toLowerCase().includes(manufacturerFilter.toLowerCase()));
      if (minYearPlane) filtered = filtered.filter(p => p.aviao_data?.ano && p.aviao_data?.ano >= Number(minYearPlane));
      if (maxHoursPlane) filtered = filtered.filter(p => p.aviao_data?.horas_voo && p.aviao_data?.horas_voo <= Number(maxHoursPlane));
      if (anacHomologFilter) filtered = filtered.filter(p => p.aviao_data?.homologado_anac?.toLowerCase().includes(anacHomologFilter.toLowerCase()));
    }

    // Filtros Técnicos de Grãos
    if (activeCategory === 'graos' || activeCategory === 'all') {
      if (grainCulture) filtered = filtered.filter(p => p.grao_data?.cultura?.toLowerCase().includes(grainCulture.toLowerCase()));
      if (grainHarvest) filtered = filtered.filter(p => p.grao_data?.safra?.toLowerCase().includes(grainHarvest.toLowerCase()));
      if (grainQuality) filtered = filtered.filter(p => p.grao_data?.qualidade?.toLowerCase().includes(grainQuality.toLowerCase()));
      if (minVolume) filtered = filtered.filter(p => p.grao_data?.estoque_toneladas && p.grao_data?.estoque_toneladas >= Number(minVolume));
    }
    
    return filtered;
  }, [products, activeCategory, transactionType, filterState, filterCity, filterStatus, minPrice, maxPrice, priceMode, minAreaTotal, maxAreaTotal, minAreaLavoura, soilType, clayContent, topography, docOnlyOk, brandFilter, machineModelFilter, minYear, maxYear, maxHours, conservationState, precisionAgFilter, minPower, fuelType, planeTypeFilter, manufacturerFilter, minYearPlane, maxHoursPlane, anacHomologFilter, grainCulture, grainHarvest, grainQuality, minVolume, arrModalidade, arrAptidao, minArrArea, maxArrArea, arrCulturaBase, arrSafraInicio, arrQtdSafras, arrInicioPrevisto, arrMesInicioColheita, mapOnlyFarms, mapOnlyLeases, viewMode]);

  const initGeneralMap = async () => {
    if (!mapContainerRef.current) return;
    if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
    }
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, attributionControl: false, center: [-15.78, -47.93], zoom: 4,
    });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg', { maxZoom: 19 }).addTo(map);
    
    mapLayersRef.current = {
        markers: L.layerGroup().addTo(map),
        heatmap: L.layerGroup().addTo(map)
    };

    mapInstance.current = map;
    renderMarkers();
  };

  const renderMarkers = async () => {
    if (!mapInstance.current || !mapLayersRef.current) return;
    
    mapLayersRef.current.markers.clearLayers();
    mapLayersRef.current.heatmap.clearLayers();

    const groupingKey = (p: Product) => {
        if (mapGrouping === 'municipio') return `${p.cidade}-${p.estado}`.toLowerCase();
        if (mapGrouping === 'microrregiao') return `${p.fazenda_data?.regiao_produtiva || 'Região Geral'}-${p.estado}`.toLowerCase();
        return `${p.cidade}-${p.estado}`.toLowerCase();
    };

    const grouped = filteredProducts.reduce((acc, p) => {
      const key = groupingKey(p);
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, Product[]>);

    const bounds = L.latLngBounds([]);
    
    for (const key in grouped) {
      const items = grouped[key];
      const p = items[0];
      const searchTerm = mapGrouping === 'municipio' ? `${p.cidade}, ${p.estado}, Brasil` : `${p.estado}, Brasil`;

      let pos: L.LatLng | null = null;

      if (geoCache.current[searchTerm]) {
          pos = geoCache.current[searchTerm];
      } else {
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=1`);
          const data = await resp.json();
          if (data?.[0]) {
            pos = new L.LatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
            geoCache.current[searchTerm] = pos;
          }
        } catch (e) { console.error("Geocoding failed for:", key); }
      }
      
      if (pos) {
        bounds.extend(pos);

        if (mapHeatmap !== 'none') {
            let weight = 0;
            let color = '#d4a017';

            if (mapHeatmap === 'price') {
                const avgPriceHa = items.reduce((acc, curr) => acc + (curr.valor && curr.area_total_ha ? curr.valor / curr.area_total_ha : 0), 0) / items.length;
                weight = Math.min(avgPriceHa / 1000, 50);
                color = avgPriceHa > 50000 ? '#ef4444' : (avgPriceHa > 25000 ? '#f59e0b' : '#10b981');
            } else if (mapHeatmap === 'productivity') {
                const avgPrec = items.reduce((acc, curr) => acc + (curr.fazenda_data?.precipitacao_mm || 0), 0) / items.length;
                weight = Math.min(avgPrec / 20, 50);
                color = avgPrec > 1800 ? '#22c55e' : (avgPrec > 1200 ? '#3b82f6' : '#9ca3af');
            }

            L.circle(pos, {
                radius: weight * 1000,
                fillColor: color,
                fillOpacity: 0.4,
                stroke: false
            }).addTo(mapLayersRef.current.heatmap);
        }

        const primaryCat = items[0].categoria;
        let pinIcon = '📍';
        if (primaryCat === 'fazendas') pinIcon = '🌱';
        else if (primaryCat === 'maquinas') pinIcon = '🚜';
        else if (primaryCat === 'avioes') pinIcon = '🛩️';
        else if (primaryCat === 'graos') pinIcon = '🌾';

        // CONTEÚDO DO TOOLTIP COM ESTILO DE ANÚNCIO PREMIUM
        const tooltipContent = `
          <div class="p-4 w-full flex flex-col gap-4">
            <header class="flex justify-between items-center border-b border-white/10 pb-3">
              <span class="text-[10px] font-black text-prylom-gold uppercase tracking-[0.2em]">${items.length} ${items.length > 1 ? 'Ativos' : 'Ativo'} em ${p.cidade}</span>
              <span class="bg-white/10 px-2 py-0.5 rounded text-[7px] font-bold text-white/40 uppercase tracking-widest">Prylom Hub</span>
            </header>
            <div class="flex flex-col gap-3">
              ${items.slice(0, 4).map(it => {
                const price = formatPriceParts(it.valor);
                const miniPhoto = it.main_image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=150';
                return `
                  <div onclick="window.openPrylomProduct('${it.id}')" class="prylom-mini-ad flex items-center gap-4 p-2.5 bg-white/5 rounded-2xl cursor-pointer group">
                     <div class="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40">
                       <img src="${miniPhoto}" class="w-full h-full object-cover group-hover:scale-115 transition-transform duration-700" />
                     </div>
                     <div class="flex flex-col min-w-0 flex-1">
                       <span class="text-[11px] font-black text-white uppercase truncate tracking-tight mb-1">${it.titulo}</span>
                       <div class="flex items-center justify-between">
                         <span class="text-[10px] font-black text-prylom-gold">${price.symbol} ${price.value}</span>
                         <span class="text-[7px] font-black text-white/30 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-full group-hover:border-prylom-gold/50 group-hover:text-prylom-gold transition-colors">Detalhes</span>
                       </div>
                     </div>
                  </div>
                `;
              }).join('')}
              ${items.length > 4 ? `
                <div class="text-center py-2 bg-white/5 rounded-xl text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">+ ${items.length - 4} outros ativos</div>
              ` : ''}
              <div class="pt-2 flex justify-center items-center gap-2">
                 <div class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                 <span class="text-[7px] font-black text-white/30 uppercase tracking-[0.5em]">Auditado Prylom Verified Analysis</span>
              </div>
            </div>
          </div>
        `;

        const marker = L.marker(pos, {
          icon: L.divIcon({
            className: 'custom-pin',
            html: `<div class="bg-prylom-dark w-12 h-12 rounded-full border-4 border-white shadow-3xl flex flex-col items-center justify-center font-black text-white text-[9px] transform relative group cursor-pointer">
                      <span class="absolute -top-1 -right-1 bg-prylom-gold w-5 h-5 rounded-full border-2 border-white text-[8px] flex items-center justify-center shadow-lg group-hover:bg-white group-hover:text-prylom-dark transition-colors">${items.length}</span>
                      <span class="text-lg leading-none">${pinIcon}</span>
                      <span class="text-[6px] opacity-60 uppercase tracking-tighter mt-0.5">${mapGrouping === 'municipio' ? t.municipio : t.microrregiao}</span>
                   </div>`,
            iconSize: [48, 48]
          })
        }).addTo(mapLayersRef.current.markers);

        // --- LÓGICA DE HOVER PROFISSIONAL (DESACOPLADA) ---
        let closeTimeout: any;

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          className: 'prylom-custom-tooltip',
          offset: L.point(0, -10),
          sticky: false,
          interactive: true,
          opacity: 1
        });

        // Abre o tooltip ao passar no marcador
        marker.on('mouseover', () => {
          clearTimeout(closeTimeout);
          marker.openTooltip();
        });

        // Gerenciamento de persistência via eventos do próprio Tooltip
        marker.on('tooltipopen', (e) => {
          const el = e.tooltip.getElement();
          if (!el) return;

          // Se o mouse entrar no tooltip, cancelamos o fechamento
          el.addEventListener('mouseenter', () => {
            clearTimeout(closeTimeout);
          });

          // Se o mouse sair do tooltip, agendamos o fechamento com pequeno delay para permitir transições
          el.addEventListener('mouseleave', () => {
            closeTimeout = setTimeout(() => {
              marker.closeTooltip();
            }, 150);
          });
        });

        marker.on('click', () => {
            if (items.length === 1) onSelectProduct(items[0].id);
            else {
                mapInstance.current?.setView(pos!, 12);
            }
        });
      }
    }

    if (bounds.isValid() && mapInstance.current) {
        mapInstance.current.fitBounds(bounds, { padding: [120, 120] });
        setTimeout(() => mapInstance.current?.invalidateSize(), 50);
    }
  };

  const categories = [
    { id: 'all', label: t.catAll },
    { id: 'fazendas', label: t.catFarms },
    { id: 'maquinas', label: t.catMachinery },
    { id: 'avioes', label: t.catPlanes },
    { id: 'graos', label: t.catGrains }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 animate-fadeIn pb-40 flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">{t.hubSub}</span>
          <h1 className="text-4xl font-black text-prylom-dark tracking-tighter uppercase">{t.shoppingTitle}</h1>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
            <div className="flex bg-gray-100 p-1 rounded-full overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400 hover:text-prylom-dark'}`}
                  >
                    {cat.label}
                  </button>
                ))}
            </div>

            <div className="flex bg-gray-100 p-1 rounded-full">
                <button onClick={() => setViewMode('grid')} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${viewMode === 'grid' ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400 hover:text-prylom-dark'}`}>{t.viewGrid}</button>
                <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${viewMode === 'map' ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400 hover:text-prylom-dark'}`}>{t.viewMap}</button>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`bg-white border-2 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${showFilters ? 'border-prylom-gold text-prylom-gold' : 'border-gray-100 text-prylom-dark'}`}>
              {showFilters ? t.hideFilters : t.advancedFilters}
            </button>
            <button onClick={onBack} className="bg-white text-prylom-dark border-2 border-gray-100 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-prylom-gold transition-all">{t.btnBack}</button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-2xl animate-fadeIn space-y-10 max-h-[75vh] overflow-y-auto no-scrollbar scroll-smooth">
          {/* SEÇÃO 1: FILTROS UNIVERSAIS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.locationLabel}</label>
              <div className="grid grid-cols-2 gap-3">
                <select value={filterState} onChange={e => {setFilterState(e.target.value); setFilterCity('');}} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none appearance-none border border-transparent focus:border-prylom-gold transition-all">
                  <option value="">{t.stateAll}</option>
                  {availableStates.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none appearance-none border border-transparent focus:border-prylom-gold transition-all">
                  <option value="">{t.cityAll}</option>
                  {availableCities.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1 mb-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider leading-tight">{t.priceRange}</label>
                <div className="flex bg-gray-100 p-0.5 rounded-lg text-[8px] font-black uppercase">
                  <button onClick={() => setPriceMode('total')} className={`px-2 py-1 rounded-md ${priceMode === 'total' ? 'bg-white shadow-sm text-prylom-dark' : 'text-gray-400'}`}>{t.priceTotal}</button>
                  <button onClick={() => setPriceMode('hectare')} className={`px-2 py-1 rounded-md ${priceMode === 'hectare' ? 'bg-white shadow-sm text-prylom-dark' : 'text-gray-400'}`}>{t.priceHectare}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder={t.areaMin} value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none border border-transparent focus:border-prylom-gold transition-all" />
                <input type="number" placeholder={t.areaMax} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none border border-transparent focus:border-prylom-gold transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.statusLabel}</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none appearance-none border border-transparent focus:border-prylom-gold transition-all">
                <option value="all">{t.statusAll}</option>
                <option value="ativo">{t.statusAvailable}</option>
                <option value="negociacao">{t.statusNegotiating}</option>
                <option value="verified">{t.verifiedLabel}</option>
              </select>
            </div>
          </div>

          {/* SEÇÃO MAPA */}
          {viewMode === 'map' && (
            <div className="pt-8 border-t border-gray-100 animate-fadeIn space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[11px] font-black text-prylom-gold uppercase tracking-widest whitespace-nowrap">🗺️ {t.mapAnalytics}</h3>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                   <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.mapGrouping}</label>
                   <div className="flex bg-gray-50 p-1 rounded-2xl">
                      <button onClick={() => setMapGrouping('municipio')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${mapGrouping === 'municipio' ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400'}`}>{t.municipio}</button>
                      <button onClick={() => setMapGrouping('microrregiao')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${mapGrouping === 'microrregiao' ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400'}`}>{t.microrregiao}</button>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.mapHeatmap}</label>
                   <select value={mapHeatmap} onChange={e => setMapHeatmap(e.target.value as any)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none appearance-none border border-transparent focus:border-prylom-gold transition-all">
                      <option value="none">{t.mapHeatNone}</option>
                      <option value="price">{t.mapHeatPrice}</option>
                      <option value="productivity">{t.mapHeatProd}</option>
                   </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                   <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">Monitoramento Rápido</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setMapOnlyFarms(!mapOnlyFarms)} className={`py-4 px-5 rounded-xl text-[9px] font-black uppercase transition-all border ${mapOnlyFarms ? 'bg-prylom-dark text-white border-prylom-dark' : 'bg-white text-gray-400 border-gray-200 hover:border-prylom-gold'}`}>{t.onlyFarms}</button>
                      <button onClick={() => setMapOnlyLeases(!mapOnlyLeases)} className={`py-4 px-5 rounded-xl text-[9px] font-black uppercase transition-all border ${mapOnlyLeases ? 'bg-prylom-dark text-white border-prylom-dark' : 'bg-white text-gray-400 border-gray-200 hover:border-prylom-gold'}`}>{t.onlyLeases}</button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 2: FILTROS TÉCNICOS (FAZENDAS) */}
          {activeCategory === 'fazendas' && (
            <div className="pt-8 border-t border-gray-100 animate-fadeIn space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[11px] font-black text-prylom-dark uppercase tracking-widest whitespace-nowrap">🌱 {t.techFiltersFarm}</h3>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">📐 {t.leaseArea}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder={t.areaMin} value={minAreaTotal} onChange={e => setMinAreaTotal(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none border border-transparent focus:border-prylom-gold transition-all" />
                    <input type="number" placeholder={t.areaMax} value={maxAreaTotal} onChange={e => setMaxAreaTotal(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none border border-transparent focus:border-prylom-gold transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.transactionType}</label>
                  <select value={transactionType} onChange={e => setTransactionType(e.target.value as any)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none appearance-none border border-transparent focus:border-prylom-gold transition-all">
                    <option value="all">{t.transactionAll}</option>
                    <option value="venda">{t.transactionSale}</option>
                    <option value="arrendamento">{t.transactionLease}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.soilAptitude}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={t.soilType} value={soilType} onChange={e => setSoilType(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                    <input type="text" placeholder={t.clayContent} value={clayContent} onChange={e => setClayContent(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.legalRisk}</label>
                  <button onClick={() => setDocOnlyOk(!docOnlyOk)} className={`w-full py-4 px-5 rounded-2xl text-[11px] font-black uppercase transition-all border ${docOnlyOk ? 'bg-prylom-dark text-white border-prylom-dark' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-prylom-gold'}`}>
                    {docOnlyOk ? t.docOk : t.docAny}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: FILTROS TÉCNICOS (MÁQUINAS) */}
          {activeCategory === 'maquinas' && (
            <div className="pt-8 border-t border-gray-100 animate-fadeIn space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[11px] font-black text-prylom-dark uppercase tracking-widest whitespace-nowrap">🚜 {t.techFiltersMachine}</h3>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.brand} & {t.model}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={t.brand} value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                    <input type="text" placeholder={t.model} value={machineModelFilter} onChange={e => setMachineModelFilter(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.yearMin} & {t.hoursMax}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder={t.yearMin} value={minYear} onChange={e => setMinYear(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                    <input type="number" placeholder={t.hoursMax} value={maxHours} onChange={e => setMaxHours(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.powerMin}</label>
                  <input type="number" placeholder={t.powerMin} value={minPower} onChange={e => setMinPower(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.machineState}</label>
                  <select value={conservationState} onChange={e => setConservationState(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark appearance-none border border-transparent focus:border-prylom-gold transition-all">
                    <option value="">{t.machineState}</option>
                    <option value="Novo">Novo</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Bom">Bom</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 6: FILTROS DE ARRENDAMENTO */}
          {(transactionType === 'arrendamento' || mapOnlyLeases) && (
            <div className="pt-8 border-t border-gray-100 animate-fadeIn space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[11px] font-black text-prylom-gold uppercase tracking-widest whitespace-nowrap">📑 {t.leaseFilters}</h3>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.leaseMod}</label>
                  <select value={arrModalidade} onChange={e => setArrModalidade(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark outline-none appearance-none border border-transparent focus:border-prylom-gold transition-all">
                    <option value="">{t.leaseMod}</option>
                    <option value="agricola">{t.planeAgri}</option>
                    <option value="pecuaria">{t.wizardStep2Pecuaria}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.grainHarvest} & {t.leaseCulture}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={t.grainHarvest} value={arrSafraInicio} onChange={e => setArrSafraInicio(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                    <input type="text" placeholder={t.leaseCulture} value={arrCulturaBase} onChange={e => setArrCulturaBase(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">{t.leaseSafras}</label>
                  <input type="number" placeholder={t.leaseSafras} value={arrQtdSafras} onChange={e => setArrQtdSafras(e.target.value)} className="w-full py-4 px-5 bg-gray-50 rounded-2xl text-[11px] font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.assetsGeoreferenced}: <span className="text-prylom-dark">{filteredProducts.length}</span></p>
             <button onClick={() => {
               setFilterState(''); setFilterCity(''); setMinPrice(''); setMaxPrice(''); setFilterStatus('all'); setTransactionType('all');
               setMinAreaTotal(''); setMaxAreaTotal(''); setBrandFilter(''); setGrainCulture(''); setPlaneTypeFilter('');
               setArrModalidade(''); setArrSafraInicio(''); setArrQtdSafras('');
               setMapOnlyFarms(false); setMapOnlyLeases(false); setMapGrouping('municipio'); setMapHeatmap('none');
             }} className="text-[9px] font-black text-prylom-gold uppercase tracking-widest hover:underline">{t.resetMapFilters}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center"><div className="w-12 h-12 border-4 border-prylom-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">{t.marketSync}</p></div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">{t.marketEmpty}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map(p => {
                const price = formatPriceParts(p.valor);
                return (
                  <div key={p.id} onClick={() => onSelectProduct(p.id)} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col group">
                    <div className="h-64 relative overflow-hidden bg-gray-50">
                      <img src={p.main_image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute top-6 left-6 flex gap-2">
                        <span className="bg-prylom-dark/80 backdrop-blur-md text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                          {p.tipo_transacao === 'venda' ? t.transactionSale : t.transactionLease}
                        </span>
                        {p.certificacao && <span className="bg-prylom-gold text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{t.verifiedLabel}</span>}
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-prylom-dark mb-1 tracking-tight line-clamp-1 group-hover:text-prylom-gold uppercase">{p.titulo}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-6">{p.cidade} - {p.estado}</p>
                      <div className="mt-auto p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-[9px] font-black text-prylom-gold uppercase tracking-widest mb-1">{p.tipo_transacao === 'arrendamento' ? t.transactionLease : t.transactionSale}</p>
                        {p.tipo_transacao === 'arrendamento' && p.arrendamento_info ? (
                          <p className="text-xl font-black text-prylom-dark">{p.arrendamento_info.quantidade} <span className="text-xs">{p.arrendamento_info.unidade?.replace('_', '/')}</span></p>
                        ) : (
                          <div className="flex items-baseline justify-between">
                            <p className="text-3xl font-black text-prylom-dark">{price.symbol} {price.value}</p>
                            {p.area_total_ha && (
                              <p className="text-[9px] font-black text-gray-400 uppercase">
                                {getSymbol()} {formatPriceParts(p.valor! / p.area_total_ha).value} <span className="opacity-60">{t.priceHectare}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[75vh] bg-white rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white relative" style={{ minHeight: '75vh' }}>
               <div ref={mapContainerRef} className="w-full h-full"></div>
               
               <div className="absolute bottom-10 right-10 z-[500] bg-prylom-dark/95 backdrop-blur-xl px-10 py-6 rounded-[2.5rem] shadow-3xl border border-prylom-gold/20 flex flex-col items-end animate-fadeIn">
                  <div className="flex items-center gap-3 mb-1">
                     <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.4em]">{t.mapScanAlpha}</span>
                     <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{animationDelay:'0.2s'}}></div>
                     </div>
                  </div>
                  <p className="text-white text-3xl font-black tracking-tighter leading-none">{filteredProducts.length}</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{t.assetsGeoreferenced}</p>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShoppingCenter;