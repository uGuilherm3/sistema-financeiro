import { useState, useEffect } from "react";
import SidebarPanel from "@/components/finance/SidebarPanel";
import ListPanel, { ListItem } from "@/components/finance/ListPanel";
import DetailPanel from "@/components/finance/DetailPanel";
import ActionPanel from "@/components/finance/ActionPanel";
import CardActionPanel from "@/components/finance/CardActionPanel";
import NotesPanel from "@/components/finance/NotesPanel";
import { UserNav } from "@/components/finance/UserNav";
import SpotifyCard from "@/components/finance/SpotifyCard";
import { useSpotify } from "@/hooks/useSpotify";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import CardsPanel from "@/components/finance/CardsPanel";

const Index = () => {
  const { handleAuthCallback } = useSpotify();
  const { profile, user } = useAuth();
  const [activeNav, setActiveNav] = useState("Visão Geral");
  const [activeItemId, setActiveItemId] = useState<number | string>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCardDrawerOpen, setIsCardDrawerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [allCards, setAllCards] = useState<any[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        .eq('user_id', user.id);

      if (cardsError) throw cardsError;

      setAllCards(cardsData?.map(c => ({
        id: c.id,
        bank: c.bank || "Desconhecido",
        type: c.type || "Crédito",
        lastDigits: c.last_digits || "****",
        color: c.color || "bg-primary",
        totalLimit: c.total_limit?.toString() || "0",
        availableLimit: c.available_limit?.toString() || "0"
      })) || []);

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
        tag: r.tag || (r.record_type === 'Gasto' ? '#GASTO' : '#NOTA'),
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
        due_date: r.due_date
      })) || [];

      setItems(newItems);

      if (newItems.length > 0 && (activeItemId === 0 || activeItemId === "0")) {
        setActiveItemId(newItems[0].id);
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
    }
  }, [user]);

  const handleCardConfirm = async (cardData: any) => {
    if (!user) return;
    try {
      const payload = {
        user_id: user.id,
        bank: cardData.bank,
        type: cardData.type,
        last_digits: cardData.lastDigits,
        color: cardData.color,
        total_limit: parseFloat(cardData.totalLimit) || 0,
        available_limit: parseFloat(cardData.availableLimit) || 0
      };

      if (editingCard) {
        const { error } = await supabase
          .from('cards')
          .update(payload)
          .eq('id', editingCard.id);
        if (error) throw error;
        toast.success("Cartão atualizado!");
      } else {
        const { error } = await supabase
          .from('cards')
          .insert([payload]);
        if (error) throw error;
        toast.success("Cartão adicionado!");
      }
      fetchData();
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
        tag: `#${recordData.recordType.toUpperCase()}`,
        tag_type: recordData.recordType === 'Gasto' ? 'warning' : 'primary',
        amount: recordData.amount || 0
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

  const totalAvailableLimit = allCards
    .filter(card => card.type === "Crédito")
    .reduce((sum, card) => {
      return sum + (parseFloat(card.availableLimit) || 0);
    }, 0);

  const totalExpenses = items
    .filter(item => item.tag?.includes("GASTO") || item.tag?.includes("DESPESA"))
    .reduce((sum, item) => {
      if (!item.amount) return sum;
      const amountStr = item.amount.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
      return sum + (parseFloat(amountStr) || 0);
    }, 0);

  const selectedItem = items.find((i) => i.id === activeItemId);

  const [activeTab, setActiveTab] = useState("Home");

  return (
    <div className="h-screen bg-background p-4 flex gap-4 overflow-hidden relative">
      {/* Drawers */}
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
      <CardActionPanel
        isOpen={isCardDrawerOpen}
        onClose={() => {
          setIsCardDrawerOpen(false);
          setEditingCard(null);
        }}
        onConfirm={handleCardConfirm}
        initialData={editingCard}
      />

      <nav className="fixed left-1/2 -translate-x-1/2 top-6 bg-white/5 backdrop-blur-md rounded-2xl p-1 flex gap-1 shadow-2xl z-50">
        {["Home", "Dashboard", "Agenda"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative ${isActive
                ? "text-white bg-white/10 shadow-sm"
                : "text-muted-foreground hover:text-white"
                }`}
            >
              {tab}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
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
      />

      <div className="flex-1 flex flex-col gap-4">
        <header className="px-4 py-2 flex items-center justify-end min-h-[56px]">
          <UserNav />
        </header>

        <div className="flex gap-4 flex-1 overflow-hidden">
          <ListPanel
            items={items.filter(item => !item.tag?.includes("NOTA"))}
            activeId={activeItemId as any}
            onSelect={setActiveItemId}
            onCreateClick={() => setIsDrawerOpen(true)}
          />
          <div className="flex-1 flex gap-4 min-w-0">
            <div className="flex-1 flex flex-col gap-3 min-w-0 mt-12">
              <div className="px-1 py-1 flex items-baseline">
                <h1 className="text-3xl font-medium text-white tracking-tight">
                  Olá, {profile?.full_name?.split(' ')[0] || "Comandante"}!
                  <span className="ml-3 text-white/80">O que vamos fazer hoje?</span>
                </h1>
              </div>
              <DetailPanel
                item={selectedItem}
                onEditClick={(item) => {
                  setEditingItem(item);
                  setIsDrawerOpen(true);
                }}
              />
            </div>
            <NotesPanel items={items} onCreateClick={() => setIsDrawerOpen(true)} />
          </div>
          <div className="flex flex-col gap-4 w-80 shrink-0 h-full">
            <div className="shrink-0 w-full text-center">
              <SpotifyCard />
            </div>
            <CardsPanel
              cards={allCards}
              onAddClick={() => {
                setEditingCard(null);
                setIsCardDrawerOpen(true);
              }}
              onEditClick={(card) => {
                setEditingCard(card);
                setIsCardDrawerOpen(true);
              }}
              onDeleteClick={handleCardDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
