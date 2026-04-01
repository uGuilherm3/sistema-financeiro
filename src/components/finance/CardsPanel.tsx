import { useState, useRef, useEffect } from "react";
import { CreditCard, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";

interface Card {
    id: number;
    bank: string;
    type: string;
    lastDigits: string;
    color: string;
}

const cards: Card[] = [
    { id: 1, bank: "Nubank", type: "Crédito", lastDigits: "4582", color: "bg-purple-600" },
    { id: 2, bank: "Inter", type: "Débito", lastDigits: "9021", color: "bg-orange-500" },
];

interface CardsPanelProps {
    onAddClick: () => void;
    onEditClick: (card: Card) => void;
    onDeleteClick: (id: number) => void;
    cards: Card[];
}

const CardMenu = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition-all active:scale-95"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 w-40 bg-black/80 backdrop-blur-3xl rounded-2xl p-1 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-right-2 duration-300">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all font-mono"
                    >
                        <Pencil size={12} />
                        Editar
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all font-mono"
                    >
                        <Trash2 size={12} />
                        Excluir
                    </button>
                </div>
            )}
        </div>
    );
};

const CardsPanel = ({ onAddClick, onEditClick, onDeleteClick, cards }: CardsPanelProps) => {
    return (
        <div className="flex-1 glass-panel rounded-3xl p-5 flex flex-col gap-5 overflow-hidden">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Meus cartões</h2>
                <button 
                  onClick={onAddClick}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-all"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-1 overflow-x-visible">
                {cards.map((card) => (
                    <div 
                        key={card.id} 
                        className={`relative p-6 rounded-2xl cursor-grab active:cursor-grabbing transition-all active:scale-[0.98] shadow-lg group min-h-[140px] flex flex-col justify-between`}
                    >
                        {/* Background Layer (Clips correctly) */}
                        <div className={`absolute inset-0 rounded-2xl ${card.color} overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-8 blur-2xl" />
                        </div>
                        
                        <div className="flex items-start justify-between relative z-10 w-full mb-4">
                            <div className="flex items-center gap-2">
                                <CreditCard size={16} className="text-white/80" />
                                <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">{card.bank}</span>
                            </div>
                            <CardMenu 
                                onEdit={() => onEditClick(card)} 
                                onDelete={() => onDeleteClick(card.id)} 
                            />
                        </div>

                        <div className="relative z-10 space-y-0.5">
                            <p className="text-xs text-white/60 font-medium">{card.type}</p>
                            <p className="text-lg font-bold text-white tracking-widest leading-none">•••• {card.lastDigits}</p>
                        </div>
                    </div>
                ))}

                {/* Add New Card Placeholder */}
                <button 
                  onClick={onAddClick}
                  className="w-full h-24 rounded-2xl bg-white/5 flex items-center justify-center gap-2 text-muted-foreground hover:text-white hover:bg-white/10 transition-all group p-4"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors">
                        <Plus size={14} className="group-hover:text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Adicionar Cartão</span>
                </button>
            </div>
        </div>
    );
};

export default CardsPanel;
