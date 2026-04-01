import { Search, Plus } from "lucide-react";

interface ListItem {
  id: number;
  title: string;
  summary: string;
  tag: string;
  tagType: "warning" | "primary";
  date: string;
  amount?: string;
}

const filters = ["Todas", "Abertas", "Concluídas"];

interface ListPanelProps {
  items: ListItem[];
  activeId: number;
  onSelect: (id: number) => void;
  onCreateClick: () => void;
}

const ListPanel = ({ items, activeId, onSelect, onCreateClick }: ListPanelProps) => {
  return (
    <div className="w-80 shrink-0 bg-card rounded-3xl p-5 flex flex-col gap-4 overflow-hidden">
      {/* Search & Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar notas..."
            className="w-full bg-surface-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>
        <button
          onClick={onCreateClick}
          className="w-10 h-10 bg-white/5 text-muted-foreground rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all shrink-0"
          title="Criar novo"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${i === 0
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin flex-1 -mr-2 pr-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`text-left p-4 rounded-2xl transition-all ${isActive
                ? "gradient-active"
                : "bg-surface-elevated hover:bg-secondary"
                }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <h3
                  className={`text-sm font-semibold leading-tight ${isActive ? "text-foreground" : "text-secondary-foreground"
                    }`}
                >
                  {item.title}
                </h3>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {item.date}
                </span>
              </div>
              <p
                className={`text-xs leading-relaxed mb-2 ${isActive ? "text-foreground/80" : "text-muted-foreground"
                  }`}
              >
                {item.summary}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive
                    ? "bg-tag-warning text-tag-warning-foreground"
                    : item.tagType === "warning"
                      ? "bg-tag-warning/20 text-tag-warning"
                      : "bg-primary/20 text-primary"
                    }`}
                >
                  {item.tag}
                </span>
                {item.amount && (
                  <span
                    className={`text-xs font-semibold ${isActive ? "text-foreground" : "text-secondary-foreground"
                      }`}
                  >
                    {item.amount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ListPanel;
export type { ListItem };
