import { MoreHorizontal, Paperclip, Image, Send, Calendar, Tag } from "lucide-react";
import type { ListItem } from "./ListPanel";

interface DetailPanelProps {
  item: ListItem | undefined;
}

const DetailPanel = ({ item }: DetailPanelProps) => {
  if (!item) {
    return (
      <div className="flex-1 bg-card rounded-3xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Selecione um item para visualizar</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-card rounded-3xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">{item.title}</h1>
          <button className="p-2 rounded-xl hover:bg-secondary transition text-muted-foreground">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {item.date}, 2026
          </span>
          <span className="flex items-center gap-1.5">
            <Tag size={13} />
            {item.tag}
          </span>
          {item.amount && (
            <span className="font-semibold text-foreground text-sm">{item.amount}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
        <div className="prose prose-invert max-w-none">
          <p className="text-secondary-foreground leading-relaxed text-sm">
            Este registro refere-se a <strong className="text-foreground">{item.title}</strong>.
            Aqui estão os detalhes completos da transação ou nota associada.
          </p>
          <p className="text-secondary-foreground leading-relaxed text-sm mt-4">
            {item.summary} Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
          <div className="mt-6 p-4 rounded-2xl bg-surface-elevated">
            <h3 className="text-sm font-semibold text-foreground mb-2">Resumo</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="text-foreground font-medium mt-0.5">Em aberto</p>
              </div>
              <div>
                <span className="text-muted-foreground">Prioridade</span>
                <p className="text-foreground font-medium mt-0.5">Alta</p>
              </div>
              <div>
                <span className="text-muted-foreground">Categoria</span>
                <p className="text-foreground font-medium mt-0.5">Finanças</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vencimento</span>
                <p className="text-foreground font-medium mt-0.5">30 Mar, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reply bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 bg-surface-input rounded-2xl px-4 py-3">
          <button className="text-muted-foreground hover:text-foreground transition">
            <Paperclip size={16} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition">
            <Image size={16} />
          </button>
          <input
            type="text"
            placeholder="Adicionar comentário..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/80 transition">
            <Send size={14} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
