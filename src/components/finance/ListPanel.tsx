import { Search } from "lucide-react";

interface ListItem {
  id: number;
  title: string;
  summary: string;
  tag: string;
  tagType: "warning" | "primary";
  date: string;
  amount?: string;
}

const items: ListItem[] = [
  {
    id: 1,
    title: "Planejamento Financeiro - Dezembro",
    summary: "Revisão completa do orçamento anual e metas...",
    tag: "#URGENTE",
    tagType: "warning",
    date: "28 Mar",
    amount: "R$ 2.400,00",
  },
  {
    id: 2,
    title: "Pagamento Aluguel",
    summary: "Transferência mensal do aluguel do apartamento...",
    tag: "#DESPESA",
    tagType: "warning",
    date: "25 Mar",
    amount: "R$ 1.800,00",
  },
  {
    id: 3,
    title: "Freelance - Projeto App",
    summary: "Receita do projeto de desenvolvimento mobile...",
    tag: "#RECEITA",
    tagType: "primary",
    date: "22 Mar",
    amount: "R$ 5.000,00",
  },
  {
    id: 4,
    title: "Lista de Compras Mensais",
    summary: "Supermercado, farmácia e produtos de limpeza...",
    tag: "#NOTA",
    tagType: "primary",
    date: "20 Mar",
  },
  {
    id: 5,
    title: "Investimento Renda Fixa",
    summary: "Aplicação em CDB 120% CDI no banco...",
    tag: "#INVESTIMENTO",
    tagType: "primary",
    date: "18 Mar",
    amount: "R$ 3.000,00",
  },
];

const filters = ["Todas", "Abertas", "Concluídas"];

interface ListPanelProps {
  activeId: number;
  onSelect: (id: number) => void;
}

const ListPanel = ({ activeId, onSelect }: ListPanelProps) => {
  return (
    <div className="w-80 shrink-0 bg-card rounded-3xl p-5 flex flex-col gap-4 border border-border overflow-hidden">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar notas e transações..."
          className="w-full bg-surface-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-1 focus:ring-primary/50 transition"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              i === 0
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
              className={`text-left p-4 rounded-2xl transition-all ${
                isActive
                  ? "gradient-active shadow-lg shadow-purple-500/20 scale-[1.02]"
                  : "bg-surface-elevated hover:bg-secondary"
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <h3
                  className={`text-sm font-semibold leading-tight ${
                    isActive ? "text-foreground" : "text-secondary-foreground"
                  }`}
                >
                  {item.title}
                </h3>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {item.date}
                </span>
              </div>
              <p
                className={`text-xs leading-relaxed mb-2 ${
                  isActive ? "text-foreground/80" : "text-muted-foreground"
                }`}
              >
                {item.summary}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
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
                    className={`text-xs font-semibold ${
                      isActive ? "text-foreground" : "text-secondary-foreground"
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
export { items };
export type { ListItem };
