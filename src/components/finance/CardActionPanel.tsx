import { useState } from "react";
import { X, Plus, CreditCard, Palette, Calendar } from "lucide-react";

interface CardActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (card: any) => void;
  initialData?: {
    id?: number;
    bank: string;
    type: string;
    lastDigits: string;
    color: string;
    dueDay?: string;
    totalLimit?: string;
    availableLimit?: string;
  } | null;
}

const CustomSelect = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs font-medium text-left flex items-center justify-between transition-all hover:bg-white/10 ${isOpen ? 'bg-white/10' : ''}`}
        >
          <span className={value ? "text-white" : "text-white/20"}>{value || "Selecionar"}</span>
          <Plus size={14} className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
        </button>

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
    </div>
  );
};

import { useEffect } from "react";

const CardActionPanel = ({ isOpen, onClose, onConfirm, initialData }: CardActionPanelProps) => {
  const [bankName, setBankName] = useState("");
  const [cardType, setCardType] = useState("Crédito");
  const [lastDigits, setLastDigits] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-purple-600");
  const [dueDay, setDueDay] = useState("10");
  const [totalLimit, setTotalLimit] = useState("");
  const [availableLimit, setAvailableLimit] = useState("");

  useEffect(() => {
    if (initialData) {
      setBankName(initialData.bank);
      setCardType(initialData.type);
      setLastDigits(initialData.lastDigits);
      setSelectedColor(initialData.color);
      setDueDay(initialData.dueDay || "10");
      setTotalLimit(initialData.totalLimit || "");
      setAvailableLimit(initialData.availableLimit || "");
    } else {
      setBankName("");
      setCardType("Crédito");
      setLastDigits("");
      setSelectedColor("bg-purple-600");
      setDueDay("10");
      setTotalLimit("");
      setAvailableLimit("");
    }
  }, [initialData, isOpen]);

  const handleConfirm = () => {
    onConfirm({
      id: initialData?.id || Date.now(),
      bank: bankName,
      type: cardType,
      lastDigits: lastDigits,
      color: selectedColor,
      dueDay: dueDay,
      totalLimit: totalLimit,
      availableLimit: availableLimit
    });
    onClose();
  };

  const handleClear = () => {
    setBankName("");
    setCardType("Crédito");
    setLastDigits("");
    setSelectedColor("bg-purple-600");
    setDueDay("10");
    setTotalLimit("");
    setAvailableLimit("");
  };

  const colors = [
    { name: "Nubank", class: "bg-purple-600" },
    { name: "Inter", class: "bg-orange-500" },
    { name: "C6 Bank", class: "bg-zinc-900" },
    { name: "Bradesco", class: "bg-red-600" },
    { name: "Santander", class: "bg-red-700" },
    { name: "BB", class: "bg-yellow-500" },
    { name: "Itaú", class: "bg-orange-600" },
    { name: "Caixa", class: "bg-blue-700" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const usedPercentage = totalLimit && availableLimit 
    ? Math.max(0, Math.min(100, (1 - (parseFloat(availableLimit) / parseFloat(totalLimit))) * 100))
    : 0;

  return (
    <>
      {/* Backdrop - Transparent but clickable */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-black/40 backdrop-blur-3xl z-[101] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Configurar Cartão</h2>
                <p className="text-[10px] text-white/40 font-medium tracking-tight">Personalize seu método de pagamento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all outline-none"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {/* Institution & Due Day Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Instituição</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ex: Nubank, Inter..."
                  className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/10 outline-none transition-all focus:bg-white/10"
                />
              </div>
              <div className="col-span-1">
                <CustomSelect
                  label="Vencimento"
                  value={dueDay}
                  options={days}
                  onChange={setDueDay}
                />
              </div>
            </div>

            {/* Grid 2 Columns: Type & Last Digits */}
            <div className="grid grid-cols-2 gap-4">
              <CustomSelect
                label="Tipo de Cartão"
                value={cardType}
                options={["Crédito", "Débito", "Múltiplo"]}
                onChange={setCardType}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Final do Cartão</label>
                <input
                  type="text"
                  maxLength={4}
                  value={lastDigits}
                  onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000"
                  className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/10 outline-none transition-all focus:bg-white/10 text-center tracking-[0.3em] font-bold"
                />
              </div>
            </div>

            {/* Limits Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Limite Total</label>
                <input
                  type="number"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/10 outline-none transition-all focus:bg-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Limite Disponível</label>
                <input
                  type="number"
                  value={availableLimit}
                  onChange={(e) => setAvailableLimit(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/10 outline-none transition-all focus:bg-white/10"
                />
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                <Palette size={12} /> Personalização do Tema
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colors.map((color) => (
                  <button
                    key={color.class}
                    onClick={() => setSelectedColor(color.class)}
                    className={`h-12 rounded-xl transition-all relative overflow-hidden group ${color.class} ${selectedColor === color.class ? 'scale-[0.9] shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
                  >
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors" />
                    {selectedColor === color.class && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="mt-4 space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Prévia do Cartão</label>
               <div className={`w-full p-6 rounded-3xl ${selectedColor} relative overflow-hidden shadow-2xl transition-all duration-500 min-h-[160px] flex flex-col justify-between`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-8 blur-3xl opacity-50" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-white/80" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">{bankName || "NOME DO BANCO"}</span>
                    </div>
                    <div className="w-8 h-5 rounded bg-white/20 backdrop-blur-md" />
                  </div>

                  <div className="relative z-10 space-y-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-white/60 font-medium">{cardType}</p>
                      <p className="text-xl font-bold text-white tracking-widest">•••• {lastDigits || "0000"}</p>
                    </div>

                    {totalLimit && (
                      <div className="space-y-1.5 opacity-80">
                        <div className="flex justify-between text-[10px] font-bold text-white uppercase tracking-tight">
                          <span>Disponível</span>
                          <span>R$ {parseFloat(availableLimit || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${100 - usedPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-4 shrink-0 mt-auto">
            <button 
              onClick={handleClear}
              className="flex-1 py-5 rounded-2xl bg-white/10 backdrop-blur-3xl text-white font-bold text-[10px] hover:bg-white/20 transition-all active:scale-[0.98] shadow-2xl shadow-black/20 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Limpar
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-[2] py-5 rounded-2xl bg-white text-black font-bold text-[10px] hover:bg-white/90 transition-all active:scale-[0.98] shadow-2xl shadow-white/5 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Confirmar Adição
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CardActionPanel;
