import { MoreHorizontal, Plus, StickyNote, Trash2, Calendar } from "lucide-react";
import { useState } from "react";

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  tag: string;
}

const NotesPanel = () => {
    const [notes, setNotes] = useState<Note[]>([
        { 
            id: 1, 
            title: "Revisão Financeira", 
            content: "Revisar relatório de gastos mensais na segunda com a equipe de contabilidade.", 
            date: "Hoje",
            tag: "#FINANÇAS"
        },
        { 
            id: 2, 
            title: "Ração do Gato", 
            content: "Comprar ração para o gato (Urgente). Verificar estoque de areia também.", 
            date: "28 Mar",
            tag: "#URGENTE"
        },
        { 
            id: 3, 
            title: "Projeto Cripto", 
            content: "Ideia: Dashboard de investimentos em cripto integrado com APIs de corretoras.", 
            date: "25 Mar",
            tag: "#IDEIA"
        },
    ]);

    return (
        <div className="w-80 h-full bg-card rounded-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header - Identical to DetailPanel */}
            <div className="p-6 pb-2">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <StickyNote size={20} className="text-muted-foreground" />
                        <h1 className="text-xl font-bold text-foreground">Anotações</h1>
                    </div>
                    <button className="p-2 rounded-xl hover:bg-white/5 transition-all text-muted-foreground">
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 p-5 space-y-3 overflow-y-auto scrollbar-thin">
                {notes.map((note) => (
                    <div 
                        key={note.id} 
                        className="group p-4 rounded-2xl bg-surface-elevated hover:bg-secondary border border-transparent hover:border-white/5 transition-all duration-300 cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-1">
                            <h3 className="text-sm font-semibold text-secondary-foreground group-hover:text-foreground transition-colors">
                                {note.title}
                            </h3>
                            <span className="text-[10px] text-muted-foreground font-medium pt-0.5">
                                {note.date}
                            </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                            {note.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                {note.tag}
                            </span>
                            <button className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Input Area (Simplified) */}
            <div className="p-4 border-t border-white/5">
                <button className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all border border-dashed border-white/10">
                    Nova Anotação
                </button>
            </div>
        </div>
    );
};

export default NotesPanel;
