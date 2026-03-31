import { useState } from "react";
import { ListTodo, StickyNote, DollarSign } from "lucide-react";

const tabs = [
  { label: "Tarefa", icon: ListTodo },
  { label: "Nota", icon: StickyNote },
  { label: "Gasto", icon: DollarSign },
];

const ActionPanel = () => {
  const [activeTab, setActiveTab] = useState("Nota");

  return (
    <div className="w-80 shrink-0 glass-panel rounded-3xl border border-border p-5 flex flex-col gap-5">
      <h2 className="text-sm font-bold text-foreground">Novo Registro</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-input rounded-xl p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3 flex-1">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Título</label>
          <input
            type="text"
            placeholder="Ex: Pagamento de conta"
            className="w-full bg-surface-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data</label>
            <input
              type="date"
              className="w-full bg-surface-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 transition [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <select className="w-full bg-surface-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 transition appearance-none">
              <option>Aberto</option>
              <option>Pago</option>
              <option>Pendente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
            <select className="w-full bg-surface-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 transition appearance-none">
              <option>Alta</option>
              <option>Média</option>
              <option>Baixa</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
            <select className="w-full bg-surface-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 transition appearance-none">
              <option>Finanças</option>
              <option>Pessoal</option>
              <option>Trabalho</option>
              <option>Saúde</option>
            </select>
          </div>
        </div>

        {activeTab === "Gasto" && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
            <input
              type="text"
              placeholder="0,00"
              className="w-full bg-surface-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition"
            />
          </div>
        )}

        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
          <textarea
            rows={4}
            placeholder="Descreva os detalhes..."
            className="w-full h-full min-h-[100px] bg-surface-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>
      </div>

      {/* Submit */}
      <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/80 transition">
        Salvar {activeTab}
      </button>
    </div>
  );
};

export default ActionPanel;
