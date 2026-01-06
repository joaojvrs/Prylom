
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppLanguage, AppCurrency } from '../types';
import { supabase } from '../supabaseClient';

interface Product {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  valor: number;
  unidade: string;
  quantidade: number;
  estado: string;
  cidade: string;
  safra: string;
  qualidade: string;
  certificacao: boolean;
  status: string;
  destaque: boolean;
  created_at: string;
  main_image?: string;
}

interface Props {
  onLogout: () => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const camposPorCategoria: Record<string, { key: string; label: string; type: string }[]> = {
  fazendas: [
    { key: 'area_total_ha', label: 'Área Total (ha)', type: 'number' },
    { key: 'area_lavoura_ha', label: 'Área Lavoura (ha)', type: 'number' },
    { key: 'area_pastagem_ha', label: 'Área Pastagem (ha)', type: 'number' },
    { key: 'tipo_solo', label: 'Tipo de Solo', type: 'text' },
    { key: 'teor_argila', label: 'Teor de Argila (%)', type: 'text' },
    { key: 'topografia', label: 'Topografia', type: 'text' },
    { key: 'altitude_m', label: 'Altitude (m)', type: 'number' },
    { key: 'precipitacao_mm', label: 'Precipitação (mm)', type: 'number' },
    { key: 'benfeitorias', label: 'Benfeitorias', type: 'text' },
    { key: 'documentacao_ok', label: 'Documentação OK?', type: 'text' },
    { key: 'observacoes', label: 'Observações Técnicas', type: 'text' },
  ],
  maquinas: [
    { key: 'marca', label: 'Marca', type: 'text' },
    { key: 'modelo', label: 'Modelo', type: 'text' },
    { key: 'ano', label: 'Ano', type: 'number' },
    { key: 'horas_trabalhadas', label: 'Horas Trabalhadas', type: 'number' },
    { key: 'combustivel', label: 'Combustível', type: 'text' },
    { key: 'estado_conservacao', label: 'Estado de Conservação', type: 'text' },
  ],
  avioes: [
    { key: 'fabricante', label: 'Fabricante', type: 'text' },
    { key: 'modelo', label: 'Modelo', type: 'text' },
    { key: 'ano', label: 'Ano', type: 'number' },
    { key: 'horas_voo', label: 'Horas de Voo', type: 'number' },
    { key: 'homologado_anac', label: 'Homologado ANAC?', type: 'text' },
    { key: 'tipo_operacao', label: 'Tipo de Operação', type: 'text' },
  ],
  graos: [
    { key: 'cultura', label: 'Cultura', type: 'text' },
    { key: 'safra', label: 'Safra', type: 'text' },
    { key: 'qualidade', label: 'Qualidade/Padrão', type: 'text' },
    { key: 'estoque_toneladas', label: 'Estoque (Toneladas)', type: 'number' },
  ]
};

const AdminDashboard: React.FC<Props> = ({ onLogout, t, lang, currency }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'assets'>('assets');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [assets, setAssets] = useState<Product[]>([]);
  const [dadosEspecificos, setDadosEspecificos] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

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

  const formatPrice = (valInBrl: number) => {
    const converted = valInBrl * rates[currency];
    return `${getSymbol()} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const [newAsset, setNewAsset] = useState({
    titulo: '',
    descricao: '',
    categoria: 'fazendas',
    subcategoria: '',
    valor: '',
    unidade: 'unidade',
    quantidade: 1,
    estado: '',
    cidade: '',
    safra: '',
    qualidade: '',
    certificacao: false,
    destaque: false,
    status: 'ativo'
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`*, produtos_imagens (image_url, ordem)`)
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

  const stats = useMemo(() => {
    const totalValue = assets.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    return { total: assets.length, value: totalValue, featured: assets.filter(a => a.destaque).length };
  }, [assets]);

  const handleEdit = async (asset: Product) => {
    setLoading(true);
    setIsEditing(true);
    setCurrentId(asset.id);
    setNewAsset({
      titulo: asset.titulo, descricao: asset.descricao, categoria: asset.categoria,
      subcategoria: asset.subcategoria || '', valor: asset.valor.toString(),
      unidade: asset.unidade, quantidade: asset.quantidade, estado: asset.estado, cidade: asset.cidade,
      safra: asset.safra || '', qualidade: asset.qualidade || '', certificacao: asset.certificacao,
      destaque: asset.destaque, status: asset.status
    });

    try {
      const { data: specificData } = await supabase.from(asset.categoria).select('*').eq('produto_id', asset.id).maybeSingle();
      if (specificData) {
        const { produto_id, ...onlyFields } = specificData;
        setDadosEspecificos(onlyFields);
      } else { setDadosEspecificos({}); }
    } catch (e) { console.error(e); } finally { setLoading(false); setShowModal(true); }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        titulo: newAsset.titulo, descricao: newAsset.descricao, categoria: newAsset.categoria,
        subcategoria: newAsset.subcategoria, valor: parseFloat(newAsset.valor),
        unidade: newAsset.unidade, quantidade: newAsset.quantidade, estado: newAsset.estado,
        cidade: newAsset.cidade, status: newAsset.status, destaque: newAsset.destaque, certificacao: newAsset.certificacao
      };

      let produtoId = currentId;
      if (isEditing && currentId) {
        await supabase.from('produtos').update(payload).eq('id', currentId);
        await supabase.from(newAsset.categoria).upsert({ produto_id: produtoId, ...dadosEspecificos });
      } else {
        const { data: productData, error: productError } = await supabase.from('produtos').insert([payload]).select('id').single();
        if (productError) throw productError;
        produtoId = productData.id;
        await supabase.from(newAsset.categoria).insert({ produto_id: produtoId, ...dadosEspecificos });

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const path = `${produtoId}/img-${Date.now()}-${i}.${file.name.split('.').pop()}`;
          await supabase.storage.from('produtos').upload(path, file);
          const { data: url } = supabase.storage.from('produtos').getPublicUrl(path);
          await supabase.from('produtos_imagens').insert([{ produto_id: produtoId, image_url: url.publicUrl, ordem: i + 1 }]);
        }
      }

      // Chamada do Webhook solicitada
      try {
        await fetch("https://webhook.saveautomatik.shop/webhook/audioPrylom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: produtoId,
            ...payload,
            dados_especificos: dadosEspecificos
          })
        });
      } catch (webhookErr) {
        console.error("Erro ao chamar o webhook:", webhookErr);
      }

      alert(isEditing ? "Atualizado!" : "Publicado!");
      await fetchAssets();
      setShowModal(false);
      resetForm();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setNewAsset({
      titulo: '', descricao: '', categoria: 'fazendas', subcategoria: '', valor: '',
      unidade: 'unidade', quantidade: 1, estado: '', cidade: '', safra: '', qualidade: '',
      certificacao: false, destaque: false, status: 'ativo'
    });
    setDadosEspecificos({}); setSelectedFiles([]); setIsEditing(false); setCurrentId(null);
  };

  const handleDelete = (asset: Product) => {
    console.log('ID que estou tentando deletar:', asset.id);
    setDeleteTarget(asset);
  };

  const handleDeleteConfirmed = async (asset: Product) => {
    setLoading(true);
    const { data, error } = await supabase.rpc(
      'delete_produto_completo',
      { p_id: asset.id }
    );

    console.log('RPC data:', data);
    console.log('RPC error:', error);

    if (error) {
      console.error('Erro RPC:', error);
      alert('Erro ao excluir ativo: ' + error.message);
    } else {
      console.log('Produto deletado com sucesso');
      setAssets(prev => prev.filter(p => p.id !== asset.id));
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-[#FDFCFB]">
      <aside className="w-full md:w-80 bg-[#1a3e4c] p-10 flex flex-col text-white shadow-2xl z-50">
        <div className="mb-16">
          <div className="text-prylom-gold font-black text-3xl mb-2 tracking-tighter">Prylom<span className="text-white">.</span></div>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">Gestão de Ativos Corporativos</p>
        </div>
        <nav className="flex flex-col gap-3">
          <button onClick={() => setActiveTab('assets')} className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'assets' ? 'bg-[#d4a017] text-white shadow-2xl' : 'hover:bg-white/5 text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Inventário
          </button>
        </nav>
        <div className="mt-auto pt-10 border-t border-white/5 space-y-4">
           <button onClick={onLogout} className="w-full flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-all">Encerrar Sessão</button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-14 overflow-y-auto no-scrollbar">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
            <div>
               <h2 className="text-5xl font-black text-[#000080] tracking-tighter uppercase mb-2">Painel de Controle</h2>
               <p className="text-gray-400 text-sm font-medium tracking-wide">Gerenciamento global de ativos imobiliários e máquinas.</p>
            </div>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-[#000080] text-white px-10 py-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-3xl hover:bg-prylom-gold transition-all flex items-center gap-4 active:scale-95">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
               Cadastrar Novo Ativo
            </button>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Total de Ativos</p><p className="text-5xl font-black text-[#000080]">{stats.total}</p></div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Valor sob Gestão</p><p className="text-4xl font-black text-prylom-gold truncate">{formatPrice(stats.value)}</p></div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Itens em Destaque</p><p className="text-5xl font-black text-blue-500">{stats.featured}</p></div>
         </div>

         <div className="bg-white rounded-[4rem] p-10 md:p-14 shadow-2xl border border-gray-50">
            <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left">
                  <thead><tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]"><th className="pb-6">Ativo</th><th className="pb-6">Categoria</th><th className="pb-6">Valor</th><th className="pb-6">Status</th><th className="pb-6 text-right">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                     {assets.map(asset => (
                        <tr key={asset.id} className="group hover:bg-[#FDFCFB] transition-colors">
                           <td className="py-8"><div className="flex items-center gap-6"><div className="w-16 h-16 rounded-[1.2rem] overflow-hidden shadow-md border-2 border-white">{asset.main_image ? <img src={asset.main_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center">🖼️</div>}</div><div><p className="font-black text-lg text-[#000080] leading-none mb-2">{asset.titulo}</p><p className="text-[10px] text-prylom-gold font-black uppercase tracking-widest">{asset.cidade} - {asset.estado}</p></div></div></td>
                           <td className="py-8"><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-4 py-1.5 rounded-full">{asset.categoria}</span></td>
                           <td className="py-8"><p className="text-lg font-black text-[#000080]">{formatPrice(asset.valor)}</p></td>
                           <td className="py-8"><span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm ${asset.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{asset.status}</span></td>
                           <td className="py-8 text-right"><div className="flex justify-end gap-3">
                                <button onClick={() => handleEdit(asset)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-[#000080] hover:bg-[#000080] hover:text-white transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                <button onClick={() => handleDelete(asset)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-md bg-prylom-dark/40">
          <div className="bg-white p-12 rounded-[3rem] shadow-3xl max-w-md w-full text-center border border-gray-100 animate-fadeIn">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">⚠️</div>
            <h3 className="text-2xl font-black text-[#000080] tracking-tighter uppercase mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-500 text-sm font-medium mb-10">Deseja realmente excluir o ativo <span className="text-[#000080] font-black">"{deleteTarget.titulo}"</span>? Esta ação não pode ser desfeita.</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => { handleDeleteConfirmed(deleteTarget); setDeleteTarget(null); }}
                className="w-full bg-red-500 text-white font-black py-5 rounded-full text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95"
              >
                Confirmar Exclusão
              </button>
              <button 
                onClick={() => setDeleteTarget(null)}
                className="w-full bg-gray-100 text-gray-500 font-black py-5 rounded-full text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
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
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-gray-300 hover:text-[#000080] p-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
            <form onSubmit={handlePublish} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Título</label><input required value={newAsset.titulo} onChange={e => setNewAsset({...newAsset, titulo: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2rem] outline-none font-bold text-[#000080]" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoria</label><select disabled={isEditing} value={newAsset.categoria} onChange={e => setNewAsset({...newAsset, categoria: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2rem] outline-none font-bold text-[#000080] appearance-none cursor-pointer"><option value="fazendas">Fazendas</option><option value="maquinas">Máquinas</option><option value="avioes">Aviões</option><option value="graos">Grãos</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valor</label><input required type="number" step="any" value={newAsset.valor} onChange={e => setNewAsset({...newAsset, valor: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[2rem] outline-none font-black text-[#000080]" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Local</label><div className="flex gap-4"><input required placeholder="Cidade" value={newAsset.cidade} onChange={e => setNewAsset({...newAsset, cidade: e.target.value})} className="flex-1 p-6 bg-gray-50 rounded-[2rem] outline-none" /><input required placeholder="UF" maxLength={2} value={newAsset.estado} onChange={e => setNewAsset({...newAsset, estado: e.target.value.toUpperCase()})} className="w-24 p-6 bg-gray-50 rounded-[2rem] outline-none text-center" /></div></div>
              </div>
              <div className="pt-8 border-t border-gray-100">
                <h4 className="text-xl font-black text-[#000080] uppercase tracking-widest mb-8">Técnico: {newAsset.categoria}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{camposPorCategoria[newAsset.categoria]?.map(campo => (
                      <div key={campo.key} className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">{campo.label}</label><input required type={campo.type} value={dadosEspecificos[campo.key] || ''} onChange={e => setDadosEspecificos({...dadosEspecificos, [campo.key]: e.target.value})} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold text-[#000080]" /></div>
                   ))}</div>
              </div>
              <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Descrição</label><textarea required rows={4} value={newAsset.descricao} onChange={e => setNewAsset({...newAsset, descricao: e.target.value})} className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none resize-none" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fotos</label><div onClick={() => fileInputRef.current?.click()} className="w-full p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center cursor-pointer hover:border-prylom-gold transition-all"><p className="text-[10px] font-black uppercase text-gray-400">{selectedFiles.length > 0 ? `${selectedFiles.length} selecionadas` : 'Clique para carregar'}</p></div><input multiple ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={e => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])} /></div>
                 <div className="flex flex-col justify-center gap-6 p-10 bg-gray-50 rounded-[2.5rem]">
                    <label className="flex items-center gap-4 cursor-pointer"><input type="checkbox" checked={newAsset.destaque} onChange={e => setNewAsset({...newAsset, destaque: e.target.checked})} className="w-6 h-6 accent-[#d4a017]" /><span className="text-[11px] font-black text-[#1a3e4c] uppercase tracking-widest">Destaque na Home</span></label>
                    <label className="flex items-center gap-4 cursor-pointer"><input type="checkbox" checked={newAsset.certificacao} onChange={e => setNewAsset({...newAsset, certificacao: e.target.checked})} className="w-6 h-6 accent-[#d4a017]" /><span className="text-[11px] font-black text-[#1a3e4c] uppercase tracking-widest">Auditado Prylom</span></label>
                 </div>
              </div>
              <div className="pt-10 flex gap-6">
                 <button type="submit" disabled={loading} className="flex-1 bg-[#000080] text-white font-black py-8 rounded-full text-sm uppercase tracking-[0.3em] hover:bg-prylom-gold shadow-3xl disabled:opacity-50">{loading ? 'Salvando...' : 'Publicar Ativo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
