import { useState } from "react";
import { Plus, Search, CreditCard, ChevronDown, TrendingUp } from "lucide-react";

export interface ListItem {
  id: number | string;
  title: string;
  summary: string;
  tag: string;
  tagType: "warning" | "primary" | string;
  date: string;
  due_date?: string;
  paid_installments?: number;
  total_installments?: number;
  amount?: string;
  category_id?: string;
  isVirtual?: boolean;
  cardId?: string;
}

interface NotesPanelProps {
  items: ListItem[];
  activeId?: number | string;
  onSelect?: (id: number | string) => void;
  onCreateClick?: () => void;
  activeColor?: string;
}

// Agrupa itens pelo título (case-insensitive, trim) — exclui itens virtuais especiais
function groupItems(items: ListItem[]): { key: string; items: ListItem[] }[] {
  const map = new Map<string, ListItem[]>();
  for (const item of items) {
    if (item.id === '__salary_virtual__') continue; // tratado separadamente
    const key = item.title.toLowerCase().trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

const PEEK = 12; // px visível de cada fantasma abaixo do card

const TagBadge = ({ tag, isActive }: { tag: string; isActive: boolean }) => {
  const upperTag = tag.toUpperCase();
  const isIncome = upperTag.includes('SALÁRIO') || upperTag.includes('GANHO') || upperTag.includes('RECEBIDO');
  const isExpense = upperTag.includes('GASTO') || upperTag.includes('DESPESA') || upperTag.includes('PAGAR') || upperTag.includes('DÍVIDA');

  const colorClasses = isActive 
    ? "bg-white/20 text-white" 
    : isIncome 
      ? "bg-success/10 text-success" 
      : isExpense 
        ? "bg-red-500/10 text-red-400" 
        : "bg-primary/10 text-primary";

  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClasses}`}>
      {tag}
    </span>
  );
};

const SingleItem = ({
  item,
  isActive,
  onSelect,
  activeColor,
}: {
  item: ListItem;
  isActive: boolean;
  onSelect?: (id: number | string) => void;
  activeColor?: string;
}) => {
  const isSalary = item.id === '__salary_virtual__';

  return (
    <div
      onClick={() => onSelect?.(item.id)}
      className={`group p-4 rounded-2xl transition-all duration-300 cursor-pointer ${isActive ? (activeColor ? "" : "gradient-active") : isSalary ? "bg-[#4ade80]/10" : "bg-surface-elevated hover:bg-secondary"}`}
      style={isActive && activeColor ? { background: activeColor } : {}}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          {isSalary && <TrendingUp size={14} className="text-[#4ade80]/70 shrink-0" />}
          <h3 className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : isSalary ? "text-[#4ade80]" : "text-secondary-foreground group-hover:text-foreground"}`}>
            {item.title}
          </h3>
        </div>
        <span className={`text-[10px] font-medium pt-0.5 shrink-0 ml-2 ${isActive ? "text-white/60" : isSalary ? "text-[#4ade80]/50" : "text-muted-foreground"}`}>
          {item.date}
        </span>
      </div>

      {item.summary && (
        <p className={`text-xs leading-relaxed mb-3 line-clamp-2 ${isActive ? "text-white/80" : isSalary ? "text-[#4ade80]/40" : "text-muted-foreground"}`}>
          {item.summary}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <TagBadge tag={item.tag} isActive={isActive} />
        <div className="flex items-center gap-2 ml-auto">
          {item.amount && (
            <span className={`text-xs font-bold ${isActive ? "text-white" : isSalary ? "text-[#4ade80]" : "text-secondary-foreground"}`}>
              {item.amount}
            </span>
          )}
          {item.isVirtual && !isSalary && <CreditCard size={11} className="text-white/30" />}
        </div>
      </div>
    </div>
  );
};

interface GroupedDeckProps {
  group: { key: string; items: ListItem[] };
  isExpanded: boolean;
  activeId?: number | string;
  onToggle: () => void;
  onSelect?: (id: number | string) => void;
  activeColor?: string;
}

const calculateTotal = (items: ListItem[]) => {
  const total = items.reduce((acc, item) => {
    if (!item.amount) return acc;
    // Remove tudo exceto dígitos, vírgula, ponto e sinal de menos
    const cleanAmount = item.amount
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=\d{3},)/g, '') // Remove pontos de milhar
      .replace(',', '.'); // Troca vírgula por ponto decimal

    const val = parseFloat(cleanAmount);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(total);
};

const GroupedDeck = ({ group, isExpanded, activeId, onToggle, onSelect, activeColor }: GroupedDeckProps) => {
  const topItem = group.items[0];
  const extra = group.items.length - 1; // quantos estão ocultos
  const hasActive = group.items.some((i) => i.id === activeId);
  const ghostCount = extra >= 2 ? 2 : extra >= 1 ? 1 : 0;

  if (isExpanded) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-1 py-0.5 text-white/40 hover:text-white/70 transition-colors text-left outline-none animate-in fade-in slide-in-from-top-2 duration-500"
        >
          <ChevronDown size={12} className="transition-transform duration-300 transform rotate-180" />
          <span className="text-[9px] font-bold uppercase tracking-widest">
            {group.items.length}x {topItem.title}
          </span>
        </button>
        {group.items.map((item, index) => (
          <div
            key={item.id}
            className="animate-in fade-in slide-in-from-top-8 duration-700 ease-out"
            style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'both' }}
          >
            <SingleItem item={item} isActive={item.id === activeId} onSelect={onSelect} activeColor={activeColor} />
          </div>
        ))}
      </div>
    );
  }

  // ESTADO COLAPSADO — mesma lógica das categorias: altura fixa + posicionamento absoluto
  const ITEM_H = 84;
  const ITEM_PEEK = 12;
  const wrapperH = ITEM_H + ghostCount * ITEM_PEEK;

  return (
    <div
      className="relative cursor-pointer shrink-0"
      style={{ height: `${wrapperH}px` }}
      onClick={() => {
        if (group.items.length === 1) {
          onSelect?.(topItem.id);
        } else {
          onToggle();
          onSelect?.(topItem.id);
        }
      }}
    >
      {/* Fantasma 2 — mais fundo */}
      {ghostCount >= 2 && (
        <div
          className="absolute rounded-2xl pointer-events-none bg-surface-elevated"
          style={{
            top: `${ITEM_PEEK * 2}px`,
            left: "4%",
            right: "4%",
            height: `${ITEM_H}px`,
            opacity: 0.5,
            zIndex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.03)"
          }}
        />
      )}

      {/* Fantasma 1 — meio fundo */}
      {ghostCount >= 1 && (
        <div
          className="absolute rounded-2xl pointer-events-none bg-surface-elevated"
          style={{
            top: `${ITEM_PEEK}px`,
            left: "2%",
            right: "2%",
            height: `${ITEM_H}px`,
            opacity: 0.85,
            zIndex: 2,
            backgroundColor: "rgba(255, 255, 255, 0.03)"
          }}
        />
      )}

      {/* Card principal — sempre no topo, altura fixa, overflow hidden */}
      <div
        className={`absolute inset-x-0 top-0 p-4 rounded-2xl overflow-hidden transition-all duration-300 ${hasActive ? (activeColor ? "" : "gradient-active") : "bg-surface-elevated hover:bg-secondary"
          }`}
        style={{ 
          height: `${ITEM_H}px`, 
          zIndex: 3,
          background: hasActive && activeColor ? activeColor : undefined
        }}
      >
        <div className="flex items-start justify-between mb-1.5">
          <h3 className={`text-sm font-semibold leading-tight ${hasActive ? "text-white" : "text-secondary-foreground"}`}>
            {topItem.title}
          </h3>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {extra > 0 && (
              <span className="text-[9px] bg-white/10 text-white/60 font-bold px-1.5 py-0.5 rounded-full">
                +{extra}
              </span>
            )}
            <span className={`text-[10px] font-medium ${hasActive ? "text-white/60" : "text-muted-foreground"}`}>
              {topItem.date}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <TagBadge tag={topItem.tag} isActive={hasActive} />
          <span className={`text-xs font-bold ml-auto ${hasActive ? "text-white" : "text-secondary-foreground"}`}>
            {calculateTotal(group.items)}
            {extra > 0 && <span className="text-white/30 text-[9px] ml-1">total</span>}
          </span>
        </div>
      </div>
    </div>
  );
};

