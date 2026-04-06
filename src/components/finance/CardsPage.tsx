import { useState, useEffect } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Plus, CreditCard, Landmark, ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PluggyConnect } from "react-pluggy-connect";

interface CardsPageProps {
   cards: any[];
   onAddClick: () => void;
   onEditClick: (card: any) => void;
   onDataSync?: () => void;
   onTransactionsLoaded?: (cardId: string, transactions: any[]) => void;
}

const mockTransactions = [
   { id: 1, title: "Uber Viagens", amount: 25.50, date: "Hoje, 14:32", type: 'expense' },
   { id: 2, title: "Ifood", amount: 64.90, date: "Ontem, 20:15", type: 'expense' },
   { id: 3, title: "Netflix", amount: 55.90, date: "2 de Out", type: 'expense' },
   { id: 4, title: "Estorno Compra App", amount: 21.90, date: "1 de Out", type: 'income' },
];

export default function CardsPage({ cards, onAddClick, onEditClick, onDataSync, onTransactionsLoaded }: CardsPageProps) {
    const [activeCardId, setActiveCardId] = useState<string | null>(cards[0]?.id || null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [parent] = useAutoAnimate();
   const [connectToken, setConnectToken] = useState<string | null>(null);

   const [transactions, setTransactions] = useState<any[]>([]);
   const [isLoadingTx, setIsLoadingTx] = useState(false);
   const [faturaTotal, setFaturaTotal] = useState(0);

   const [displayCards, setDisplayCards] = useState(cards);

   // Sincroniza apenas quando a lista de IDs de cartões muda (adição/exclusão)
   // Evita resetar a rotação do usuário em re-renders simples do pai
   useEffect(() => {
     const currentIds = displayCards.map(c => c.id).sort().join(',');
     const propIds = cards.map(c => c.id).sort().join(',');
     
     if (currentIds !== propIds || displayCards.length !== cards.length) {
        const savedId = localStorage.getItem('preferred_card_id');
        if (savedId) {
           const index = cards.findIndex(c => c.id === savedId);
           if (index !== -1) {
              const reordered = [...cards.slice(0, index), ...cards.slice(index + 1), cards[index]];
              setDisplayCards(reordered);
              setActiveCardId(savedId);
              return;
           }
        }
        setDisplayCards(cards);
     }
   }, [cards]);

   const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

   const handleCardSelect = (cardId: string) => {
      setActiveCardId(cardId);
      const index = displayCards.findIndex(c => c.id === cardId);
      if (index === -1) return;
      
      const newOrder = [...displayCards.slice(0, index), ...displayCards.slice(index + 1), displayCards[index]];
      setDisplayCards(newOrder);
      
      // Salva a preferência
      localStorage.setItem('preferred_card_id', String(cardId));
   };

   const handleConnectBank = async () => {
      setIsConnecting(true);
      try {
         const { data, error } = await supabase.functions.invoke('pluggy-create-token');
         if (error) throw error;
         if (data?.accessToken) {
            setConnectToken(data.accessToken);
         } else {
            throw new Error("Token não gerado.");
         }
      } catch (e) {
         console.error(e);
         toast.error("Erro ao solicitar acesso de conexão segura.");
      } finally {
         setIsConnecting(false);
      }
   };

   const saveInvoiceToCard = async (cardId: string, amount: number) => {
      try {
         await supabase.from('cards').update({ current_invoice: amount }).eq('id', cardId);
      } catch (e) { console.error("Erro salvando fatura:", e); }
   }

   const fetchTransactions = async (forceSync = false) => {
      if (!activeCard) return;
      setIsLoadingTx(true);
      let currentFatura = 0;
      let loadedTx: any[] = [];
      try {
         // Se tem o ID nativo da instituição (Open Finance conectado via Pluggy)
         if (activeCard.pluggy_account_id) {
            const { data, error } = await supabase.functions.invoke('pluggy-sync-transactions', {
               body: { accountId: activeCard.pluggy_account_id }
            });
            if (error) throw error;

            if (data && data.transactions) {
               const mappedTx = data.transactions.map((tx: any) => ({
                  id: tx.id,
                  title: tx.description?.substring(0, 25) || "Lançamento",
                  amount: Math.abs(tx.amount || 0),
                  date: new Date(tx.date).toLocaleDateString('pt-BR'),
                  type: tx.type === 'CREDIT' ? 'income' : 'expense'
               }));
               setTransactions(mappedTx);
               loadedTx = mappedTx;
               currentFatura = mappedTx.reduce((acc, tx) => tx.type === 'expense' ? acc + tx.amount : acc - tx.amount, 0);
               if (forceSync) toast.success("Sincronizado com a instituição financeira!");
            }
         } else {
            // Fallback charmóoso para cartões ainda manuais
            await new Promise(r => setTimeout(r, 600));
            const fakeSeed = activeCard.id.charCodeAt(0) + activeCard.id.length;

            const fakeTx = [
               { id: '1', title: "Uber Viagens", amount: 25.50 + fakeSeed, date: "Hoje", type: 'expense' },
               { id: '2', title: "Ifood", amount: 64.90 + (fakeSeed * 2), date: "Ontem", type: 'expense' },
               { id: '3', title: "Transferência Recebida", amount: 350.00 + fakeSeed, date: "Essa semana", type: 'income' },
               { id: '4', title: "Padaria Express", amount: 12.00, date: "Essa semana", type: 'expense' },
               { id: '5', title: "Assinatura Netflix", amount: 55.90, date: "Essa semana", type: 'expense' },
            ];
            setTransactions(fakeTx);
            loadedTx = fakeTx;
            currentFatura = fakeTx.reduce((acc, tx) => tx.type === 'expense' ? acc + tx.amount : acc - tx.amount, 0);
            if (forceSync) toast.success("Base local sincronizada!");
         }

         // Atualiza Total
         const faturaFinal = Math.max(0, currentFatura);
         setFaturaTotal(faturaFinal);

         // Salva a fatura no registro do cartão (para leitura na Home)
         saveInvoiceToCard(activeCard.id, faturaFinal);

         // Expõe as transações para o componente pai (aparecerão na Home como itens)
         onTransactionsLoaded?.(activeCard.id, loadedTx);

         // Sempre sincroniza o Index para refletir a fatura atualizada
         if (onDataSync) onDataSync();
      } catch (e) {
         console.error("Transações falharam:", e);
         if (forceSync) toast.error("Ocorreu um atraso de comunicação com o banco.");
      } finally {
         setIsLoadingTx(false);
      }
   };

   // Observa a aba ativa para recarregar as transações adequadas
   useEffect(() => {
      fetchTransactions();
   }, [activeCardId]);

   return (
      <div className="flex gap-4 flex-1 overflow-hidden min-w-0 px-2 h-full">
         {/* Coluna Esquerda: Cartões (Fileira Vertical) */}
         <div className="w-80 shrink-0 h-full flex flex-col gap-4 bg-black/20 backdrop-blur-xl p-4 rounded-[32px]">
            <div className="flex items-center justify-between px-2 pt-2 pb-1">
               <h2 className="text-white font-medium text-lg tracking-tight">Meus Cartões</h2>
            </div>

            <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col pr-1 pb-4">
               <button onClick={onAddClick} className="w-full shrink-0 h-[100px] rounded-[24px] bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all gap-2 group outline-none mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                     <Plus size={20} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest leading-tight px-2">Novo Cartão</span>
               </button>

               <div 
                  ref={parent}
                  className="flex flex-col -space-y-28 pb-12 overflow-visible pr-1 hide-scrollbar pt-6"
               >
                  {displayCards.map((card, idx) => {
                     const isGlass = card.color?.includes('backdrop-blur');
                     const isActive = activeCardId === card.id || (!activeCardId && idx === displayCards.length - 1);
                     return (
                        <button
                           key={card.id}
                           onClick={() => handleCardSelect(card.id)}
                           className={`w-full shrink-0 p-5 rounded-[24px] flex flex-col gap-4 text-left ${isActive ? "bg-black/[0.65] scale-[1.02]" : "bg-black/[0.45] opacity-70 hover:opacity-100 hover:bg-black/[0.55]"} relative overflow-hidden group outline-none min-h-[140px] flex justify-between transition-colors duration-500 hover:-translate-y-4 shadow-none`}
                           style={{
                              zIndex: idx
                           }}
                        >
                           {/* Color Tint Overlay - Masking content behind */}
                           <div className={`absolute inset-0 ${card.color} ${isGlass ? "opacity-100" : (isActive ? "opacity-30" : "opacity-20")} transition-opacity`} />

                           {/* Glass Surface Glow */}
                           <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-40" />

                           <div className="flex justify-between items-center z-10 w-full text-white relative">
                              <div className="flex items-center gap-2">
                                 <CreditCard size={18} className={!isActive ? "opacity-50" : ""} />
                                 <span className={`text-xs font-bold uppercase tracking-widest ${!isActive ? "opacity-50" : ""}`}>{card.bank}</span>
                              </div>
                           </div>

                           <div className="flex items-end justify-between z-10 w-full mt-4 text-white">
                              <div className="flex flex-col gap-1.5">
                                 <span className={`text-[9px] font-bold tracking-[0.2em] uppercase opacity-70 ${!isActive ? "opacity-40" : ""}`}>{card.type}</span>
                                 <span className={`text-xl font-mono tracking-widest ${!isActive ? "opacity-60" : ""}`}>•••• {card.lastDigits || "****"}</span>
                              </div>
                           </div>
                        </button>
                     );
                  })}
               </div>
            </div>
         </div>

         {/* Main Área de Detalhamento do Cartão (Direita) */}
         <div className="flex-1 glass-panel rounded-3xl p-8 flex flex-col gap-8 overflow-hidden min-w-0 border-none bg-background/60 backdrop-blur-xl shadow-2xl">
            {activeCard ? (
               <>
                  {/* Header com infos e botão de conexão */}
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <h1 className="text-4xl text-white font-bold tracking-tight">{activeCard.bank}</h1>
                        <p className="text-white/50 font-medium text-sm">Gerencie faturas e integrações desta conta bancária</p>
                     </div>
                     <button
                        onClick={handleConnectBank}
                        disabled={isConnecting}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 text-white hover:bg-white text-sm font-bold shadow-lg hover:text-black transition-all disabled:opacity-70 disabled:hover:bg-white/10 disabled:hover:text-white group"
                     >
                        {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Landmark size={18} className="text-white/60 group-hover:text-black transition-colors" />}
                        {isConnecting ? "Conectando..." : "Integração Bancária"}
                     </button>
                  </div>

                  {/* Quadro Resumo Fatura */}
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.01] rounded-3xl p-8 flex gap-8 items-center shadow-inner">
                     <div className="flex-1">
                        <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">Fatura Atual (Estimada)</span>
                        <div className="flex items-baseline gap-2 mt-2">
                           <span className={`text-lg font-medium ${faturaTotal > 0 ? "text-rose-500/80" : "text-emerald-500/80"}`}>R$</span>
                           <p className={`text-5xl font-bold tracking-tight ${faturaTotal > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                              {faturaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                        </div>
                        <p className="text-xs text-white/40 mt-3 font-medium bg-black/20 self-start inline-flex px-3 py-1 rounded-full">
                           Vencimento dia {activeCard.dueDay || 10}
                        </p>
                     </div>
                     <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                     <div className="flex-1">
                        <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">Limite Disponível</span>
                        <p className="text-2xl text-white font-medium mt-2">R$ {activeCard.availableLimit}</p>
                        <div className="w-full h-1.5 bg-black/40 rounded-full mt-4 overflow-hidden">
                           <div className="h-full bg-emerald-500/80 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (activeCard.availableLimit / (activeCard.totalLimit || 1)) * 100))}%` }}></div>
                        </div>
                        <p className="text-[10px] text-white/40 mt-3 font-medium tracking-widest uppercase">Limite total de R$ {activeCard.totalLimit}</p>
                     </div>
                  </div>

                  {/* Transações (Mockup) */}
                  <div className="flex flex-col gap-4 flex-1 min-h-0">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-medium text-lg tracking-tight">Transações</h3>
                        <button onClick={() => fetchTransactions(true)} className="text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                           <RefreshCcw size={12} className={isLoadingTx ? "animate-spin text-white" : ""} />
                           {isLoadingTx ? "Baixando extrato..." : "Sincronizar"}
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
                        {isLoadingTx ? (
                           <div className="flex flex-col items-center justify-center p-10 h-full gap-4">
                              <Loader2 size={24} className="text-white/20 animate-spin" />
                              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Buscando na Instituição</p>
                           </div>
                        ) : transactions.length > 0 ? (
                           transactions.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'expense' ? 'bg-white/5 text-white' : 'bg-[#1DB954]/10 text-[#1DB954]'}`}>
                                       {tx.type === 'expense' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-white font-medium text-sm">{tx.title}</span>
                                       <span className="text-white/40 text-xs mt-0.5">{tx.date}</span>
                                    </div>
                                 </div>
                                 <span className={`font-mono text-sm font-medium ${tx.type === 'expense' ? 'text-white' : 'text-[#1DB954]'}`}>
                                    {tx.type === 'expense' ? '-' : '+'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                                 </span>
                              </div>
                           ))
                        ) : (
                           <div className="flex flex-col items-center justify-center p-10 h-full text-center">
                              <p className="text-white/30 text-sm">Nenhuma transação recente encontrada neste limite.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center">
                  <CreditCard size={48} className="text-white/10 mb-4" strokeWidth={1} />
                  <p className="text-white/60 font-medium">Nenhum cartão selecionado</p>
                  <p className="text-white/40 text-sm mt-2 max-w-xs">Selecione um cartão ao lado ou adicione um novo para gerenciar as finanças conectadas.</p>
               </div>
            )}
         </div>

         {connectToken && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
               <PluggyConnect
                  connectToken={connectToken}
                  includeSandbox={true}
                  onSuccess={async (itemData) => {
                     console.log("Banco conectado!", itemData);
                     setConnectToken(null);
                     toast.info("Conexão validada! Aguardando o banco sincronizar seus dados...", { duration: 10000 });

                     try {
                        const userResp = await supabase.auth.getUser();
                        const userId = userResp.data.user?.id;
                        if (!userId) return;

                        // 1. Salva como "Item"/"Conexão" ativa para referência 
                        await supabase.from('pluggy_items').insert({
                           user_id: userId,
                           pluggy_item_id: itemData.item.id,
                        });

                        // 2. Poll: Tenta puxar as contas até 10x com 3s de intervalo
                        // (Bancos reais demoram até 30s pra exportar contabilidade depois da senha informada)
                        let accounts = [];
                        let attempts = 0;

                        while (attempts < 10) {
                           const { data, error } = await supabase.functions.invoke('pluggy-sync', {
                              body: { itemId: itemData.item.id }
                           });

                           if (!error && data?.accounts && data.accounts.length > 0) {
                              accounts = data.accounts;
                              break;
                           }

                           attempts++;
                           if (attempts === 5) toast.warning("O banco de dados da instituição está demorando, mantenha a tela...");
                           await new Promise(r => setTimeout(r, 4000));
                        }

                        if (accounts.length === 0) {
                           toast.error("O banco não liberou as contas a tempo. A sincronização falhou.", { duration: 5000 });
                           return;
                        }

                        console.log("Accounts recebidas após polling: ", accounts);

                        // 3. Salvar diretamente na Tabela `cards` do Painel (Sincronização real!)
                        for (const acc of accounts) {
                           let color = "bg-primary";
                           const nameLower = (acc.name || "banco").toLowerCase();
                           if (nameLower.includes("nubank") || nameLower.includes("nu")) color = "bg-purple-600";
                           else if (nameLower.includes("itaú") || nameLower.includes("itau")) color = "bg-orange-500";
                           else if (nameLower.includes("bb") || nameLower.includes("brasil")) color = "bg-yellow-500";
                           else if (nameLower.includes("c6")) color = "bg-zinc-800";
                           else if (nameLower.includes("inter")) color = "bg-orange-400";
                           else if (nameLower.includes("sandbox")) color = "bg-green-600";
                           else if (acc.type === 'CREDIT') color = "bg-zinc-700";

                           const payload = {
                              user_id: userId,
                              bank: acc.name,
                              type: acc.type === 'CREDIT' ? 'Crédito' : (acc.type === 'BANK' ? 'Conta Corrente' : 'Outros'),
                              last_digits: acc.number?.slice(-4) || '****',
                              color: color,
                              total_limit: acc.balance || 0,
                              available_limit: acc.balance || 0,
                              due_day: 10,
                              pluggy_account_id: acc.id,
                              current_invoice: 0
                           };

                           const { error: insertErr } = await supabase.from('cards').insert(payload);
                           if (insertErr) throw insertErr;
                        }

                        toast.success("Contas bancárias sincronizadas! Seus cartões foram inseridos.");
                        if (onDataSync) onDataSync();

                     } catch (e) {
                        console.error("Erro no processamento:", e);
                        toast.error("Ocorreu um erro ao salvar as contas no nosso sistema.");
                     }
                  }}
                  onError={(error) => {
                     console.error("Pluggy integration error:", error);
                     setConnectToken(null);
                     toast.error("Ocorreu um erro ao conectar ao banco");
                  }}
                  onClose={() => setConnectToken(null)}
               />
            </div>
         )}
      </div>
   );
}
