import { useState, useEffect } from "react";
import SidebarPanel from "@/components/finance/SidebarPanel";
import CategoryPanel, { Category } from "@/components/finance/CategoryPanel";
import DetailPanel from "@/components/finance/DetailPanel";
import ActionPanel from "@/components/finance/ActionPanel";
import CategoryActionPanel from "@/components/finance/CategoryActionPanel";
import CardActionPanel from "@/components/finance/CardActionPanel";
import NotesPanel, { ListItem } from "@/components/finance/NotesPanel";
import { UserNav } from "@/components/finance/UserNav";
import SpotifyCard from "@/components/finance/SpotifyCard";
import { useSpotify } from "@/hooks/useSpotify";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import CardsPage from "@/components/finance/CardsPage";

import CardsPanel from "@/components/finance/CardsPanel";

const Index = () => {
  const { handleAuthCallback } = useSpotify();
  const { profile, user } = useAuth();
  const [activeNav, setActiveNav] = useState("Visão Geral");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<number | string>(0);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCardDrawerOpen, setIsCardDrawerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [allCards, setAllCards] = useState<any[]>([]);
  const [cardTransactions, setCardTransactions] = useState<Record<string, any[]>>({});
  const [items, setItems] = useState<ListItem[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [localIsBiluEnabled, setLocalIsBiluEnabled] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [pendingPartialItemId, setPendingPartialItemId] = useState<string | number | null>(null);

  // Sincronizar o estado local quando o perfil carregar
  useEffect(() => {
    if (profile?.is_bilu_enabled !== undefined) {
      setLocalIsBiluEnabled(profile.is_bilu_enabled);
    }
  }, [profile?.is_bilu_enabled]);

  const handleBiluToggle = async (enabled: boolean) => {
    if (!user) return;

    // Atualização otimista
    setLocalIsBiluEnabled(enabled);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_bilu_enabled: enabled })
        .eq('id', user.id);
      if (error) throw error;
      toast.success(enabled ? "Bilu IA Ativado!" : "Bilu IA em Hibernação!");
    } catch (error: any) {
      setLocalIsBiluEnabled(!enabled); // Reverte em caso de erro
      toast.error("Erro ao alterar status do Bilu");
    }
  };

  // Timeout de segurança para o digitando
  useEffect(() => {
    let timeout: any;
    if (isTyping) {
      timeout = setTimeout(() => setIsTyping(false), 30000);
    }
    return () => clearTimeout(timeout);
  }, [isTyping]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      handleAuthCallback(code);
    }
  }, [handleAuthCallback]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (cardsError) throw cardsError;

      setAllCards(cardsData?.map(c => ({
        id: c.id,
        bank: c.bank || "Desconhecido",
        type: c.type || "Crédito",
        lastDigits: c.last_digits || "****",
        color: c.color || "bg-primary",
        totalLimit: c.total_limit?.toString() || "0",
        availableLimit: c.available_limit?.toString() || "0",
        dueDay: c.due_day?.toString() || "10",
        currentInvoice: c.current_invoice || 0
      })) || []);

      // Fetch categories
      let cats: Category[] = [];
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (catError) console.error("Categories fetch error:", catError); // Ignorar se a tabela não existir ainda

        let finalCatData = catData;
        if (!catError && (!catData || catData.length === 0)) {
          // Create default categories
          const defaultCats = [
            { name: "Dívidas", background_url: "#a78bfa", user_id: user.id },
            { name: "Tarefas", background_url: "#f472b6", user_id: user.id },
            { name: "Ganhos", background_url: "#4ade80", user_id: user.id }
          ];
          await supabase.from('categories').insert(defaultCats);

          // Fetch again
          const { data: newCatData } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
          finalCatData = newCatData;
        }

        cats = finalCatData?.map(c => ({
          id: c.id,
          name: c.name,
          background_url: c.background_url
        })) || [];
        setCategories(cats);
      } catch (err) {
        console.warn("Categories not available yet", err);
      }

      // Fetch records
      const { data: recordsData, error: recordsError } = await supabase
        .from('finance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;

      const newItems = recordsData?.map(r => ({
        id: r.id,
        title: r.title,
        summary: r.description || "",
        tag: r.tag || (r.record_type === 'Gasto' ? '#GASTO' : r.record_type === 'Ganho' ? '#GANHO' : '#NOTA'),
        tagType: (r.tag_type as any) || 'primary',
        date: (() => {
          if (!r.due_date) return "1 dia"; // Placeholder para contas sem data definida
          const target = new Date(r.due_date);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const dueDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 0) return "Hoje";
          if (diffDays < 0) return "Vencido";
          return `${diffDays} dias`;
        })(),
        amount: r.amount ? `R$ ${r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined,
        due_date: r.due_date,
        total_installments: r.total_installments,
        paid_installments: r.paid_installments,
        category_id: r.category_id
      })) || [];

      setCategories(cats);

      setItems(newItems);

      // Gerar notificações
      const upcomingNotifs = newItems
        .filter(i => {
          if (!i.due_date) return false;
          if (i.date === "Hoje" || i.date === "Vencido") return true;
          if (typeof i.date === 'string' && i.date.includes("dias")) {
            const days = parseInt(i.date);
            return !isNaN(days) && days <= 3 && days > 0;
          }
          return false;
        })
        .map(i => ({
          id: i.id,
          title: i.title,
          message: i.date === "Vencido" ? `Dívida em atraso!` : i.date === "Hoje" ? `Vence hoje!` : `Vence em ${i.date}`,
          type: i.date === "Vencido" ? "error" : "warning",
          date: i.due_date,
          amount: i.amount,
          category_id: i.category_id
        }))
        .filter(n => !dismissedNotifIds.includes(String(n.id)));
      setNotifications(upcomingNotifs);
      if (upcomingNotifs.length > 0) {
        setHasUnreadNotifications(true);
      }

      if (cats.length > 0 && !activeCategoryId) {
        setActiveCategoryId(cats[0].id);
      }

      if (newItems.length > 0 && (activeItemId === 0 || activeItemId === "0")) {
        // Tentar pegar o primeiro item da categoria ativa
        const catIdForSelect = activeCategoryId || cats[0]?.id;
        const firstItem = newItems.find(i => String(i.category_id) === String(catIdForSelect));
        if (firstItem) setActiveItemId(firstItem.id);
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados do servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();

      const cardsChannel = supabase
        .channel('realtime-cards')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log('Cards realtime update:', payload);
            fetchData(); // Recarrega silenciosamente os dados garantindo reatividade
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(cardsChannel);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeCategoryId) {
      const itemsInCategory = allPossibleItems.filter(i => String(i.category_id) === String(activeCategoryId));
      if (itemsInCategory.length > 0) {
        // Se o item atual ainda existir na nova categoria, mantenha-o. Caso contrário, peque o primeiro.
        const currentStillExists = itemsInCategory.some(i => i.id === activeItemId);
        if (!currentStillExists) {
          setActiveItemId(itemsInCategory[0].id);
        }
      } else {
        setActiveItemId(0);
      }
    }
  }, [activeCategoryId]);

  // Sincronização Global de Transações para populá-las no dashboard (Faturas)
  useEffect(() => {
    const fetchAllTransactions = async () => {
      if (!allCards || allCards.length === 0) return;

      const newTransactions: Record<string, any[]> = {};

      for (const card of allCards) {
        // Se já temos as transações para esse cartão e não for um recarregamento completo, podemos pular
        // mas aqui vamos garantir que na primeira carga de Index ele puxe tudo.

        try {
          if (card.pluggy_account_id) {
            const { data, error } = await supabase.functions.invoke('pluggy-sync-transactions', {
              body: { accountId: card.pluggy_account_id }
            });
            if (!error && data?.transactions) {
              newTransactions[card.id] = data.transactions.map((tx: any) => ({
                id: tx.id,
                title: tx.description?.substring(0, 25) || "Lançamento",
                amount: Math.abs(tx.amount || 0),
                date: new Date(tx.date).toLocaleDateString('pt-BR'),
                type: tx.type === 'CREDIT' ? 'income' : 'expense'
              }));
            }
          } else {
            // Mock data consistente com CardsPage
            const fakeSeed = String(card.id).charCodeAt(0) + String(card.id).length;
            newTransactions[card.id] = [
              { id: `m1_${card.id}`, title: "Uber Viagens", amount: 25.50 + fakeSeed, date: "Hoje", type: 'expense' },
              { id: `m2_${card.id}`, title: "Ifood", amount: 64.90 + (fakeSeed * 2), date: "Ontem", type: 'expense' },
              { id: `m3_${card.id}`, title: "Transferência Recebida", amount: 350.00 + fakeSeed, date: "Essa semana", type: 'income' },
              { id: `m4_${card.id}`, title: "Padaria Express", amount: 12.00, date: "Essa semana", type: 'expense' },
              { id: `m5_${card.id}`, title: "Assinatura Netflix", amount: 55.90, date: "Essa semana", type: 'expense' },
            ];
          }
        } catch (e) {
          console.error(`Erro ao sincronizar cartão ${card.id}:`, e);
        }
      }

      setCardTransactions(newTransactions);
    };

    fetchAllTransactions();
  }, [allCards]);

  const fetchComments = async (recordId: string | number) => {
    if (!user || !recordId || recordId === 0 || recordId === "0") return;
    try {
      const { data, error } = await supabase
        .from('record_comments')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      // Adicionar record_id em cada comentário para segurança no DetailPanel
      const commentsWithRecordId = (data || []).map(c => ({ 
        ...c, 
        record_id: recordId 
      }));
      setComments(commentsWithRecordId);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (activeItemId && activeItemId !== 0 && activeItemId !== "0") {
      const item = allPossibleItems.find(i => String(i.id) === String(activeItemId));
      const recordId = item ? getRecordIdForComments(item) : activeItemId;
      fetchComments(recordId);

      // Realtime listener
      const channel = supabase
        .channel(`chat-${recordId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'record_comments',
            filter: `record_id=eq.${recordId}`
          },
          (payload: any) => {
            console.log('Realtime payload:', payload);
            if (payload.eventType === 'INSERT') {
              if (payload.new.author === 'system') {
                setIsTyping(false);
              }
              setComments(prev => {
                if (prev.some(c => c.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            } else if (payload.eventType === 'UPDATE') {
              setComments(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
            } else if (payload.eventType === 'DELETE') {
              setComments(prev => prev.filter(c => c.id !== payload.old.id));
            }
          }
        )
        .subscribe((status) => {
          console.log(`Realtime status for chat-${activeItemId}:`, status);
        });

      // Realtime listener para o perfil (botão do Bilu)
      const profileChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload: any) => {
            console.log('Profile updated:', payload.new);
            // Isso forçará a atualização do perfil no useAuth se o hook suportar, 
            // ou podemos usar o fetchData para sincronizar tudo.
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(profileChannel);
      };
    } else {
      setComments([]);
    }
  }, [activeItemId]);

  // Helper para persistir comentários de itens virtuais transformando o ID em um UUID determinístico
  const getRecordIdForComments = (item: any) => {
    if (!item.isVirtual) return item.id;
    // Criar um UUID falso mas constante: e11as###-6666-4444-8888-[hex part of id]
    const hash = String(item.id).split('').reduce((acc, char) => acc + (char.charCodeAt(0).toString(16)), "");
    const part = hash.substring(0, 12).padEnd(12, '0');
    return `e11a5000-0000-4000-8000-${part}`;
  };

  const handleCardConfirm = async (cardData: any) => {
    if (!user) return;
    try {
      // Limpeza robusta para garantir que apenas números cheguem ao banco
      const cleanTotalLimit = String(cardData.totalLimit).replace(/[^\d.-]/g, '');
      const cleanAvailableLimit = String(cardData.availableLimit).replace(/[^\d.-]/g, '');

      const basePayload: any = {
        bank: cardData.bank,
        type: cardData.type,
        last_digits: cardData.lastDigits,
        color: cardData.color,
        total_limit: parseFloat(cleanTotalLimit) || 0,
        available_limit: parseFloat(cleanAvailableLimit) || 0,
        due_day: parseInt(String(cardData.dueDay)) || 10
      };

      if (editingCard) {
        const targetId = editingCard.id;
        
        // Objeto 100% controlado para evitar vazamento de campos de sistema (user_id, etc)
        const cleanUpdatePayload = {
          bank: cardData.bank || "",
          type: cardData.type || "Crédito",
          last_digits: cardData.lastDigits || "",
          color: cardData.color || "",
          total_limit: parseFloat(String(cardData.totalLimit).replace(/[^\d.-]/g, '')) || 0,
          available_limit: parseFloat(String(cardData.availableLimit).replace(/[^\d.-]/g, '')) || 0,
          due_day: parseInt(String(cardData.dueDay)) || 10
        };

        const { data, error } = await supabase
          .from('cards')
          .update(cleanUpdatePayload)
          .eq('id', targetId)
          .select();
        
        if (error) throw error;

        if (!data || data.length === 0) {
          toast.error("Erro: Cartão não localizado para atualização.");
          return;
        }

        toast.success("Cartão atualizado!");
      } else {
        const insertPayload = {
          user_id: user.id,
          bank: cardData.bank,
          type: cardData.type,
          last_digits: cardData.lastDigits,
          color: cardData.color,
          total_limit: parseFloat(String(cardData.totalLimit).replace(/[^\d.-]/g, '')) || 0,
          available_limit: parseFloat(String(cardData.availableLimit).replace(/[^\d.-]/g, '')) || 0,
          due_day: parseInt(String(cardData.dueDay)) || 10
        };

        const { error } = await supabase
          .from('cards')
          .insert([insertPayload]);
        
        if (error) throw error;
        toast.success("Cartão adicionado!");
      }
      
      // Forçar a sincronização local após o salvamento
      await fetchData();
    } catch (error: any) {
      console.error("Error saving card:", error);
      toast.error("Erro ao salvar cartão");
    }
  };

  const handleCardDelete = async (id: any) => {
    try {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
      toast.success("Cartão removido!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir cartão");
    }
  };

  const handleRecordConfirm = async (recordData: any) => {
    if (!user) return;
    try {
      const payload = {
        user_id: user.id,
        title: recordData.title,
        description: recordData.description,
        record_type: recordData.recordType,
        tag: recordData.recordType === 'Gasto' ? '#GASTO' : recordData.recordType === 'Ganho' ? '#GANHO' : '#NOTA',
        tag_type: recordData.recordType === 'Gasto' ? 'warning' : 'primary',
        amount: recordData.amount || 0,
        due_date: recordData.due_date,
        total_installments: recordData.installments ? parseInt(recordData.installments.toString().replace('x', '')) : 1,
        paid_installments: editingItem ? editingItem.paid_installments : 0,
        category_id: activeCategoryId // Atribuir ao painel ativo
      };

      if (editingItem) {
        const { error } = await supabase
          .from('finance_records')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success("Registro atualizado!");
      } else {
        const { error } = await supabase
          .from('finance_records')
          .insert([payload]);
        if (error) throw error;
        toast.success("Registro adicionado!");
      }
      setIsDrawerOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      console.error("Error saving record:", error);
      toast.error("Erro ao salvar registro");
    }
  };

  const handleRecordDelete = async () => {
    if (!editingItem) return;
    try {
      const { error } = await supabase.from('finance_records').delete().eq('id', editingItem.id);
      if (error) throw error;
      toast.success("Registro removido!");
      setIsDrawerOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao excluir registro");
    }
  };

  const handlePaymentConfirm = async (itemId: any) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !user) return;

    try {
      const newPaid = (item.paid_installments || 0) + 1;
      const { error } = await supabase
        .from('finance_records')
        .update({
          paid_installments: newPaid,
          is_completed: newPaid >= (item.total_installments || 1)
        })
        .eq('id', item.id);

      if (error) throw error;

      // 1. Materializar a pergunta no histórico para ela não sumir
      await supabase.from('record_comments').insert({
        record_id: item.id,
        content: "Foi pago a fatura do mês?",
        author: 'system',
        user_id: user.id
      });

      // 2. Inserir comentário de confirmação do usuário
      await supabase.from('record_comments').insert({
        record_id: item.id,
        content: `Sim, confirmo o pagamento da parcela ${newPaid}!`,
        author: 'user',
        user_id: user.id
      });

      toast.success(`Pagamento da parcela ${newPaid} confirmado!`);
      fetchData();
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const handleRemoveNotification = (notifId: any) => {
    setDismissedNotifIds(prev => [...prev, String(notifId)]);
    setNotifications(prev => prev.filter(n => String(n.id) !== String(notifId)));
  };

  const handleClearAllNotifications = () => {
    const allIds = notifications.map(n => String(n.id));
    setDismissedNotifIds(prev => [...prev, ...allIds]);
    setNotifications([]);
  };

  const handleNotificationClick = (notif: any) => {
    setActiveTab("Home");
    if (notif.category_id) {
      setActiveCategoryId(notif.category_id);
    }
    setActiveItemId(notif.id);
  };

  const handleBiluAction = async (actionId: string, item: any) => {
    if (!user) return;
    
    if (actionId === 'action_sim') {
      try {
        // Se for uma fatura de cartão (virtual)
        if (String(item.id).startsWith('inv_card_')) {
          await handleSendComment("Foi pago a fatura do mês?", 'system');
          handleSendComment("Ok! Marcado como pago. Não esqueça de confirmar no app do seu banco! 💳", 'system');
          toast.success("Lembrete de fatura concluído");
          return;
        }

        // Se for um item manual (finance_records)
        const currentPaid = item.paid_installments || 0;
        const total = item.total_installments || 1;
        const nextPaid = Math.min(total, currentPaid + 1);
        
        const updateData: any = { paid_installments: nextPaid };
        if (nextPaid >= total) {
          updateData.tag = '#PAGO';
        }

        const { error } = await supabase
          .from('finance_records')
          .update(updateData)
          .eq('id', item.id);
        
        if (error) throw error;
        
        await handleSendComment("Foi pago a fatura do mês?", 'system');
        handleSendComment("Excelente! Já registrei o pagamento no seu cockpit. ✅", 'system');
        toast.success("Pagamento registrado com sucesso!");
        fetchData();
      } catch (e) {
        console.error(e);
        toast.error("Erro ao registrar pagamento automático");
      }
    } else if (actionId === 'action_nao') {
      const itemRecordId = item.id.toString().startsWith('inv_card_') 
        ? item.id.toString().replace('inv_card_', 'e11a5000-0000-0000-0000-0000000000')
        : item.id.toString();
      localStorage.setItem(`snooze_${itemRecordId}`, (Date.now() + 24 * 60 * 60 * 1000).toString());
      handleSendComment("Sem problemas, Comandante! Vou te lembrar novamente amanhã cedo. 👋", 'system');
      toast.info("Lembrete adiado por 24h");
    } else if (actionId === 'action_parte') {
      setPendingPartialItemId(item.id);
      handleSendComment(`Entendido! Qual foi o valor exato que você pagou de "${item.title}" desta vez? Vou abater do seu saldo.`, 'system');
    }
  };

  const handleSendComment = async (content: string, author: 'user' | 'system' = 'user') => {
    const item = allPossibleItems.find(i => String(i.id) === String(activeItemId));
    const commentContent = content.trim();
    if (!item || !user || !commentContent) return;

    const recordId = getRecordIdForComments(item);

    try {
      setIsTyping(true);

      // Lógica de Abatimento Parcial
      if (pendingPartialItemId && author === 'user') {
        const match = content.match(/(\d+[,.]?\d*)/);
        if (match) {
          const valueToAbate = parseFloat(match[1].replace(',', '.'));
          const currentItem = allPossibleItems.find(i => String(i.id) === String(pendingPartialItemId));
          
          if (currentItem && !isNaN(valueToAbate)) {
            const currentAmount = parseFloat(String(currentItem.amount || "0").replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
            const newAmount = Math.max(0, currentAmount - valueToAbate);
            
            setComments(prev => [...prev, {
              id: Date.now(),
              author: 'user',
              content: content,
              created_at: new Date().toISOString()
            }]);

            await supabase.from('finance_records')
              .update({ amount: newAmount })
              .eq('id', currentItem.id);
            
            setPendingPartialItemId(null);
            setTimeout(() => {
              handleSendComment(`Perfeito! Abati R$ ${valueToAbate.toLocaleString('pt-BR')} da sua dívida. O novo saldo devedor é R$ ${newAmount.toLocaleString('pt-BR')}. ✅`, 'system');
              fetchData();
            }, 800);
            return; // Interrompe para não inserir o comentário duplicadamente abaixo
          }
        } else {
          setPendingPartialItemId(null); // Limpa se não encontrou valor numérico
        }
      }

      const { error } = await supabase
        .from('record_comments')
        .insert([{
          record_id: recordId,
          user_id: user.id,
          content: commentContent,
          author: author
        }]);

      if (error) throw error;
      // O Realtime listener cuidará de adicionar o comentário na tela
    } catch (error) {
      setIsTyping(false);
      toast.error("Erro ao enviar comentário");
    }
  };

  const handleUpdateComment = async (commentId: string | number, newContent: string) => {
    const previousComments = [...comments];

    // 1. Atualização Otimista
    setComments(prev => prev.map(c =>
      String(c.id) === String(commentId) ? { ...c, content: newContent } : c
    ));

    try {
      const { error, count } = await supabase
        .from('record_comments')
        .update({ content: newContent })
        .eq('id', commentId)
        .select();

      if (error) throw error;

      // 3. Se for uma ferramenta, não precisamos baixar do banco de novo agora 
      // porque o estado local já está correto e evita "flicker" de dados antigos
      if (!newContent.includes('[TOOL:')) {
        if (activeItemId) await fetchComments(activeItemId);
      } else {
        toast.success("Checklist atualizado");
      }
    } catch (error) {
      setComments(previousComments);
      console.error("Update error:", error);
      toast.error("Erro ao salvar mudança. Revertendo...");
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    const previousComments = [...comments];

    // 1. Otimista: Remove da tela na hora
    setComments(prev => prev.filter(c => String(c.id) !== String(commentId)));

    try {
      const { error } = await supabase
        .from('record_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      setComments(previousComments);
      toast.error("Erro ao remover mensagem");
    }
  };

  const totalAvailableLimit = allCards
    .filter(card => card.type === "Crédito")
    .reduce((sum, card) => {
      return sum + (parseFloat(card.availableLimit) || 0);
    }, 0);

  // --- Lógica de Resumo Financeiro Mensal ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthItems = items.filter(i => {
    if (i.isVirtual) return false;
    const date = i.created_at ? new Date(i.created_at) : new Date();
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalExpenses = currentMonthItems
    .filter(i => i.tag?.includes('#GASTO'))
    .reduce((acc, i) => acc + (parseFloat(i.amount?.replace('R$ ', '').replace('.', '').replace(',', '.') || '0')), 0);

  // Lógica de Salário Recebido
  const isSalaryReceived = now.getDate() >= (profile?.salary_day || 5);
  const salaryValue = (profile?.salary_monthly || 0);

  const totalGanhos = currentMonthItems
    .filter(i => i.tag?.includes('#GANHO'))
    .reduce((acc, i) => acc + (parseFloat(i.amount?.replace('R$ ', '').replace('.', '').replace(',', '.') || '0')), 0)
    + (isSalaryReceived ? salaryValue : 0);

  const totalMonthlyDebt = currentMonthItems
    .filter(i => i.tag?.toLowerCase().includes('fatura') || i.title?.toLowerCase().includes('fatura'))
    .reduce((acc, i) => acc + (parseFloat(i.amount?.replace('R$ ', '').replace('.', '').replace(',', '.') || '0')), 0);
  
  const remainingBalance = totalGanhos - totalExpenses - totalMonthlyDebt;

  const totalGanhosProjetado = totalGanhos + (!isSalaryReceived ? salaryValue : 0);
  // --- Fim da Lógica de Resumo ---

  const [activeTab, setActiveTab] = useState("Home");

  // Categoria virtual de Faturas — cada transação de cada cartão como item
  const VIRTUAL_INVOICES_ID = '__virtual_faturas__';

  // Centraliza a lógica de itens manuais para evitar inconsistências entre seleção e visualização
  const processedItems = items.map(item => {
    const isManualFatura = item.title?.toLowerCase().includes('fatura') || item.tag?.toLowerCase().includes('fatura');
    if (isManualFatura) {
      const day = item.due_date ? new Date(item.due_date).getUTCDate() : null;
      return { 
        ...item, 
        category_id: VIRTUAL_INVOICES_ID,
        summary: item.summary || (day ? `Vencimento todo dia ${day}` : 'Vencimento mensal'),
        date: day ? `Dia ${day}` : item.date
      };
    }
    return item;
  });

  const manualInvoiceItems = processedItems.filter(i => String(i.category_id) === String(VIRTUAL_INVOICES_ID));

  const cardInvoiceItems = allCards
    .filter(card => (card.currentInvoice || 0) > 0)
    .map(card => {
      const now = new Date();
      const dueDay = parseInt(card.dueDay) || 10;
      let dueDateObj = new Date(now.getFullYear(), now.getMonth(), dueDay);
      if (now.getDate() > dueDay) {
        dueDateObj = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
      }
      const isoDueDate = dueDateObj.toISOString().split('T')[0];

      const calculateRelativeDate = (targetDateStr: string) => {
        const target = new Date(targetDateStr);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Hoje";
        if (diffDays < 0) return "Vencido";
        return `${diffDays} dias`;
      };

      return {
        id: `inv_card_${card.id}`,
        title: `Fatura ${card.bank}`,
        summary: `Vencimento todo dia ${dueDay}`,
        tag: '#FATURA',
        tagType: 'warning' as const,
        date: calculateRelativeDate(isoDueDate),
        due_date: isoDueDate,
        amount: `R$ ${card.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        isVirtual: true,
        category_id: VIRTUAL_INVOICES_ID,
        cardId: card.id
      } as import("@/components/finance/NotesPanel").ListItem;
    });

  const allInvoiceItems = [...manualInvoiceItems, ...cardInvoiceItems];
  const hasAnyInvoice = allCards.some(c => (c.currentInvoice || 0) > 0) || allInvoiceItems.length > 0;

  const virtualInvoiceCategory = hasAnyInvoice ? {
    id: VIRTUAL_INVOICES_ID,
    name: 'Faturas',
    background_url: 'linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(59,130,246,0.3) 100%)',
    count: allInvoiceItems.length,
    isVirtual: true,
  } : null;

  const allCategories = (virtualInvoiceCategory
    ? [virtualInvoiceCategory, ...categories]
    : categories)
    .sort((a, b) => {
      // Prioridade máxima para Faturas
      if (a.id === VIRTUAL_INVOICES_ID) return -1;
      if (b.id === VIRTUAL_INVOICES_ID) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(cat => {
      if (cat.isVirtual) return cat;

      // Calcular contagem em tempo real
      const isGanhos = cat.name?.toLowerCase() === 'ganhos';
      const salaryCount = (isGanhos && (profile?.salary_monthly || 0) > 0) ? 1 : 0;

      const count = processedItems.filter(i =>
        String(i.category_id) === String(cat.id)
      ).length + salaryCount;

      return { ...cat, count };
    });

  const activeIsVirtual = activeCategoryId === VIRTUAL_INVOICES_ID;

  // Detectar se a categoria ativa é a de "Ganhos"
  const activeCategory = allCategories.find(c => String(c.id) === String(activeCategoryId));
  const isGanhosCategory = !activeIsVirtual && activeCategory &&
    activeCategory.name?.toLowerCase() === 'ganhos';

  // Item virtual de Salário — aparece como primeiro item na categoria de Ganhos
  const salaryItem: import("@/components/finance/NotesPanel").ListItem | null = (isGanhosCategory && (profile?.salary_monthly || 0) > 0) ? {
    id: '__salary_virtual__',
    title: 'Salário',
    summary: `Recebido todo dia ${profile?.salary_day || 5}`,
    tag: '#SALÁRIO',
    tagType: 'primary',
    date: (() => {
      const now = new Date();
      const day = profile?.salary_day || 5;
      let next = new Date(now.getFullYear(), now.getMonth(), day);
      if (now.getDate() > day) next = new Date(now.getFullYear(), now.getMonth() + 1, day);
      const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : `em ${diff} dias`;
    })(),
    amount: `R$ ${(profile?.salary_monthly || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    isVirtual: true,
    category_id: activeCategoryId || undefined,
  } : null;

  const allPossibleItems = [
    ...processedItems.filter(i => !allInvoiceItems.find(inv => inv.id === i.id)), 
    ...allInvoiceItems,
    ...(salaryItem ? [salaryItem] : [])
  ];

  // Adicionar o Reset de Seleção que GARANTE consistência
  useEffect(() => {
    if (activeTab === "Home" && activeCategoryId) {
      const itemsInThisCat = allPossibleItems.filter(i => String(i.category_id) === String(activeCategoryId));
      const totalInCat = itemsInThisCat.length;

      if (totalInCat > 0) {
        const currentStillExists = itemsInThisCat.some(i => i.id === activeItemId);
        if (!currentStillExists) {
          setActiveItemId(itemsInThisCat[0].id);
        }
      } else {
        setActiveItemId(0);
      }
    }
  }, [activeCategoryId, activeTab, allPossibleItems.length]);

  const selectedItem = allPossibleItems.find((i) => String(i.id) === String(activeItemId));

  const baseItems = activeIsVirtual
    ? allInvoiceItems
    : processedItems.filter(item =>
        String(item.category_id) === String(activeCategoryId)
      );

  const panelItems = salaryItem ? [salaryItem, ...baseItems] : baseItems;

  return (
    <div className="h-screen bg-background p-4 flex gap-4 overflow-hidden relative text-white">
      {/* Wallpaper removido para teste de blur */}
      <div className="relative z-10 w-full h-full flex gap-4 pointer-events-auto">
      <ActionPanel
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setEditingItem(null);
          }}
          isEdit={!!editingItem}
          initialData={editingItem}
          onDelete={handleRecordDelete}
          onConfirm={handleRecordConfirm}
        />
        <CategoryActionPanel
          isOpen={isCategoryDrawerOpen}
          onClose={() => {
            setIsCategoryDrawerOpen(false);
            setEditingCategory(null);
          }}
          isEdit={!!editingCategory}
          initialData={editingCategory}
          onDelete={async (id) => {
            if (!confirm("Tem certeza que deseja excluir esta categoria? Todos os registros nela continuarão existindo, mas sem categoria.")) return;
            try {
              const { error } = await supabase.from('categories').delete().eq('id', id);
              if (error) throw error;
              toast.success("Categoria excluída!");
              setIsCategoryDrawerOpen(false);
              setEditingCategory(null);
              fetchData();
            } catch (e) {
              console.error(e);
              toast.error("Erro ao excluir categoria.");
            }
          }}
          onConfirm={async (data) => {
            if (!user) return;
            try {
              if (editingCategory) {
                const { error } = await supabase.from('categories').update(data).eq('id', editingCategory.id);
                if (error) throw error;
                toast.success("Categoria atualizada!");
              } else {
                const { error } = await supabase.from('categories').insert([{ ...data, user_id: user.id }]);
                if (error) throw error;
                toast.success("Categoria criada com sucesso!");
              }
              setIsCategoryDrawerOpen(false);
              setEditingCategory(null);
              fetchData();
            } catch (e) {
              console.error(e);
              toast.error("Erro ao processar categoria.");
            }
          }}
        />
        <CardActionPanel
          isOpen={isCardDrawerOpen}
          onClose={() => {
            setIsCardDrawerOpen(false);
            setEditingCard(null);
          }}
          onConfirm={handleCardConfirm}
          initialData={editingCard}
        />

        <nav className="fixed left-1/2 -translate-x-1/2 top-6 bg-white/5 backdrop-blur-xl rounded-2xl p-1 flex gap-1 z-50 transition-all duration-500 hover:bg-white/10">
          {["Home", "Cartões", "Dashboard", "Agenda", "Perfil"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative ${isActive
                  ? "text-white bg-white/10"
                  : "text-muted-foreground hover:text-white"
                  }`}
              >
                {tab}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <SidebarPanel
          activeNav={activeNav}
          onNavChange={setActiveNav}
          salary={profile?.salary_monthly || 0}
          totalLimits={totalAvailableLimit}
          totalExpenses={totalExpenses}
          isBiluEnabled={localIsBiluEnabled}
          onBiluToggle={handleBiluToggle}
          userPhoto={profile?.avatar_url}
          userName={profile?.full_name}
          onAddCategoryClick={() => setIsCategoryDrawerOpen(true)}
          notifications={notifications}
          hasUnreadNotifications={hasUnreadNotifications}
          onViewNotifications={() => setHasUnreadNotifications(false)}
          onRemoveNotification={handleRemoveNotification}
          onClearAllNotifications={handleClearAllNotifications}
          onNotificationClick={handleNotificationClick}
          onAddItemClick={() => {
            if (!activeCategoryId) {
              toast.error("Selecione ou crie uma categoria primeiro!");
              return;
            }
            setEditingItem(null);
            setIsDrawerOpen(true);
          }}
        />

        <div className="flex-1 flex flex-col gap-4">
          <header className="px-4 py-2 flex items-center justify-end min-h-[56px]">
            <UserNav />
          </header>

          {activeTab === "Home" && (
            <div className="flex gap-4 flex-1 overflow-hidden">
              <CategoryPanel
                categories={allCategories}
                activeId={activeCategoryId}
                onSelect={(id) => {
                  setActiveCategoryId(id);
                  if (id === VIRTUAL_INVOICES_ID) {
                    setActiveItemId(allInvoiceItems[0]?.id || 0);
                  } else {
                    const firstOfCat = processedItems.find(i => String(i.category_id) === String(id));
                    setActiveItemId(firstOfCat ? firstOfCat.id : 0);
                  }
                }}
                onCreateClick={() => {
                  setEditingCategory(null);
                  setIsCategoryDrawerOpen(true);
                }}
                onEditClick={(id) => {
                  const cat = categories.find(c => String(c.id) === String(id));
                  if (cat) {
                    setEditingCategory(cat);
                    setIsCategoryDrawerOpen(true);
                  }
                }}
              />
              <NotesPanel
                items={panelItems}
                activeId={activeItemId}
                activeColor={activeCategory?.background_url}
                onSelect={activeIsVirtual ? undefined : setActiveItemId}
                onCreateClick={activeIsVirtual ? undefined : () => {
                  if (!activeCategoryId) {
                    toast.error("Selecione ou crie uma categoria primeiro!");
                    return;
                  }
                  setEditingItem(null);
                  setIsDrawerOpen(true);
                }}
              />
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <DetailPanel
                  item={selectedItem}
                  comments={comments}
                  userAvatar={profile?.avatar_url}
                  isTyping={isTyping}
                  isBiluEnabled={localIsBiluEnabled}
                  onConfirmPayment={handlePaymentConfirm}
                  onSendComment={handleSendComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  onDeleteAllComments={async () => {
                    if (!selectedItem) return;
                    const recordId = getRecordIdForComments(selectedItem);
                    const { error } = await supabase
                      .from('record_comments')
                      .delete()
                      .eq('record_id', recordId);
                    
                    if (error) {
                      console.error("Delete error:", error);
                      toast.error("Erro ao limpar histórico");
                    } else {
                      toast.success("Histórico limpo!");
                      setComments([]);
                      fetchData();
                    }
                  }}
                  onAction={handleBiluAction}
                  onEditClick={(item) => {
                    setEditingItem(item);
                    setIsDrawerOpen(true);
                  }}
                />
              </div>
              {/* Coluna da Direita: Spotify (Topo) + Cartões (Base) */}
              <div className="flex flex-col gap-4 w-80 shrink-0 h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <SpotifyCard />
                <CardsPanel
                  cards={allCards}
                  salary={profile?.salary_monthly || 0}
                  salaryDay={profile?.salary_day || 5}
                  totalLimits={totalAvailableLimit}
                  totalExpenses={totalExpenses}
                  totalGanhos={totalGanhos}
                  onAddClick={() => {
                    setEditingCard(null);
                    setIsCardDrawerOpen(true);
                  }}
                  onEditClick={(card) => {
                    setEditingCard(card);
                    setIsCardDrawerOpen(true);
                  }}
                  onDeleteClick={async (id) => {
                    const { error } = await supabase.from('cards').delete().eq('id', id);
                    if (error) toast.error("Erro ao excluir cartão");
                    else {
                      toast.success("Cartão excluído");
                      fetchData();
                    }
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === "Cartões" && (
            <CardsPage
              cards={allCards}
              onAddClick={() => {
                setEditingCard(null);
                setIsCardDrawerOpen(true);
              }}
              onEditClick={(card) => {
                setEditingCard(card);
                setIsCardDrawerOpen(true);
              }}
              onDataSync={() => fetchData()}
              onTransactionsLoaded={(cardId, txs) => {
                setCardTransactions(prev => ({ ...prev, [cardId]: txs }));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
