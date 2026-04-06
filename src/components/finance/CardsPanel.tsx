import { useState, useRef, useEffect } from "react";
import { CreditCard, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface Card {
    id: number;
    bank: string;
    type: string;
    lastDigits: string;
    color: string;
    totalLimit?: string;
    availableLimit?: string;
    dueDay?: string;
}

interface CardsPanelProps {
    onAddClick: () => void;
    onEditClick: (card: Card) => void;
    onDeleteClick: (id: number) => void;
    cards: Card[];
    salary: number;
    salaryDay?: number;
    totalLimits: number;
    totalExpenses: number;
    totalGanhos?: number;
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
                <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 w-40 bg-black/80 backdrop-blur-xl rounded-2xl p-1 z-[100] animate-in fade-in slide-in-from-right-2 duration-300">
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

const CardsPanel = ({
    onAddClick,
    onEditClick,
    onDeleteClick,
    cards,
    salary,
    totalLimits,
    totalExpenses,
    totalGanhos = 0,
}: CardsPanelProps) => {
    const [displayCards, setDisplayCards] = useState(cards);
    const [parent] = useAutoAnimate();

    // Sincroniza apenas quando a lista de IDs de cartões muda (adição/exclusão)
    // Evita resetar a rotação do usuário em re-renders simples do pai
    useEffect(() => {
        const currentIds = displayCards.map(c => c.id).sort().join(',');
        const propIds = cards.map(c => c.id).sort().join(',');
        
        if (currentIds !== propIds || displayCards.length !== cards.length) {
            const savedId = localStorage.getItem('preferred_card_id');
            if (savedId) {
                const index = cards.findIndex(c => c.id === savedId);
                if (index !== -1) {
                    const reordered = [...cards.slice(0, index), ...cards.slice(index + 1), cards[index]];
                    setDisplayCards(reordered);
                    return;
                }
            }
            setDisplayCards(cards);
        }
    }, [cards]);

    const handleCardClick = (cardId: string | number) => {
        const index = displayCards.findIndex(c => c.id === cardId);
        if (index === -1) return;
        
        // Circular shuffle: o clicado vai para o fim (frente da pilha)
        const newOrder = [...displayCards.slice(0, index), ...displayCards.slice(index + 1), displayCards[index]];
        setDisplayCards(newOrder);
        
        // Salva a preferência
        localStorage.setItem('preferred_card_id', String(cardId));
    };

    const remainingBalance = salary + totalGanhos - totalExpenses;

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

            <div 
                ref={parent}
                className="flex-1 flex flex-col -space-y-28 overflow-visible pr-1 group/stack pt-4 min-h-[300px]"
            >
                {displayCards.map((card, index) => {
                    const isGlass = card.color?.includes('backdrop-blur');
                    return (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        className={`relative p-6 rounded-2xl cursor-pointer group transition-colors duration-500 
                                   min-h-[160px] flex flex-col justify-between overflow-hidden hover:-translate-y-4 shadow-none`}
                        style={{
                            zIndex: index,
                            marginTop: index === 0 ? '0' : undefined
                        }}
                    >
                        {/* Background Layer */}
                        <div
                            className={`absolute inset-0 rounded-2xl ${card.color} ${isGlass ? '' : 'opacity-100'} transition-all overflow-hidden`}
                            style={isGlass ? { backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' } : {}}
                        >
                            {/* Reflexos sutis para dar profundidade mesmo em cores sólidas */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/15 rounded-full -translate-y-12 translate-x-8 blur-2xl opacity-20" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-y-16 -translate-x-12 blur-3xl opacity-10" />
                        </div>

                        <div className="flex items-start justify-between relative z-10 w-full mb-4">
                            <div className="flex items-center gap-2">
                                <CreditCard size={14} className="text-white/80" />
                                <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.2em]">{card.bank}</span>
                            </div>
                            <CardMenu
                                onEdit={() => onEditClick(card)}
                                onDelete={() => onDeleteClick(card.id)}
                            />
                        </div>

                        <div className="relative z-10 space-y-1">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{card.type}</p>
                                    <p className="text-xl font-bold text-white tracking-[0.1em] leading-none">•••• {card.lastDigits}</p>
                                </div>
                                {card.availableLimit && (
                                    <div className="text-right">
                                        <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">Disp.</p>
                                        <p className="text-sm font-bold text-white">R$ {parseFloat(card.availableLimit).toLocaleString('pt-BR')}</p>
                                    </div>
                                )}
                            </div>

                            {card.availableLimit && card.totalLimit && (
                                <div className="mt-2 w-full h-1 bg-black/20 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ease-in-out ${(parseFloat(card.availableLimit) / parseFloat(card.totalLimit)) < 0.1 ? 'bg-red-400' : 'bg-white/60'
                                            }`}
                                        style={{ width: `${(parseFloat(card.availableLimit) / parseFloat(card.totalLimit)) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>

            {/* Resumo Financeiro na Base */}
            <div className="mt-auto rounded-2xl bg-surface-elevated p-4">
                <div className="flex items-end justify-between mb-3">
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Saldo do Mês</p>
                        <p className={`text-xl font-bold ${remainingBalance >= 0 ? 'text-foreground' : 'text-red-400'}`}>
                            R$ {remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right pb-0.5">
                        <p className="text-xs text-muted-foreground mb-1">Limites</p>
                        <p className="text-sm font-medium text-success">+ R$ {totalLimits.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        {totalGanhos > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Ganhos</p>
                                <p className="text-sm font-medium text-[#4ade80]">+ R$ {totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Despesas</p>
                        <p className="text-sm font-medium text-danger">- R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardsPanel;
