import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppLanguage, AppCurrency } from '../types';
import { supabase } from '../supabaseClient';

interface Product {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  valor: number | null;
  unidade: string;
  quantidade: number;
  estado: string;
  cidade: string;
  status: string;
  destaque: boolean;
  certificacao: boolean;
  created_at: string;
  main_image?: string;
  tipo_transacao: 'venda' | 'arrendamento';
  arrendamentos?: any[];
}

interface Props {
  onLogout: () => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const AdminDashboard: React.FC<Props> = ({ onLogout, t, lang, currency }) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [assets, setAssets] = useState<Product[]>([]);
  const [dadosEspecificos, setDadosEspecificos] = useState<any>({});
  
  const camposPorCategoria: Record<string, { key: string; label: string; type: string; required?: boolean }[]> = useMemo(() => ({
    fazendas: [
      { key: 'area_total_ha', label: t.areaTotal || 'Area Total', type: 'number', required: true },
      { key: 'area_lavoura_ha', label: 'Crops Area (ha)', type: 'number' },
      { key: 'tipo_solo', label: t.soilType, type: 'text' },
      { key: 'teor_argila', label: t.clayContent, type: 'text' },
      { key: 'topografia', label: t.topographyLabel, type: 'text' },
      { key: 'altitude_m', label: t.mapAltitude, type: 'number' },
    ],
    maquinas: [
      { key: 'marca', label: t.brand, type: 'text', required: true },
      { key: 'modelo', label: t.model, type: 'text', required: true },
      { key: 'ano', label: t.grainHarvest, type: 'number', required: true },
      { key: 'horas_trabalhadas', label: t.hoursMax, type: 'number', required: true },
    ],
    avioes: [
      { key: 'fabricante', label: t.manufacturer, type: 'text', required: true },
      { key: 'modelo', label: t.model, type: 'text', required: true },
      { key: 'ano', label: t.grainHarvest, type: 'number', required: true },
    ],
    graos: [
      { key: 'cultura', label: 'Culture', type: 'text', required: true },
      { key: 'safra', label: t.grainHarvest, type: 'text', required: true },
      { key: 'qualidade', label: t.grainQuality, type: 'text', required: true },
    ]
  }), [t]);

  const [newAsset, setNewAsset] = useState({
    codigo: '', titulo: '', descricao: '', categoria: 'fazendas', subcategoria: '',
    tipo_transacao: 'venda' as 'venda' | 'arrendamento', valor: '', unidade: 'unidade', quantidade: 1,
    estado: '', cidade: '', certificacao: false, destaque: false, status: 'ativo'
  });

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

