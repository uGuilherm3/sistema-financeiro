import { useState, useEffect, useRef } from "react";
import { Search, Plus, CreditCard, Pencil } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  background_url?: string;
  count?: number;
  isVirtual?: boolean;
}

interface CategoryPanelProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
}

// Renderiza o background do card (imagem, gradiente ou default)
const CardBackground = ({ cat }: { cat: Category }) => {
  if (cat.isVirtual) {
    return <div className="absolute inset-0 bg-gradient-to-br from-violet-500/40 via-purple-600/25 to-blue-600/25" />;
  }
  if (cat.background_url) {
    if (cat.background_url.startsWith("http") || cat.background_url.startsWith("data:")) {
      return <img src={cat.background_url} alt="" className="absolute inset-0 w-full h-full object-cover" />;
    }
    return <div className="absolute inset-0 w-full h-full" style={{ background: cat.background_url }} />;
  }
  return <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />;
};

const CARD_H = 144; // h-36 em px
const PEEK_PX = 10; // quantos px de cada fantasma aparecem abaixo

const CategoryPanel = ({ categories, activeId, onSelect, onCreateClick, onEditClick }: CategoryPanelProps) => {
  const [search, setSearch] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const filtered = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const handleSelect = (id: string) => {
    onSelect(id);
    
    // Inicia timer de 5 segundos para o botão de editar
    setShowEdit(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowEdit(false);
    }, 5000);
  };

  // Limpa timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="w-80 shrink-0 bg-white/[0.05] backdrop-blur-xl rounded-3xl flex flex-col gap-4 overflow-hidden p-5">
      {/* Search & Add */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 transition-all">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
        
        {showEdit && (
          <button
            onClick={() => onEditClick(activeId || "")}
            className="w-10 h-10 bg-white/5 text-muted-foreground rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all shrink-0 border-none outline-none animate-in slide-in-from-right-4 fade-in duration-300"
            title="Editar Categoria"
          >
            <Pencil size={18} />
          </button>
        )}

        <button
          onClick={onCreateClick}
          className="w-10 h-10 bg-white/5 text-muted-foreground rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all shrink-0 border-none outline-none"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto hide-scrollbar flex-1 -mr-2 pr-2 pb-2">
        {filtered.map((cat) => {
          const isActive = cat.id === activeId;
          const count = cat.count || 0;
          const ghostCount = count === 0 ? 0 : count < 3 ? 1 : 2;
          // wrapper precisa de espaço para os fantasmas "orelha"
          const wrapperHeight = CARD_H + ghostCount * PEEK_PX;

          return (
            <div
              key={cat.id}
              className="relative shrink-0"
              style={{ height: `${wrapperHeight}px` }}
            >
              {/* Fantasma 2 — mais fundo */}
              {ghostCount >= 2 && (
                <div
                  className="absolute rounded-3xl overflow-hidden pointer-events-none"
                  style={{
                    top: `${PEEK_PX * 2}px`,
                    left: "4%",
                    right: "4%",
                    height: `${CARD_H}px`,
                    opacity: 0.4,
                    zIndex: 1,
                  }}
                >
                  <CardBackground cat={cat} />
                </div>
              )}

              {/* Fantasma 1 — meio fundo */}
              {ghostCount >= 1 && (
                <div
                  className="absolute rounded-3xl overflow-hidden pointer-events-none"
                  style={{
                    top: `${PEEK_PX}px`,
                    left: "2%",
                    right: "2%",
                    height: `${CARD_H}px`,
                    opacity: 0.75,
                    zIndex: 2,
                  }}
                >
                  <CardBackground cat={cat} />
                </div>
              )}

              {/* Card principal — sempre no topo */}
              <button
                onClick={() => handleSelect(cat.id)}
                className={`absolute inset-x-0 top-0 rounded-3xl overflow-hidden group transition-all duration-300 border-none outline-none ${isActive
                  ? ""
                  : "hover:brightness-110"
                  }`}
                style={{ height: `${CARD_H}px`, zIndex: 3 }}
              >
                <CardBackground cat={cat} />

                {/* Label */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/20 backdrop-blur-xl px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    {cat.isVirtual && <CreditCard size={12} className="text-white/60 shrink-0" />}
                    <h3 className="text-sm font-medium text-white tracking-tight truncate pr-2">
                      {cat.name}
                    </h3>
                  </div>
                  {cat.count !== undefined && (
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/50 shrink-0">
                      {cat.count} {cat.count === 1 ? "item" : "itens"}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/30">
            <p className="text-xs uppercase tracking-widest font-bold">Sem categorias</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPanel;
