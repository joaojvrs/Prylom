import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppLanguage, AppCurrency } from '../types';

interface Props {
  onBack: () => void;
  t: any;
  lang: AppLanguage;
  currency: AppCurrency;
}

const LegalAgro: React.FC<Props> = ({ onBack, t, lang, currency }) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'modules' | 'ai' | 'risk'>('radar');
  const [aiMessage, setAiMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Estados para o Modal de Tópicos
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicContent, setTopicContent] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleTopicClick = async (topic: string) => {
    setSelectedTopic(topic);
    setTopicContent(null);

    // CONTEÚDO PRÉ-DEFINIDO (CURADORIA PRYLOM)
    const predefined: Record<string, string> = {
      "O que é crime ambiental?": `Crime ambiental ocorre quando há dano ou risco grave ao meio ambiente, praticado com dolo ou culpa, e previsto na Lei de Crimes Ambientais (Lei nº 9.605/1998).

⚠️ Importante:
• Nem toda infração ambiental é crime
• Algumas geram apenas multa administrativa
• Outras podem virar processo criminal

🧱 Diferença prática (muito importante)
Infração administrativa
• Multa
• Advertência
• Embargo da área
• Apreensão de bens

Crime ambiental
• Processo criminal
• Pode gerar:
  - Multa penal
  - Prestação de serviços
  - Restrição de direitos
  - Em casos graves, prisão

🚨 Exemplos comuns no agro
Situação | Multa | Crime
Desmatar APP sem autorização | ✅ | ✅
Plantar em Reserva Legal | ✅ | ❌*
Queimada sem licença | ✅ | ✅
Uso irregular de defensivos | ✅ | ✅
Falta de CAR | ❌ | ❌

* Pode virar crime se houver dolo, reincidência ou dano grave.

✅ Como evitar problema
• Nunca desmatar sem autorização
• Respeitar APP e Reserva Legal
• Manter cadastros ambientais regulares
• Guardar documentos e licenças.`,

      "Checklist APP e Reserva": `→ 📌 O que é APP (Área de Preservação Permanente)
São áreas protegidas por lei, independentemente de registro.

Exemplos:
• Margens de rios
• Nascentes
• Encostas íngremes
• Topo de morro

⚠️ Não pode explorar, salvo exceções legais com autorização.`,

      "Queimadas e Uso do Fogo": `Porcentagem da propriedade que deve ser preservada.

Percentuais gerais:
• 80% Amazônia Legal (floresta)
• 35% Cerrado na Amazônia Legal
• 20% Demais regiões`,

      "ITR e Valor de Terra Nua": `🔍 O que é o ITR
O Imposto sobre a Propriedade Territorial Rural (ITR) é um imposto federal, cobrado anualmente, pago pelo proprietário, titular do domínio útil ou possuidor do imóvel rural.

👉 Ele não incide sobre produção, apenas sobre a propriedade da terra.

📌 O que é Valor da Terra Nua (VTN)
O VTN é o valor da terra sem benfeitorias, ou seja:
• Sem casas
• Sem galpões
• Sem cercas
• Sem lavouras
• Sem pastagens formadas

É sobre esse valor que o ITR é calculado.

⚠️ Onde está o maior risco
O maior erro no ITR é:
❌ Declarar um VTN muito abaixo do valor de mercado

Isso pode gerar:
• Malha fina
• Multa
• Juros
• Auto de infração

⚠️ A Receita Federal cruza dados com:
• Municípios
• Incra
• Valores regionais médios
• Histórico da propriedade

🧱 Outro ponto crítico: Grau de Utilização (GU)
Quanto maior o aproveitamento produtivo da área, menor o ITR.

Erros comuns:
• Declarar uso produtivo maior do que o real
• Incluir APP e Reserva Legal como área produtiva
Isso gera autuação direta.

✅ Como evitar problema no ITR
✔ Declarar VTN compatível com a região
✔ Excluir APP e Reserva Legal da área tributável
✔ Declarar corretamente o uso da terra
✔ Manter documentação de suporte.`,

      "Funrural e Contribuições": `🔍 O que é o Funrural
O Funrural é uma contribuição previdenciária ligada à atividade rural.

Ele incide sobre:
• Receita bruta da comercialização
• Venda da produção agropecuária

👤 Quem é obrigado a recolher
Depende da situação:
• Produtor pessoa física
• Produtor pessoa jurídica
• Cooperado
• Empregador rural

⚠️ Em muitos casos, quem compra a produção retém o Funrural na fonte.

🚨 Onde ocorrem os problemas
• Acreditar que o Funrural “não existe mais”
• Não conferir retenções feitas pelo comprador
• Acumular débito por erro operacional
• Não compensar valores pagos indevidamente

Resultado:
• Dívida ativa
• Execução fiscal
• Bloqueio de crédito rural

⚖️ Importante saber
O Funrural já foi muito questionado judicialmente, mas hoje está em vigor.
👉 Ignorar o Funrural é um dos erros fiscais mais caros no agro.

✅ Como evitar passivo
✔ Conferir notas fiscais de venda
✔ Verificar retenções corretamente
✔ Controlar recolhimentos
✔ Buscar orientação antes de parcelar ou discutir judicialmente`,

      "ICMS Interestadual": `🔍 O que é ICMS no agro
O ICMS incide sobre a circulação de mercadorias, inclusive produtos agropecuários.

No agro, ele varia conforme:
• Produto
• Estado de origem
• Estado de destino
• Tipo de operação

📌 Quando há ICMS interestadual
Ocorre quando:
• A produção é vendida para outro estado
• Há transporte interestadual da mercadoria

Mesmo produtor rural pessoa física pode estar sujeito ao ICMS.

⚠️ Pontos de atenção
• Nem toda operação é isenta
• Benefícios fiscais variam por estado
• Operações sem nota geram multa pesada
• Erro de enquadramento geru autuação

🚨 Erros comuns
❌ Achar que produto “in natura” nunca paga ICMS
❌ Emitir nota incorreta
❌ Ignorar diferença de alíquotas
❌ Não observar regras estaduais

✅ Como reduzir risco no ICMS
✔ Emitir nota fiscal corretamente
✔ Conhecer a regra do estado de origem e destino
✔ Verificar benefícios fiscais válidos
✔ Manter transporte regularizado`,

      "Como regularizar o CAR": `🔍 O que é o CAR
O CAR é um cadastro eletrônico obrigatório para todo imóvel rural no Brasil. Ele reúne informações ambientais da propriedade.
👉 Não é licença, mas é a base de todo o controle ambiental rural.

📌 Para que o CAR é usado
O CAR é utilizado por órgãos ambientais para:
• Identificar APP e Reserva Legal
• Verificar passivos ambientais
• Cruzar dados para fiscalização
• Autorizar crédito rural e programas públicos

⚠️ Imóvel sem CAR regular:
• Pode ter crédito bloqueado
• Pode sofrer restrições ambientais
• Entra em lista de risco para fiscalização

🧱 Situações comuns do CAR
• Ativo → cadastro feito
• Em análise → órgão ambiental ainda não validou
• Com pendências → erro técnico ou ambiental
• Cancelado → cadastro inválido

⚠️ “Em análise” não significa regular definitivo.

🚨 Erros mais comuns
❌ Declarar APP menor do que a real
❌ Incluir área produtiva como preservada
❌ Sobreposição com vizinhos
❌ Mapa mal feito
❌ Ignorar pendências apontadas
Esses erros geram passivo ambiental oculto.

✅ Como reduzir risco no CAR
✔ Fazer mapeamento correto
✔ Declarar APP e Reserva conforme a lei
✔ Acompanhar a análise do órgão ambiental
✔ Corrigir pendências rapidamente`,

      "CCIR e Certificação Incra": `🔍 O que é o CCIR
O Certificado de Cadastro de Imóvel Rural (CCIR) é emitido pelo Incra e comprova que o imóvel está cadastrado no sistema fundiário nacional.
👉 Não é escritura, mas é obrigatório.

📌 Para que o CCIR é exigido
Sem CCIR válido, não é possível:
• Vender o imóvel
• Desmembrar ou remembrar áreas
• Financiar
• Registrar escritura
• Fazer inventário rural

⚠️ Certificação Incra (georreferenciamento)
Imóveis rurais acima de determinado tamanho precisam estar:
• Georreferenciados
• Certificados no Incra
• Compatíveis com a matrícula

⚠️ Erros de georreferenciamento geram:
• Bloqueio de registro
• Conflito de área
• Impedimento de negociação

🚨 Erros comuns
❌ CCIR vencido
❌ Área do CCIR diferente da matrícula
❌ Georreferenciamento incompatível
❌ Achar que CCIR substitui escritura

✅ Como evitar problema
✔ Manter CCIR atualizado anualmente
✔ Conferir área declarada
✔ Usar profissional habilitado no georreferenciamento
✔ Verificar compatibilidade com a matrícula`,

      "Licenças de Instalação": `🔍 O que são licenças ambientais
Licenças ambientais autorizam atividades que podem gerar impacto ambiental. No agro, nem toda atividade exige licença, mas algumas exigem.

📌 Tipos mais comuns
• Licença Prévia (LP) – avalia viabilidade
• Licença de Instalação (LI) – autoriza implantação
• Licença de Operação (LO) – autoriza funcionamento

⚠️ Quando a licença é exigida
Geralmente exigida para:
• Irrigação em grande escala
• Barragens e açudes
• Silos e estruturas maiores
• Atividades com impacto ambiental
• Supressão vegetal autorizada

⚠️ Cada estado tem regras próprias.

🚨 Erros frequentes
❌ Achar que atividade rural nunca precisa de licença
❌ Instalar antes de licenciar
❌ Ignorar regras estaduais
❌ Confundir CAR com licença ambiental

Resultado:
• Multa
• Embargo
• Paralisação da atividade
• Processo administrativo

✅ Como reduzir risco
✔ Consultar órgão ambiental estadual
✔ Verificar se a atividade exige licença
✔ Nunca instalar antes de autorização
✔ Guardar licenças válidas e vigentes`,

      "Riscos no Arrendamento": `🔍 O que é o arrendamento rural

Arrendamento é o contrato em que o proprietário cede o uso da terra a terceiros, mediante pagamento fixo (dinheiro ou produto).

👉 É uma relação regida por lei específica (Estatuto da Terra), não é acordo informal.

⚠️ Onde está o maior risco

Os maiores problemas no arrendamento surgem quando:
• O contrato é verbal
• O contrato é genérico
• Não define responsabilidades
• Não prevê riscos ambientais, fiscais e trabalhistas

🚨 Riscos mais comuns no arrendamento
• Multa ambiental recair sobre o proprietário
• Dívidas fiscais vinculadas ao imóvel
• Uso irregular da terra pelo arrendatário
• Conflito sobre benfeitorias
• Dificuldade de retomada da área

⚠️ Mesmo sem produzir, o dono da terra pode ser responsabilizado.

🛡️ Como reduzir risco no arrendamento
✔ Contrato escrito e detalhado
✔ Definir quem responde por multas e passivos
✔ Estabelecer uso permitido da área
✔ Prever cláusulas ambientais
✔ Formalizar prazo e forma de pagamento`,

      "Parceria vs Locação": `🔍 Qual a diferença prática

Apesar de parecerem iguais, parceria agrícola e locação rural são juridicamente diferentes.

🌱 Parceria agrícola
• Produção compartilhada
• Riscos divididos
• Resultados divididos
• Maior complexidade jurídica
👉 Pode gerar questionamento trabalhista e fiscal se mal estruturada.

🏠 Locação rural
• Pagamento fixo
• Risco concentrado no locatário
• Relação mais simples
• Menor risco fiscal

⚠️ Onde ocorrem os problemas
• Chamar de parceria o que funciona como locação
• Dividir produção sem cumprir requisitos legais
• Não formalizar responsabilidades
• Misturar regras tributárias

Resultado:
• Autuação fiscal
• Reclassificação do contrato
• Multas
• Passivo inesperado

🛡️ Como escolher corretamente
✔ Avaliar o modelo real da operação
✔ Formalizar o tipo correto de contrato
✔ Não misturar regras de parceria e locação
✔ Buscar orientação antes de assinar`,

      "Sucessão Familiar": `🔍 O que é sucessão no meio rural

Sucessão é a transferência do patrimônio rural aos herdeiros, em vida ou após o falecimento do proprietário.

No agro, a sucessão mal planejada é uma das maiores causas de perda de patrimônio.

⚠️ Onde está o risco real
• Falta de planejamento
• Herdeiros sem alinhamento
• Inventário judicial longo
• Bloqueio da atividade produtiva
• Fragmentação da propriedade

⚠️ Enquanto o inventário não termina:
• A área pode ficar travada
• Crédito pode ser bloqueado
• Decisões ficam limitadas

🚨 Problemas mais comuns
• Conflitos familiares
• Venda forçada de parte da terra
• Endividamento para pagar impostos
• Paralisação da produção
• Perda de valor do ativo rural

🛡️ Como reduzir risco na sucessão
✔ Planejar ainda em vida
✔ Definir regras claras entre herdeiros
✔ Avaliar instrumentos legais adequados
✔ Evitar informalidade
✔ Pensar na continuidade da atividade`
    };

    if (predefined[topic]) {
      setTopicContent(predefined[topic]);
      return;
    }

    // FALLBACK PARA IA SE NÃO FOR TÓPICO FIXO
    setLoadingTopic(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Atue como Consultor Jurídico Sênior do Ecossistema Prylom. Forneça um guia técnico sobre: "${topic}". Foco: O que o produtor rural precisa saber para evitar riscos. Use tópicos. Idioma: ${lang}. Aviso final padrão: ⚠️ Este insight é orientativo e não substitui consulta jurídica.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setTopicContent(response.text || 'Informação indisponível.');
    } catch (e) {
      setTopicContent('Erro ao acessar terminal legal.');
    } finally {
      setLoadingTopic(false);
    }
  };

  const sendToLegalAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    const userText = aiMessage;
    setAiMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Consultor Jurídico Prylom. Usuário: "${userText}". Responda em ${lang}, técnico mas acessível. Inclua aviso de que não substitui advogado.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setChatHistory(prev => [...prev, { role: 'bot', text: response.text || 'Erro na análise.' }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Erro de conexão.' }]);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:py-16 animate-fadeIn pb-40 flex flex-col gap-10">
      
      {/* MODAL DE DETALHAMENTO DE TÓPICO */}
      {selectedTopic && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-xl bg-prylom-dark/60">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 md:p-14 shadow-3xl relative animate-fadeIn flex flex-col max-h-[85vh]">
            <button onClick={() => setSelectedTopic(null)} className="absolute top-8 right-8 text-gray-300 hover:text-prylom-dark p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <header className="mb-8 shrink-0">
               <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Dossiê Jurídico Prylom</span>
               <h3 className="text-3xl font-black text-[#000080] tracking-tighter uppercase leading-tight">{selectedTopic}</h3>
            </header>
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
               {loadingTopic ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-6">
                    <div className="w-10 h-10 border-4 border-prylom-gold/20 border-t-prylom-gold rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse tracking-[0.4em]">Consultando Base Legal...</p>
                 </div>
               ) : (
                 <div className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap animate-fadeIn">
                   {topicContent}
                 </div>
               )}
            </div>
            <footer className="mt-8 pt-6 border-t border-gray-100 shrink-0">
               <button onClick={() => setSelectedTopic(null)} className="w-full bg-prylom-dark text-white font-black py-5 rounded-full text-[10px] uppercase tracking-widest hover:bg-prylom-gold transition-all shadow-xl">Fechar Dossiê</button>
            </footer>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-prylom-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Intelligence & Compliance</span>
          <h1 className="text-4xl font-black text-prylom-dark tracking-tighter uppercase">{t.btnLegal}</h1>
          <p className="text-gray-500 text-sm font-bold">{t.legalSub}</p>
        </div>
        <button onClick={onBack} className="bg-white text-prylom-dark border-2 border-gray-100 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-prylom-gold transition-all">
          {t.btnBack}
        </button>
      </div>

      {/* POSITIONING NOTICE */}
      <div className="bg-[#FFF9F5] border border-orange-100 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div>
          <h4 className="text-orange-800 font-black uppercase text-xs tracking-widest mb-1">{t.legalDisclaimerTitle}</h4>
          <p className="text-orange-700 text-sm font-medium leading-relaxed">{t.legalDisclaimerContent}</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex bg-gray-100 p-1.5 rounded-[2rem] w-fit overflow-x-auto no-scrollbar self-center md:self-start">
        {[{ id: 'radar', label: t.legalRadar, icon: '🚨' }, { id: 'modules', label: 'Eixos Temáticos', icon: '📚' }, { id: 'risk', label: t.legalRiskMap, icon: '⚠️' }, { id: 'ai', label: t.legalAiChat, icon: '🧠' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-md text-prylom-dark' : 'text-gray-400 hover:text-prylom-dark'}`}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[60vh]">
        {activeTab === 'radar' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-xl font-black text-[#000080] uppercase tracking-tighter px-2">Alertas Estratégicos Recentes</h3>
              {[
                { type: 'danger', title: 'Novas Regras de ITR 2026', desc: 'Receita Federal endurece fiscalização sobre valor da Terra Nua declarado.' },
                { type: 'warning', title: 'Prazos de CAR em MT/GO', desc: 'Vencimento de retificações obrigatórias para áreas em bioma Cerrado.' },
                { type: 'success', title: 'Normativa Incentiva Barter', desc: 'Novo decreto facilita registro de garantias em contratos de troca.' }
              ].map((alert, i) => (
                <div key={i} className={`p-8 rounded-[3rem] border bg-white shadow-sm flex flex-col gap-4 border-gray-100`}>
                  <div className="flex justify-between items-start">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${alert.type === 'danger' ? 'bg-red-100 text-red-700' : alert.type === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {alert.type === 'danger' ? 'URGENTE' : alert.type === 'warning' ? 'ATENÇÃO' : 'OPORTUNIDADE'}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">Há 2 dias</span>
                  </div>
                  <h4 className="text-2xl font-black text-prylom-dark tracking-tighter">{alert.title}</h4>
                  <p className="text-gray-600 text-sm font-medium">{alert.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-prylom-dark text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden h-fit">
               <div className="relative z-10 space-y-6">
                  <h4 className="text-xl font-black uppercase tracking-tight">Checklist de Conformidade</h4>
                  <ul className="space-y-4">
                     {['CCIR e ITR atualizados', 'Georreferenciamento averbado', 'CAR validado sem sobreposição', 'Outorga d\'água ativa'].map((item, i) => (
                       <li key={i} className="flex gap-3 text-sm font-medium opacity-80"><span className="text-prylom-gold">✓</span> {item}</li>
                     ))}
                  </ul>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {[
              { id: 'env', title: t.legalEnvironmental, icon: '🌱', items: ['O que é crime ambiental?', 'Checklist APP e Reserva', 'Queimadas e Uso do Fogo'] },
              { id: 'tax', title: t.legalFiscal, icon: '💸', items: ['ITR e Valor de Terra Nua', 'Funrural e Contribuições', 'ICMS Interestadual'] },
              { id: 'prac', title: t.legalPractical, icon: '📜', items: ['Como regularizar o CAR', 'CCIR e Certificação Incra', 'Licenças de Instalação'] },
              { id: 'rel', title: t.legalRelations, icon: '🤝', items: ['Riscos no Arrendamento', 'Parceria vs Locação', 'Sucessão Familiar'] }
            ].map(mod => (
              <div key={mod.id} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-default">
                 <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{mod.icon}</div>
                 <h4 className="text-xl font-black text-prylom-dark uppercase tracking-tighter mb-6">{mod.title}</h4>
                 <div className="space-y-3">
                    {mod.items.map((item, i) => (
                      <button key={i} onClick={() => handleTopicClick(item)} className="w-full flex items-center justify-between text-xs font-bold text-gray-500 border-b border-gray-50 pb-2 hover:text-prylom-gold transition-colors text-left group/item">
                        <span>{item}</span>
                        <span className="group-hover/item:translate-x-1 transition-transform">→</span>
                      </button>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl animate-fadeIn">
             <header className="mb-12 text-center">
                <h3 className="text-3xl font-black text-prylom-dark uppercase tracking-tighter">Matriz de Risco Jurídico Prylom</h3>
                <p className="text-gray-400 font-bold text-sm mt-2">Nível de criticidade por tema agro-legal.</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { level: 'High', color: 'bg-red-500', themes: ['Queimada sem licença', 'Defensivo sem receituário', 'Desmate sem reserva legal'] },
                  { level: 'Medium', color: 'bg-orange-400', themes: ['CAR em análise', 'Contrato sem registro', 'ITR abaixo do VTI'] },
                  { level: 'Low', color: 'bg-green-500', themes: ['CCIR atualizado', 'Georreferenciamento OK', 'Outorga ativa'] }
                ].map(risk => (
                  <div key={risk.level} className="flex flex-col h-full">
                     <div className={`p-4 rounded-t-[2rem] text-white font-black text-center uppercase tracking-widest text-[10px] ${risk.color}`}>Risco {risk.level === 'High' ? 'Alto' : risk.level === 'Medium' ? 'Médio' : 'Baixo'}</div>
                     <div className="flex-1 bg-gray-50 p-8 rounded-b-[2.5rem] border-x border-b border-gray-100 space-y-4">
                        {risk.themes.map((t, i) => (
                          <div key={i} className="p-4 bg-white rounded-2xl shadow-sm font-bold text-xs text-gray-700 flex items-center gap-3"><span className={`w-2 h-2 rounded-full ${risk.color}`}></span> {t}</div>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white h-[70vh] rounded-[4rem] border border-gray-100 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
             <header className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/50">
                <div className="w-12 h-12 bg-prylom-dark text-prylom-gold rounded-2xl flex items-center justify-center text-2xl shadow-lg">🧠</div>
                <div><h3 className="text-lg font-black text-prylom-dark uppercase tracking-tight">{t.legalAiChat}</h3><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Orientação Técnica 100% Real-Time</p></div>
             </header>
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <p className="text-sm font-bold">Faça uma pergunta sobre burocracia ou risco agro.</p>
                    <p className="text-[10px] uppercase font-black tracking-widest italic max-w-xs">"Ex: Quais as multas para queima sem licença?" ou "Como funciona a sucessão no arrendamento?"</p>
                  </div>
                )}
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm font-medium leading-relaxed ${chat.role === 'user' ? 'bg-[#000080] text-white rounded-tr-none' : 'bg-gray-100 text-prylom-dark rounded-tl-none border border-gray-200'}`}>{chat.text}</div>
                  </div>
                ))}
                {loadingAi && <div className="flex justify-start"><div className="bg-gray-100 p-6 rounded-[2rem] border border-gray-200 flex gap-2"><div className="w-2 h-2 bg-prylom-gold rounded-full animate-bounce"></div><div className="w-2 h-2 bg-prylom-gold rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div><div className="w-2 h-2 bg-prylom-gold rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></div></div></div>}
             </div>
             <form onSubmit={sendToLegalAi} className="p-6 border-t border-gray-100 bg-white">
                <div className="flex bg-gray-50 rounded-full p-2 border border-gray-200 focus-within:border-prylom-gold transition-all">
                   <input type="text" value={aiMessage} onChange={e => setAiMessage(e.target.value)} placeholder="Sua dúvida jurídica..." className="flex-1 bg-transparent px-6 py-3 text-sm font-medium outline-none text-prylom-dark" />
                   <button type="submit" disabled={loadingAi} className="bg-prylom-dark text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-prylom-gold transition-all shadow-xl">Enviar</button>
                </div>
             </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalAgro;