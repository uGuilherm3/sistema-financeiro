import { Plus, Trash2, Search } from "lucide-react";
import type { ListItem } from "./ListPanel";

interface NotesPanelProps {
    items: ListItem[];
    onCreateClick?: () => void;
}

const NotesPanel = ({ items, onCreateClick }: NotesPanelProps) => {
    const notes = items.filter(i => i.tag === "#NOTA" || i.tag.includes("NOTA"));

    return (
        <div className="w-80 h-full bg-card rounded-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Search & Add - Identical to ListPanel */}
            <div className="p-5 pb-2">
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar anotações..."
                            className="w-full bg-surface-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-1 focus:ring-primary/50 transition"
                        />
                    </div>
                    <button
                        onClick={onCreateClick}
                        className="w-10 h-10 bg-white/5 text-muted-foreground rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all shrink-0"
                        title="Criar anotação"
                    >
                        <Plus size={18} strokeWidth={2.5} />
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
                            {note.summary}
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
                {notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/30">
                        <Plus size={40} className="mb-2 opacity-10" />
                        <p className="text-xs uppercase tracking-widest font-bold">Sem notas</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default NotesPanel;