const NotesPanel = ({ items, activeId, onSelect, onCreateClick, activeColor }: NotesPanelProps) => {
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const filtered = search.trim()
    ? items.filter((i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.summary || "").toLowerCase().includes(search.toLowerCase())
    )
    : items;

  // Separar o item de salário virtual dos outros
  const salaryVirtualItem = filtered.find(i => i.id === '__salary_virtual__');
  const groups = groupItems(filtered);

  const toggleGroup = (key: string) => {
    setExpandedGroup((prev) => (prev === key ? null : key));
  };

  return (
    <div className="w-80 h-full bg-white/[0.05] backdrop-blur-xl rounded-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Search & Add */}
      <div className="p-5 pb-2">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar itens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-1 focus:ring-primary/50 transition"
            />
          </div>
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="w-10 h-10 bg-white/5 text-muted-foreground rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all shrink-0"
              title="Criar item"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 px-5 pb-5 space-y-3 overflow-y-auto hide-scrollbar">
        {salaryVirtualItem && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <SingleItem item={salaryVirtualItem} isActive={false} onSelect={undefined} activeColor={activeColor} />
          </div>
        )}

        {groups.map(({ key, items: groupItems }, index) => {
          const isSingle = groupItems.length === 1;
          const isExpanded = expandedGroup === key;

          const animationStyle = { animationDelay: `${index * 50}ms`, animationFillMode: 'both' as const };
          const animationClass = "animate-in fade-in slide-in-from-top-4 duration-500";

          if (isSingle) {
            return (
              <div key={groupItems[0].id} className={animationClass} style={animationStyle}>
                  <SingleItem
                    item={groupItems[0]}
                    isActive={groupItems[0].id === activeId}
                    onSelect={onSelect}
                    activeColor={activeColor}
                  />
              </div>
            );
          }

          return (
            <div key={key} className={animationClass} style={animationStyle}>
              <GroupedDeck
                group={{ key, items: groupItems }}
                isExpanded={isExpanded}
                activeId={activeId}
                onToggle={() => toggleGroup(key)}
                onSelect={onSelect}
              />
            </div>
          );
        })}

        {groups.length === 0 && !salaryVirtualItem && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/30">
            <Plus size={40} className="mb-2 opacity-10" />
            <p className="text-xs uppercase tracking-widest font-bold">Vazio</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