  const formatPrice = (valInBrl: number | null) => {
    if (valInBrl === null) return '---';
    const converted = valInBrl * rates[currency];
    return `${getSymbol()} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`*, arrendamentos (*), produtos_imagens (image_url, ordem)`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) {
        setAssets(data.map((item: any) => ({
          ...item,
          main_image: item.produtos_imagens?.find((img: any) => img.ordem === 1)?.image_url || item.produtos_imagens?.[0]?.image_url
        })));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleEdit = async (asset: Product) => {
    setLoading(true);
    setIsEditing(true);
    setCurrentId(asset.id);
    setNewAsset({
      codigo: asset.codigo,
      titulo: asset.titulo,
      descricao: asset.descricao,
      categoria: asset.categoria,
      subcategoria: asset.subcategoria || '',
      tipo_transacao: asset.tipo_transacao,
      valor: asset.valor?.toString() || '',
      unidade: asset.unidade,
      quantidade: asset.quantidade,
      estado: asset.estado,
      cidade: asset.cidade,
      certificacao: asset.certificacao,
      destaque: asset.destaque,
      status: asset.status
    });

    try {
      const { data: specData } = await supabase.from(asset.categoria).select('*').eq('produto_id', asset.id).maybeSingle();
      if (specData) {
        const { produto_id, ...onlyFields } = specData;
        setDadosEspecificos(onlyFields);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); setShowModal(true); }
  };

  const handleDelete = (asset: Product) => {
    setDeleteTarget(asset);
  };

  const handleDeleteConfirmed = async (asset: Product) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('delete_produto_completo', { p_id: asset.id });
      if (error) throw error;
      
      setDeleteTarget(null);
      await fetchAssets();
    } catch (err: any) {
      alert("Erro ao excluir produto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const produtoPayload = {
        codigo: newAsset.codigo,
        titulo: newAsset.titulo,
        descricao: newAsset.descricao,
        categoria: newAsset.categoria,
        subcategoria: newAsset.subcategoria,
        tipo_transacao: newAsset.tipo_transacao,
        valor: newAsset.tipo_transacao === 'venda' ? (newAsset.valor ? Number(newAsset.valor) : null) : null,
        unidade: newAsset.unidade,
        quantidade: newAsset.quantidade,
        estado: newAsset.estado,
        cidade: newAsset.cidade,
        status: newAsset.status,
        destaque: newAsset.destaque,
        certificacao: newAsset.certificacao
      };

      let produtoId = currentId;
      
      if (isEditing && currentId) {
        await supabase.from('produtos').update(produtoPayload).eq('id', currentId);
      } else {
        const { data: produto } = await supabase.from('produtos').insert(produtoPayload).select('id').single();
        if (produto) produtoId = produto.id;
      }

      alert(t.adminSuccess);
      fetchAssets();
      setShowModal(false);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-[#FDFCFB]">
      <aside className="w-full md:w-80 bg-prylom-dark p-10 flex flex-col text-white shadow-2xl z-50">
        <div className="mb-16">
          <div className="text-prylom-gold font-black text-3xl mb-2 tracking-tighter">Prylom<span className="text-white">.</span></div>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">{t.terminalExecution}</p>
        </div>
        <nav className="flex flex-col gap-3">
          <button className="flex items-center gap-4 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest bg-prylom-gold text-white shadow-2xl">
            {t.footerTerminal}
          </button>
          <button onClick={onLogout} className="flex items-center gap-4 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-all">
            {t.btnBack}
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8 md:p-14 overflow-y-auto no-scrollbar">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
            <div>
               <h2 className="text-5xl font-black text-[#000080] tracking-tighter uppercase mb-2">{t.adminTerminal}</h2>
               <p className="text-gray-400 text-sm font-medium tracking-wide">{t.terminalExecution}</p>
            </div>
            <button onClick={() => { setIsEditing(false); setShowModal(true); }} className="bg-[#000080] text-white px-10 py-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-3xl hover:bg-prylom-gold transition-all">
               {t.btnAnnounce}
            </button>
         </header>

         <div className="bg-white rounded-[4rem] p-10 shadow-2xl border border-gray-50">
            <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left">
                  <thead><tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]"><th className="pb-6">Asset</th><th className="pb-6">Type</th><th className="pb-6">Price</th><th className="pb-6">Status</th><th className="pb-6 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                     {assets.map(asset => (
                        <tr key={asset.id} className="group hover:bg-[#FDFCFB] transition-colors">
                           <td className="py-8"><div className="flex items-center gap-6"><div className="w-16 h-16 rounded-[1.2rem] overflow-hidden shadow-md bg-gray-100">{asset.main_image && <img src={asset.main_image} alt="" className="w-full h-full object-cover" />}</div><div><p className="font-black text-lg text-[#000080] leading-none mb-1">{asset.titulo}</p></div></div></td>
                           <td className="py-8"><span className="text-[10px] font-black text-gray-500 uppercase px-4 py-1.5 rounded-full bg-gray-100">{asset.tipo_transacao}</span></td>
                           <td className="py-8 font-black text-[#000080]">{formatPrice(asset.valor)}</td>
                           <td className="py-8"><span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full ${asset.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{asset.status}</span></td>
                           <td className="py-8 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleEdit(asset)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-[#000080] hover:bg-[#000080] hover:text-white transition-all shadow-sm">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                               </button>
                               <button onClick={() => handleDelete(asset)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                             </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl bg-prylom-dark/50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-3xl text-center animate-fadeIn">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-[#000080] uppercase tracking-tighter mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed">
              Você tem certeza que deseja excluir o ativo <span className="text-prylom-dark font-bold">"{deleteTarget.titulo}"</span>? Esta ação é irreversível e removerá todos os dados técnicos e imagens associados.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleDeleteConfirmed(deleteTarget)}
                disabled={loading}
                className="w-full bg-red-500 text-white font-black py-5 rounded-full text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? t.adminProcessing : 'Confirmar e Excluir'}
              </button>
              <button 
                onClick={() => setDeleteTarget(null)}
                className="w-full bg-gray-100 text-gray-500 font-black py-5 rounded-full text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 backdrop-blur-xl bg-[#1a3e4c]/50">
          <div className="bg-white w-full max-w-5xl rounded-[4rem] p-12 md:p-16 shadow-3xl relative overflow-y-auto max-h-[90vh] no-scrollbar">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-prylom-dark p-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
            <form onSubmit={handlePublish} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">Code</label>
                  <input required value={newAsset.codigo} onChange={e => setNewAsset({...newAsset, codigo: e.target.value})} className="w-full py-5 px-7 bg-gray-50 rounded-[2rem] outline-none font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider px-1 leading-tight">Title</label>
                  <input required value={newAsset.titulo} onChange={e => setNewAsset({...newAsset, titulo: e.target.value})} className="w-full py-5 px-7 bg-gray-50 rounded-[2rem] outline-none font-bold text-prylom-dark border border-transparent focus:border-prylom-gold transition-all" />
                </div>
              </div>
              <div className="pt-10 flex gap-6">
                 <button type="submit" disabled={loading} className="flex-1 bg-prylom-dark text-white font-black py-8 rounded-full text-sm uppercase tracking-widest hover:bg-prylom-gold shadow-3xl">{loading ? t.adminProcessing : t.confirmProceed}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;