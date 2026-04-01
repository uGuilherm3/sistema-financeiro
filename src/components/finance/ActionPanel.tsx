import { useState, useEffect } from "react";
import { ListTodo, StickyNote, DollarSign, X, ChevronDown, Plus, Wallet, CreditCard, ShoppingBag, Trash2 } from "lucide-react";

interface ActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  initialData?: any;
  onDelete?: () => void;
  onConfirm?: (data: any) => void;
}

const tabs = [
  { label: "Tarefa", icon: ListTodo },
  { label: "Nota", icon: StickyNote },
  { label: "Gasto", icon: DollarSign },
];

const availableIcons = [StickyNote, ListTodo, DollarSign, Wallet, CreditCard, ShoppingBag];

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

const CustomSelect = ({ label, value, options, onChange }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
      <div className="relative flex gap-2 items-stretch group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex-1 bg-white/[0.03] rounded-2xl px-5 py-4 text-xs text-foreground group-hover:bg-white/[0.05] transition-all">
          {value}
        </div>
        <div className="w-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-all">
          <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-black/40 backdrop-blur-3xl rounded-3xl p-2 z-[111] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200 outline-none border-none max-h-[220px] overflow-y-auto scrollbar-hide hover:scrollbar-default">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all ${value === opt
                  ? "bg-white text-black font-bold"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ActionPanel = ({ isOpen, onClose, isEdit, initialData, onDelete, onConfirm }: ActionPanelProps) => {
  const [activeTab, setActiveTab] = useState("Nota");
  const [selectedIconIdx, setSelectedIconIdx] = useState(0);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Aberto");
  const [priority, setPriority] = useState("Alta");
  const [category, setCategory] = useState("Finanças");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState("1x");

  useEffect(() => {
    if (isEdit && initialData && isOpen) {
      setTitle(initialData.title || "");
      setDescription(initialData.summary || "");
      setAmount(initialData.amount ? initialData.amount.toString().replace("R$ ", "").replace(/\./g, "") : "");
      setDate(initialData.due_date ? initialData.due_date : new Date().toISOString().split('T')[0]);
      const tagLabel = initialData.tag?.replace("#", "").toLowerCase();
      if (tagLabel) {
        const matchingTab = tabs.find(t => t.label.toLowerCase() === tagLabel);
        if (matchingTab) setActiveTab(matchingTab.label);
      }
    } else if (isOpen) {
      setTitle("");
      setDescription("");
      setAmount("");
      setStatus("Aberto");
      setPriority("Alta");
      setCategory("Finanças");
    }
  }, [isEdit, initialData, isOpen]);

  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);

  return (
    <>
      {/* Backdrop - Transparent but clickable */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Side Drawer - Glassmorphism style */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-black/40 backdrop-blur-3xl z-[101] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">
              {isEdit ? "Editar Registro" : "Novo Registro"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all self-start"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.label;
              return (
                <button
                  key={tab.label}
                  onClick={() => !isEdit && setActiveTab(tab.label)}
                  className={`flex items-center gap-3 pl-2 pr-5 py-2 rounded-[18px] transition-all shrink-0 ${isActive
                    ? "bg-white/10 text-white"
                    : "bg-white/[0.03] text-white/40 hover:text-white hover:bg-white/5"
                    } ${isEdit ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${isActive
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/40"
                    }`}>
                    <tab.icon size={16} />
                  </div>
                  <span className="text-[11px] font-bold whitespace-nowrap">{isEdit ? "" : "Add "}{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Icon Selection */}
          {!isEdit && (
            <div className="flex flex-col gap-2 shrink-0 animate-in fade-in duration-500">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Ícone</label>
              <div className="flex gap-2.5">
                {availableIcons.map((Icon, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIconIdx(idx)}
                    className={`w-11 h-11 rounded-md flex items-center justify-center transition-all ${selectedIconIdx === idx
                      ? "bg-white text-black shadow-xl scale-[1.05]"
                      : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Pagamento de conta"
                className="w-full bg-white/[0.03] border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/20 outline-none focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/[0.03] border-none rounded-2xl px-4 py-4 text-xs text-foreground outline-none transition-all [color-scheme:dark]"
                />
              </div>
              <CustomSelect
                label="Status"
                value={status}
                options={["Aberto", "Pago", "Pendente"]}
                onChange={setStatus}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CustomSelect
                label="Prioridade"
                value={priority}
                options={["Alta", "Média", "Baixa"]}
                onChange={setPriority}
              />
              <CustomSelect
                label="Categoria"
                value={category}
                options={["Finanças", "Pessoal", "Trabalho", "Saúde"]}
                onChange={setCategory}
              />
            </div>

            {activeTab === "Gasto" && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Valor (R$)</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/10 outline-none transition-all"
                  />
                </div>
                <CustomSelect
                  label="Parcelas"
                  value={installments}
                  options={installmentOptions}
                  onChange={setInstallments}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os detalhes..."
                className="w-full min-h-[150px] bg-white/[0.03] border-none rounded-3xl px-5 py-5 text-xs text-foreground placeholder:text-white/10 outline-none resize-none transition-all"
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-4 shrink-0 mt-auto">
            {isEdit && (
              <button
                onClick={() => {
                  onDelete?.();
                  onClose();
                }}
                className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10"
                title="Excluir item"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-5 rounded-2xl bg-white/10 backdrop-blur-3xl text-white font-bold text-[10px] hover:bg-white/20 transition-all active:scale-[0.98] shadow-2xl shadow-black/20 uppercase tracking-widest flex items-center justify-center font-bold"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                onConfirm?.({
                  title,
                  description,
                  recordType: activeTab,
                  status,
                  priority,
                  category,
                  amount: activeTab === "Gasto" ? parseFloat(amount.toString().replace(',', '.')) || 0 : 0,
                  due_date: date,
                  installments: activeTab === "Gasto" ? installments : null
                });
                onClose();
              }}
              className="flex-[1.5] py-5 rounded-2xl bg-white text-black font-bold text-[10px] hover:bg-white/90 transition-all active:scale-[0.98] shadow-2xl shadow-white/5 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isEdit ? "Salvar" : <Plus size={18} />}
              {isEdit ? "Atualizar" : `Salvar ${activeTab}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionPanel;
