import { MoreHorizontal, Paperclip, Image, Send, Calendar, Tag, CheckSquare, Pencil, Check, X, Plus, Trash2, Clock, ArrowRight, ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ListItem } from "./NotesPanel";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DetailPanelProps {
  item: ListItem | undefined;
  comments?: any[];
  userAvatar?: string;
  isTyping?: boolean;
  isBiluEnabled?: boolean;
  onEditClick?: (item: ListItem) => void;
  onConfirmPayment?: (id: number | string) => void;
  onSendComment?: (content: string, author?: 'user' | 'system') => void;
  onUpdateComment?: (commentId: string | number, newContent: string) => void;
  onDeleteComment?: (commentId: string | number) => void;
  onDeleteAllComments?: () => void;
  onAction?: (actionId: string, item: any) => void;
}

interface TaskItem {
  id: string;
  text: string;
  done: boolean;
}

interface TagData {
  text: string;
  color: string;
  textColor: string;
  description?: string;
}

const DetailPanel = ({
  item,
  comments = [],
  userAvatar,
  isTyping,
  isBiluEnabled = true,
  onEditClick,
  onConfirmPayment,
  onSendComment,
  onUpdateComment,
  onDeleteComment,
  onDeleteAllComments,
  onAction
}: DetailPanelProps) => {
  const [newComment, setNewComment] = useState("");
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [tagText, setTagText] = useState("");
  const [tagDescription, setTagDescription] = useState("");
  const [selectedTagColor, setSelectedTagColor] = useState({ bg: "bg-[#4ade80]", text: "text-emerald-950" });
  const [isClockSelectorOpen, setIsClockSelectorOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingClockId, setEditingClockId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingBlocks, setEditingBlocks] = useState<Set<string>>(new Set());
  const [selectedTagForView, setSelectedTagForView] = useState<TagData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentReminderIds = useRef<Set<string>>(new Set());
  const isSendingRef = useRef(false);

  // --- Motor de Lembretes Nativos Bilu IA ---
  useEffect(() => {
    if (!isBiluEnabled || !item) return;

    const recordId = (() => {
      if (!String(item.id).startsWith('inv_card_')) return item.id.toString();
      const hash = String(item.id).split('').reduce((acc, char) => acc + (char.charCodeAt(0).toString(16)), "");
      const part = hash.substring(0, 12).padEnd(12, '0');
      return `e11a5000-0000-4000-8000-${part}`;
    })();

    // Se as mensagens foram apagadas, reseta o controle para este recordId
    if (comments.length === 0) {
      sentReminderIds.current.delete(recordId);
    }

    const snoozeUntil = localStorage.getItem(`snooze_${recordId}`);
    if (snoozeUntil && Date.now() < parseInt(snoozeUntil)) return;

    const isPending = item.date === "Vencido" || item.date === "Hoje" ||
      (typeof item.date === 'string' && item.date.toLowerCase().includes('dia') && (parseInt(item.date) <= 3 || item.date === "1 dia"));

    const alreadyReminded = comments.some(c =>
      c.author === 'system' &&
      (String(c.content).includes("Oi Comandante") || String(c.content).toLowerCase().includes("vi que sua fatura")) &&
      String(c.record_id) === String(recordId)
    );

    if (isPending && !alreadyReminded && !sentReminderIds.current.has(recordId) && !isSendingRef.current) {
      isSendingRef.current = true;
      sentReminderIds.current.add(recordId);
      
      const type = String(item.id).startsWith('inv_card_') ? 'fatura' : 'dívida';
      const msg = `Oi Comandante! Notei que sua ${type} do **${item.title}** está chegando. Conseguiu dar atenção para ela?`;

      const timer = setTimeout(() => {
        onSendComment?.(msg, 'system');
        isSendingRef.current = false;
      }, 1000);
      return () => {
        clearTimeout(timer);
        isSendingRef.current = false; // Reset vital para evitar travamento
      };
    }
  }, [item?.id, isBiluEnabled, comments.length, item?.date]);
  // --- Fim do Motor ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments, item?.id, isTyping]);


  const pastelColors = [
    { bg: "bg-[#4ade80]", text: "text-emerald-950", label: "Verde" },
    { bg: "bg-[#a78bfa]", text: "text-violet-950", label: "Roxo" },
    { bg: "bg-[#f472b6]", text: "text-pink-950", label: "Rosa" },
    { bg: "bg-[#60a5fa]", text: "text-blue-950", label: "Azul" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
        setIsTaskSelectorOpen(false);
        setIsTagSelectorOpen(false);
        setIsClockSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const parseTasks = (content: string): { title: string, tasks: TaskItem[] } => {
    if (!content.startsWith('[TOOL:TASK_LIST]:')) return { title: '', tasks: [] };
    const raw = content.replace('[TOOL:TASK_LIST]:', '');
    try {
      const data = JSON.parse(raw);
      if (data.tasks) return { title: data.title, tasks: data.tasks };
      return { title: 'Lista de Tarefas', tasks: data };
    } catch {
      return { title: '', tasks: [] };
    }
  };

  const parseTag = (content: string): TagData | null => {
    try {
      const match = content.match(/\[TOOL:REMINDER_TAG\]:(.*)/);
      if (!match) return null;
      return JSON.parse(match[1]);
    } catch (e) {
      return null;
    }
  };

  const parseClock = (content: string): { date: string, time: string } | null => {
    try {
      const match = content.match(/\[TOOL:REMINDER_CLOCK\]:(.*)/);
      if (!match) return null;
      return JSON.parse(match[1]);
    } catch (e) {
      return null;
    }
  };

  const handleSendTasks = () => {
    if (!taskText.trim()) {
      toast.error("Digite pelo menos uma tarefa");
      return;
    }
    const tasks = taskText.split('\n')
      .map(t => t.trim())
      .filter(t => t !== "")
      .map(t => ({ id: generateId(), text: t, done: false }));

    const taskData = {
      title: taskTitle.trim() || 'Lista de Tarefas',
      tasks: tasks
    };

    onSendComment?.(`[TOOL:TASK_LIST]:${JSON.stringify(taskData)}`, 'system');
    setTaskText("");
    setTaskTitle("");
    setIsToolsMenuOpen(false);
    setIsTaskSelectorOpen(false);
  };

  const handleSendTag = () => {
    if (!tagText.trim()) {
      toast.error("Digite um texto para a tag");
      return;
    }
    const tagData: TagData = {
      text: tagText,
      color: selectedTagColor.bg,
      textColor: selectedTagColor.text,
      description: tagDescription.trim() || undefined
    };

    const content = `[TOOL:REMINDER_TAG]:${JSON.stringify(tagData)}`;

    if (editingTagId) {
      onUpdateComment?.(editingTagId, content);
      setEditingTagId(null);
    } else {
      onSendComment?.(content, 'system');
    }

    setTagText("");
    setTagDescription("");
    setIsTagSelectorOpen(false);
    setIsToolsMenuOpen(false);
  };

  const handleSendReminder = async () => {
    if (!reminderDate || !reminderTime) {
      toast.error("Selecione data e hora");
      return;
    }
    const clockData = { date: reminderDate, time: reminderTime };
    const content = `[TOOL:REMINDER_CLOCK]:${JSON.stringify(clockData)}`;

    if (editingClockId) {
      onUpdateComment?.(editingClockId, content);
      setEditingClockId(null);
    } else {
      onSendComment?.(content, 'system');
    }

    setReminderDate("");
    setReminderTime("");
    setIsClockSelectorOpen(false);
    setIsToolsMenuOpen(false);
  };

  const sortedComments = [...comments].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const handleDeleteReminder = (commentId: string | number) => {
    onDeleteComment?.(commentId);
  };

  const startEditingTag = (commentId: string, data: TagData) => {
    setEditingTagId(commentId);
    setTagText(data.text);
    setTagDescription(data.description || "");
    setSelectedTagColor({ bg: data.color, text: data.textColor });
    setIsTagSelectorOpen(true);
    setIsToolsMenuOpen(true);
  };

  const addTaskItem = (commentId: string | number, currentContent: string) => {
    const raw = currentContent.replace('[TOOL:TASK_LIST]:', '');
    let title = 'Lista de Tarefas';
    let tasks: TaskItem[] = [];

    try {
      const data = JSON.parse(raw);
      if (data.tasks) {
        tasks = data.tasks;
        title = data.title;
      } else {
        tasks = data;
      }
    } catch { return; }

    const newTasks = [...tasks, { id: generateId(), text: "Nova sub-tarefa", done: false }];
    const updatedContent = `[TOOL:TASK_LIST]:${JSON.stringify({ title, tasks: newTasks })}`;
    onUpdateComment?.(String(commentId), updatedContent);
  };

  const removeTaskItem = (e: React.MouseEvent, commentId: string | number, currentContent: string, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteTaskItem(commentId, currentContent, taskId);
  };

  const deleteTaskItem = (commentId: string | number, currentContent: string, taskId: string) => {
    const raw = currentContent.replace('[TOOL:TASK_LIST]:', '');
    let title = 'Lista de Tarefas';
    let tasks: TaskItem[] = [];

    try {
      const data = JSON.parse(raw);
      if (data.tasks) {
        tasks = data.tasks;
        title = data.title;
      } else {
        tasks = data;
      }
    } catch { return; }

    const newTasks = tasks.filter(t => t.id !== taskId);
    if (newTasks.length === 0) {
      onDeleteComment?.(String(commentId));
      toast.success("Checklist removido");
    } else {
      const updatedContent = `[TOOL:TASK_LIST]:${JSON.stringify({ title, tasks: newTasks })}`;
      onUpdateComment?.(String(commentId), updatedContent);
    }
  };

  const toggleTaskStatus = (commentId: string | number, currentContent: string, taskId: string) => {
    const raw = currentContent.replace('[TOOL:TASK_LIST]:', '');
    let title = 'Lista de Tarefas';
    let tasks: TaskItem[] = [];

    try {
      const data = JSON.parse(raw);
      if (data.tasks) {
        tasks = data.tasks;
        title = data.title;
      } else {
        tasks = data;
      }
    } catch { return; }

    const newTasks = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    const updatedContent = `[TOOL:TASK_LIST]:${JSON.stringify({ title, tasks: newTasks })}`;
    onUpdateComment?.(String(commentId), updatedContent);
  };

  const startEditingTask = (e: React.MouseEvent, commentId: string | number, taskId: string, currentText: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCommentId(String(commentId));
    setActiveTaskId(String(taskId));
    setEditValue(currentText);
  };

  const saveTaskName = (commentId: string | number, currentContent: string) => {
    if (!activeTaskId) return;

    const raw = currentContent.replace('[TOOL:TASK_LIST]:', '');
    let title = 'Lista de Tarefas';
    let tasks: TaskItem[] = [];

    try {
      const data = JSON.parse(raw);
      if (data.tasks) {
        tasks = data.tasks;
        title = data.title;
      } else {
        tasks = data;
      }
    } catch { return; }

    const newTasks = tasks.map(t => t.id === activeTaskId ? { ...t, text: editValue } : t);
    const updatedContent = `[TOOL:TASK_LIST]:${JSON.stringify({ title, tasks: newTasks })}`;
    onUpdateComment?.(String(commentId), updatedContent);
    setEditingCommentId(null);
    setActiveTaskId(null);
  };

  const saveTaskTitle = (commentId: string | number, currentContent: string, newTitle: string) => {
    const raw = currentContent.replace('[TOOL:TASK_LIST]:', '');
    let tasks: TaskItem[] = [];

    try {
      const data = JSON.parse(raw);
      if (data.tasks) {
        tasks = data.tasks;
      } else {
        tasks = data;
      }
    } catch { return; }

    const updatedContent = `[TOOL:TASK_LIST]:${JSON.stringify({ title: newTitle, tasks })}`;
    onUpdateComment?.(String(commentId), updatedContent);
  };

  const toggleEditMode = (commentId: string) => {
    const newEditingBlocks = new Set(editingBlocks);
    if (newEditingBlocks.has(commentId)) {
      newEditingBlocks.delete(commentId);
    } else {
      newEditingBlocks.add(commentId);
    }
    setEditingBlocks(newEditingBlocks);
  };

  if (!item) {
    return (
      <div className="flex-1 bg-white/[0.03] backdrop-blur-md rounded-3xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm font-medium border-none outline-none">Selecione um item para visualizar</p>
      </div>
    );
  }

  const isGasto = item.tag?.toUpperCase().includes("GASTO") || item.tag?.toUpperCase().includes("DESPESA") || item.tag?.toUpperCase().includes("NOTA") || item.tag?.toUpperCase().includes("FATURA") || false;
  const hasInstallments = item.total_installments !== undefined && item.total_installments >= 1;
  const amountStr = String(item.amount || "0");
  const parsedAmount = parseFloat(amountStr.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
  const remainingValue = isGasto && !isNaN(parsedAmount) && item.total_installments
    ? Math.max(0, (item.total_installments - (item.paid_installments || 0)) * parsedAmount)
    : 0;

  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3 leading-none">
          <div className="flex items-baseline gap-3 overflow-hidden">
            <h1 className="text-xl font-bold text-foreground leading-tight shrink-0">{item.title || "Sem Título"}</h1>
            {item.summary && (
              <p className="text-sm text-muted-foreground opacity-60 font-medium truncate">
                {item.summary}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-xl hover:bg-secondary transition text-muted-foreground hover:text-white border-none bg-transparent outline-none"
              >
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/80 backdrop-blur-xl border-none p-1">
              <DropdownMenuItem
                onClick={() => onEditClick?.(item)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70 focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Pencil size={14} />
                Editar Item
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Deseja apagar todo o histórico de mensagens deste item?")) {
                    onDeleteAllComments?.();
                  }
                }}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 focus:bg-red-500/20 focus:text-red-500 cursor-pointer"
              >
                <Trash2 size={14} />
                Limpar Histórico de Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className={`flex items-center gap-1.5 ${item.date === "Vencido" ? "text-destructive font-bold animate-pulse" :
            item.date === "Hoje" ? "text-tag-warning font-bold" :
              ""
            }`}>
            <Calendar size={13} />
            {item.date || "N/A"}
          </span>
          <span className={`flex items-center gap-1.5 font-medium ${item.tag?.toUpperCase().includes('SALÁRIO') || item.tag?.toUpperCase().includes('GANHO') ? 'text-success' : ''}`}>
            <Tag size={13} />
            {item.tag || "Cofre"}
          </span>
          {item.amount && (
            <span className={`font-bold text-sm flex items-center px-2 py-0.5 rounded-lg border-none ${
              item.tag?.toUpperCase().includes('SALÁRIO') || item.tag?.toUpperCase().includes('GANHO') 
                ? 'text-success bg-success/10' 
                : isGasto ? 'text-red-400 bg-red-500/10' : 'text-foreground bg-white/5'
            }`}>
              {item.amount}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-thin">
        <div className="prose prose-invert max-w-none">
          <div className="mt-0 p-6 rounded-3xl bg-white/[0.03] flex flex-col gap-6 border-none text-muted-foreground">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-[10px] mb-1 opacity-50 uppercase tracking-widest font-bold">Status de Prazo</p>
                <p className={`text-sm font-semibold ${item.date === "Vencido" ? "text-destructive" :
                  item.date === "Hoje" ? "text-tag-warning" :
                    "text-foreground"
                  }`}>{item.date || "Normal"}</p>
              </div>
              <div>
                <p className="text-[10px] mb-1 opacity-50 uppercase tracking-widest font-bold">Valor Parcela</p>
                <p className="text-sm font-semibold text-foreground">{item.amount || "N/A"}</p>
              </div>

              {isGasto && hasInstallments && (
                <>
                  <div>
                    <p className="text-[10px] mb-1 opacity-50 uppercase tracking-widest font-bold">Parcelas Pagas</p>
                    <p className="text-sm font-semibold text-foreground">
                      {item.paid_installments || 0} de {item.total_installments}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] mb-1 opacity-50 uppercase tracking-widest font-bold">Total Restante</p>
                    <p className="text-sm font-semibold text-foreground">
                      R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </>
              )}

              <div>
                <p className="text-[10px] mb-1 opacity-50 uppercase tracking-widest font-bold">Categoria</p>
                <p className="text-sm font-semibold text-foreground">{(item.tag || "").replace('#', '') || "Diversos"}</p>
              </div>
              <div>
                <p className="text-[10px] mb-1 opacity-50 uppercase tracking-widest font-bold">Data Referência</p>
                <p className="text-sm font-semibold text-foreground">
                  {item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : "Sem data"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          {(() => {
            const sortedComments = Array.isArray(comments) 
              ? [...comments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              : [];
            
            const lastPromptIndex = sortedComments.reduce((acc, c, i) => 
              (c && c.author === 'system' && (String(c.content).includes("Foi pago a fatura do mês?") || String(c.content).includes("Oi Comandante"))) 
              ? i : acc, -1);

            return sortedComments.map((comment, idx) => {
              if (!comment) return null;
              const contentString = String(comment.content || "");
              const isSystem = comment.author === 'system';
              const isPrompt = isSystem && (
                contentString.includes("Foi pago a fatura do mês?") || 
                contentString.includes("Oi Comandante") ||
                contentString.includes("Qual foi o valor") ||
                contentString.includes("saldo devedor")
              );
              const showButtons = idx === lastPromptIndex;

              const isTaskList = contentString.includes('[TOOL:TASK_LIST]:');
              const isTag = contentString.includes('[TOOL:REMINDER_TAG]:');
              const isClock = contentString.includes('[TOOL:REMINDER_CLOCK]:');

              // Lógica de Smarthide Avatar
              const previousComment = idx > 0 ? sortedComments[idx - 1] : null;
              const prevContentString = previousComment ? String(previousComment.content || "") : "";
              const getContentType = (str: string) => {
                if (str.includes('[TOOL:TASK_LIST]:')) return 'task';
                if (str.includes('[TOOL:REMINDER_TAG]:')) return 'tag';
                if (str.includes('[TOOL:REMINDER_CLOCK]:')) return 'clock';
                return 'text';
              };
              const currentType = getContentType(contentString);
              const prevType = getContentType(prevContentString);

              const isConsecutive = previousComment &&
                previousComment.author === comment.author &&
                (currentType === prevType);

              const taskData = isTaskList ? parseTasks(contentString) : { title: '', tasks: [] };
              const tagData = isTag ? parseTag(contentString) : null;
              const clockData = isClock ? parseClock(contentString) : null;

              if (isPrompt) {
                return (
                  <div key={comment.id} className="flex flex-col gap-4 p-5 rounded-[24px] bg-white/5 border-none shadow-xl animate-in zoom-in-95 duration-500 mb-2">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                        <img
                          src="https://preview.redd.it/the-new-discord-default-profile-pictures-v0-o9xjbxagdj7f1.png?width=1024&format=png&auto=webp&s=0649eb4a7812a9459ee12b139f431bad357e0aac"
                          alt="System"
                          className="w-full h-full object-cover grayscale-[0.3]"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] leading-relaxed font-bold text-white/90">
                          {contentString.split('[TOOL:')[0].trim()}
                        </p>
                        <span className="text-[9px] opacity-30 uppercase font-black tracking-widest mt-1 block">
                          SISTEMA • {new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {showButtons && (
                      <div className="flex flex-col gap-3 ml-12 pt-2">
                        {(String(item.id).startsWith('inv_card_') || (item.tag || "").toUpperCase().includes("FATURA")
                          ? [
                            { label: "Sim, Pago", action: () => onAction?.('action_sim', item) },
                            { label: "Não", action: () => onAction?.('action_nao', item) }
                          ]
                          : [
                            { label: "Sim, Pago", action: () => onAction?.('action_sim', item) },
                            { label: "Paguei Parte", action: () => onAction?.('action_parte', item) },
                            { label: "Não", action: () => onAction?.('action_nao', item) }
                          ]
                        ).map((option, bidx) => (
                          <button
                            key={bidx}
                            onClick={option.action}
                            className="flex items-center gap-4 group w-full max-w-xs transition-all outline-none border-none bg-transparent"
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border-none outline-none ring-1 ring-white/10 group-hover:ring-white/30 group-hover:bg-white/5 ${option.label.includes('Sim') ? 'group-hover:ring-[#4ade80]/40 group-hover:bg-[#4ade80]/10' : ''}`}>
                              <Check size={14} className={`text-[#4ade80] opacity-0 group-hover:opacity-100 transition-all ${option.label.includes('Sim') ? 'opacity-20' : ''}`} />
                            </div>
                            <span className="text-[11px] font-black text-white/40 group-hover:text-white uppercase tracking-[0.2em] transition-all">
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={comment.id} className={`flex items-start gap-4 group/comment ${isSystem ? "" : "flex-row-reverse"} animate-in fade-in slide-in-from-bottom-2 duration-300 ${isConsecutive ? '-mt-2' : 'mt-2'}`}>
                  {/* Avatar Container: Mantém o espaço (w-8) mesmo oculto */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-none bg-secondary/10 transition-all ${isConsecutive ? 'opacity-0' : 'opacity-100 animate-in fade-in duration-500'}`}>
                    {!isConsecutive && (
                      <img
                        src={isSystem
                          ? "https://preview.redd.it/the-new-discord-default-profile-pictures-v0-o9xjbxagdj7f1.png?width=1024&format=png&auto=webp&s=0649eb4a7812a9459ee12b139f431bad357e0aac"
                          : (userAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Guilherme")
                        }
                        alt={isSystem ? "System" : "User"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {isTag && tagData ? (
                    <div className="relative group/tag-block">
                      {(() => {
                        const isIncome = tagData.text.toUpperCase().includes('SALÁRIO') || tagData.text.toUpperCase().includes('GANHO') || tagData.text.toUpperCase().includes('RECEBIDO');
                        const isExpense = tagData.text.toUpperCase().includes('GASTO') || tagData.text.toUpperCase().includes('DESPESA') || tagData.text.toUpperCase().includes('PAGAR') || tagData.text.toUpperCase().includes('DÍVIDA');
                        
                        const bgColor = isIncome ? 'bg-[#4ade80]' : isExpense ? 'bg-[#f472b6]' : tagData.color;
                        const textColor = isIncome ? 'text-emerald-950' : isExpense ? 'text-pink-950' : tagData.textColor;

                        return (
                          <button
                            onClick={() => tagData.description && setSelectedTagForView(tagData)}
                            className={`flex items-center justify-between gap-4 px-6 py-4 rounded-full w-80 transition-all cursor-pointer border-none shadow-none text-left outline-none ${bgColor} ${textColor}`}
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest truncate">
                              {tagData.text}
                            </span>
                            {tagData.description ? <Plus size={16} className="shrink-0 opacity-40" /> : <ArrowRight size={16} className="shrink-0 opacity-40" />}
                          </button>
                        );
                      })()}

                      <div className="absolute -right-10 top-1/2 -translate-y-1/2 z-[60]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg opacity-0 group-hover/comment:opacity-100 transition-all border-none outline-none"
                              title="Gerenciar Tag"
                            >
                              <Pencil size={12} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-xl border-none p-1">
                            <DropdownMenuItem
                              onClick={() => startEditingTag(String(comment.id), tagData)}
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary focus:bg-primary/10 focus:text-primary cursor-pointer"
                            >
                              <Pencil size={14} />
                              Editar Tag
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              onClick={() => onDeleteComment?.(comment.id)}
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 focus:bg-red-500/20 focus:text-red-500 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              Excluir Tag
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ) : contentString.includes('[TOOL:REMINDER_CLOCK]:') && clockData ? (
                    <div className="relative group/tag-block flex flex-col gap-2 max-w-[90%]">
                      {/* Mensagem Padrão */}
                      <div className="p-4 rounded-2xl bg-white/5 border-none w-fit">
                        <p className="text-xs leading-relaxed font-semibold text-white/90">Lembrete marcado para:</p>
                      </div>

                      {/* Pílula Roxa */}
                      <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-full transition-all border-none bg-violet-600 text-white w-80">
                        <div className="flex items-center gap-3 shrink-0">
                          <Clock size={16} className="opacity-70" />
                          <span className="text-[12px] font-black uppercase tracking-widest whitespace-nowrap">
                            {new Date(clockData.date + 'T' + clockData.time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {clockData.time}
                          </span>
                        </div>
                        <Plus size={16} className="shrink-0 opacity-40 invisible" />
                      </div>

                      <div className="absolute -right-10 top-1/2 -translate-y-1/2 z-[60]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg opacity-0 group-hover/comment:opacity-100 transition-all border-none outline-none"
                              title="Gerenciar Lembrete"
                            >
                              <Pencil size={12} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-xl border-none p-1">
                            <DropdownMenuItem
                              onClick={() => {
                                const now = new Date();
                                const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                                const localTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                setEditingClockId(String(comment.id));
                                setReminderDate(localDate);
                                setReminderTime(localTime);
                                setIsClockSelectorOpen(true);
                                setIsToolsMenuOpen(false);
                              }}
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary focus:bg-primary/10 focus:text-primary cursor-pointer"
                            >
                              <Pencil size={14} />
                              Editar Lembrete
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              onClick={() => handleDeleteReminder(comment.id)}
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 focus:bg-red-500/20 focus:text-red-500 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              Excluir Lembrete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl max-w-[80%] bg-white/5 border-none transition-all ${isTaskList ? 'min-w-[280px]' : ''} relative`}>

                      {isTaskList && (
                        <>
                          <div className="mb-4 space-y-1">
                            {editingBlocks.has(String(comment.id)) ? (
                              <input
                                autoFocus
                                value={taskData.title}
                                onChange={(e) => saveTaskTitle(comment.id, comment.content, e.target.value)}
                                className="bg-white/5 border-none outline-none text-[10px] font-black uppercase tracking-[0.2em] text-primary px-2 py-1 rounded w-full"
                                placeholder="TÍTULO DA CHECKLIST"
                              />
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 px-1">
                                {taskData.title}
                              </span>
                            )}
                          </div>

                          <div className="absolute -right-10 top-1/2 -translate-y-1/2 z-[60]">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-1.5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg opacity-0 group-hover/comment:opacity-100 transition-all border-none outline-none"
                                  title="Editar"
                                >
                                  <Pencil size={12} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-3xl border-none p-1">
                                <DropdownMenuItem
                                  onClick={() => addTaskItem(comment.id, comment.content)}
                                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60 focus:bg-white/10 focus:text-white cursor-pointer"
                                >
                                  <Plus size={14} />
                                  Adicionar Item
                                </DropdownMenuItem>
                                <div className="px-2 py-1.5 text-[9px] opacity-40 uppercase tracking-widest font-black border-t border-white/5 mt-1">
                                  Criado as {comment.created_at ? new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                </div>
                                <DropdownMenuItem
                                  onClick={() => toggleEditMode(String(comment.id))}
                                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary focus:bg-primary/10 focus:text-primary cursor-pointer"
                                >
                                  <Pencil size={14} />
                                  {editingBlocks.has(String(comment.id)) ? "Finalizar Edição" : "Habilitar Edição"}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                  onClick={() => onDeleteComment?.(comment.id)}
                                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 focus:bg-red-500/20 focus:text-red-500 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  Excluir Checklist
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </>
                      )}

                      {isTaskList ? (
                        <div className="space-y-4">
                          {taskData.tasks.map((task) => {
                            const isEditing = String(editingCommentId) === String(comment.id) && String(activeTaskId) === String(task.id);

                            return (
                              <div key={task.id} className="flex flex-col gap-2 group/task relative">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleTaskStatus(comment.id, comment.content, task.id)}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border-none outline-none ring-1 ring-white/10 ${task.done ? 'bg-[#4ade80] ring-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'bg-white/5 hover:bg-white/10'
                                      }`}
                                  >
                                    {task.done && <Check size={14} className="text-emerald-950 stroke-[3]" />}
                                  </button>

                                  {isEditing ? (
                                    <div className="flex-1 flex items-center gap-2">
                                      <input
                                        autoFocus
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        autoComplete="off"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') { e.stopPropagation(); saveTaskName(comment.id, comment.content); }
                                          if (e.key === 'Escape') { e.stopPropagation(); setEditingCommentId(null); setActiveTaskId(null); }
                                        }}
                                        className="bg-white/10 border-none outline-none text-[11px] text-white px-2 py-1.5 rounded w-full font-bold uppercase tracking-widest"
                                      />
                                      <button onClick={() => saveTaskName(comment.id, comment.content)} className="text-primary hover:text-white transition p-1.5 shrink-0 border-none bg-transparent outline-none">
                                        <Check size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex-1 flex items-center justify-between group/text min-w-0">
                                      <span className={`text-[11px] font-bold uppercase tracking-widest truncate ${task.done ? 'text-white/30 line-through' : 'text-white/80'}`}>
                                        {task.text}
                                      </span>
                                      <div className={`flex items-center gap-2 transition-opacity bg-white/10 backdrop-blur-md rounded-lg p-1 ml-2 z-50 ${editingBlocks.has(String(comment.id)) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                        <button
                                          onClick={(e) => startEditingTask(e, comment.id, task.id, task.text)}
                                          className="p-1.5 hover:bg-white/10 rounded-md transition text-white/40 hover:text-white cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
                                          title="Editar item"
                                        >
                                          <Pencil size={14} />
                                        </button>
                                        <button
                                          onClick={(e) => removeTaskItem(e, comment.id, comment.content, task.id)}
                                          className="p-1.5 hover:bg-red-500/20 rounded-md transition text-white/40 hover:text-red-500 cursor-pointer border-none bg-transparent outline-none flex items-center justify-center"
                                          title="Apagar item"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {editingBlocks.has(String(comment.id)) && (
                            <button
                              onClick={() => addTaskItem(comment.id, comment.content)}
                              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-2 border-none bg-transparent outline-none mt-4"
                            >
                              <Plus size={14} />
                              Adicionar Item
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed font-semibold text-white/90 whitespace-pre-wrap">{comment.content}</p>
                      )}

                      {!isTaskList && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] opacity-40 uppercase tracking-tighter font-bold">
                            {comment.created_at ? new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                          </span>
                        </div>
                      )}

                      {/* Menu de Opções para mensagens comuns (Apenas Usuário) */}
                      {!isSystem && (
                        <div className="absolute -right-[44px] top-1/2 -translate-y-1/2 z-[60]">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1.5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg opacity-0 group-hover/comment:opacity-100 transition-all border-none outline-none"
                                title="Gerenciar Mensagem"
                              >
                                <Pencil size={12} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-xl border-none p-1">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingCommentId(String(comment.id));
                                  setEditValue(comment.content);
                                }}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary focus:bg-primary/10 focus:text-primary cursor-pointer"
                              >
                                <Pencil size={14} />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem
                                onClick={() => onDeleteComment?.(comment.id)}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 focus:bg-red-500/20 focus:text-red-500 cursor-pointer"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {(() => {
          const recordIdForSnooze = (() => {
            if (!String(item.id).startsWith('inv_card_')) return item.id.toString();
            const hash = String(item.id).split('').reduce((acc, char) => acc + (char.charCodeAt(0).toString(16)), "");
            const part = hash.substring(0, 12).padEnd(12, '0');
            return `e11a5000-0000-4000-8000-${part}`;
          })();
          const snoozeUntil = localStorage.getItem(`snooze_${recordIdForSnooze}`);
          const isSnoozed = snoozeUntil && Date.now() < parseInt(snoozeUntil);
          
          return isGasto && !isSnoozed && !comments.some(c => c && c.author === 'system' && (String(c.content).includes("Foi pago a fatura do mês?") || String(c.content).includes("Oi Comandante"))) && (item.date === "Vencido" || item.date === "Hoje" || (typeof item.date === 'string' && item.date.toLowerCase().includes('dia') && (parseInt(item.date) <= 3 || item.date === "1 dia")));
        })() && (
          <div className="flex flex-col gap-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                <img
                  src="https://preview.redd.it/the-new-discord-default-profile-pictures-v0-o9xjbxagdj7f1.png?width=1024&format=png&auto=webp&s=0649eb4a7812a9459ee12b139f431bad357e0aac"
                  alt="System Avatar"
                  className="w-full h-full object-cover grayscale-[0.3]"
                />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                <p className="text-xs text-white/90 leading-relaxed font-bold tracking-tight">Foi pago a fatura do mês?</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 ml-11">
              {(String(item.id).startsWith('inv_card_') || (item.tag || "").toUpperCase().includes("FATURA")
                ? [
                  { label: "Sim, Pago", action: () => onAction?.('action_sim', item) },
                  { label: "Não", action: () => onAction?.('action_nao', item) }
                ]
                : [
                  { label: "Sim, Pago", action: () => onAction?.('action_sim', item) },
                  { label: "Paguei Parte", action: () => onAction?.('action_parte', item) },
                  { label: "Não", action: () => onAction?.('action_nao', item) }
                ]
              ).map((option, idx) => (
                <button
                  key={idx}
                  onClick={option.action}
                  className="flex items-center gap-4 group w-full max-w-xs transition-all outline-none border-none bg-transparent"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border-none outline-none ring-1 ring-white/10 group-hover:ring-white/30 group-hover:bg-white/5 ${option.label.includes('Sim') ? 'group-hover:ring-[#4ade80]/40 group-hover:bg-[#4ade80]/10' : ''}`}>
                    <Check size={14} className={`text-[#4ade80] opacity-0 group-hover:opacity-100 transition-all ${option.label.includes('Sim') ? 'opacity-20' : ''}`} />
                  </div>
                  <span className="text-[11px] font-black text-white/40 group-hover:text-white uppercase tracking-[0.2em] transition-all">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {isTyping && isBiluEnabled && (
          <div className="flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-none bg-secondary/10">
              <img
                src="https://preview.redd.it/the-new-discord-default-profile-pictures-v0-o9xjbxagdj7f1.png?width=1024&format=png&auto=webp&s=0649eb4a7812a9459ee12b139f431bad357e0aac"
                alt="Bilu Typing"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border-none flex items-center gap-1.5 text-primary">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-surface-elevated/20 transition-all border-none relative">
        {isToolsMenuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-[calc(100%-8px)] left-4 w-64 bg-black/30 rounded-[24px] p-4 animate-in fade-in zoom-in-95 duration-200 z-[70] overflow-hidden"
            style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 py-2 mb-2">
              Ferramentas
            </div>
            {isTaskSelectorOpen ? (
              <div className="space-y-4 px-1 py-1">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Título da Lista</span>
                  <input
                    autoFocus
                    placeholder="EX: LIMPEZA DA CASA"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-[11px] text-white font-bold placeholder:text-white/10 outline-none uppercase tracking-widest"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Tarefas (uma por linha)</span>
                  <textarea
                    placeholder="EX: LIMPAR O VIDRO"
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    className="w-full bg-white/5 border-none rounded-xl px-4 py-3 text-[11px] text-white font-bold placeholder:text-white/10 outline-none min-h-[100px] resize-none uppercase tracking-widest"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setIsTaskSelectorOpen(false); setTaskText(""); setTaskTitle(""); }}
                    className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-bold text-[10px] hover:bg-white/20 transition-all uppercase tracking-widest"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSendTasks}
                    className="flex-[2] py-4 rounded-2xl bg-white text-black font-bold text-[10px] hover:bg-white/90 transition-all uppercase tracking-widest"
                  >
                    Checklist
                  </button>
                </div>
              </div>
            ) : isTagSelectorOpen ? (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <Tag size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Configurar Tag</span>
                  </div>
                  <button onClick={() => { setIsTagSelectorOpen(false); setTagText(""); setTagDescription(""); }} className="p-1 hover:bg-white/5 rounded transition border-none bg-transparent outline-none">
                    <X size={16} className="text-white/40" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 px-2 mb-4">
                  {pastelColors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTagColor({ bg: color.bg, text: color.text })}
                      className={`h-10 rounded-xl transition-all relative overflow-hidden group ${color.bg} ${selectedTagColor.bg === color.bg ? 'ring-2 ring-white/20' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors" />
                      {selectedTagColor.bg === color.bg && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="px-2 space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Texto da Tag</span>
                    <input
                      autoFocus
                      placeholder="EX: COMPRAR CARVÃO"
                      value={tagText}
                      onChange={(e) => setTagText(e.target.value)}
                      className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground font-bold placeholder:text-white/10 outline-none transition-all focus:bg-white/10 uppercase tracking-widest"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Descrição (Opcional)</span>
                    <textarea
                      placeholder="ADICIONE MAIS DETALHES..."
                      value={tagDescription}
                      onChange={(e) => setTagDescription(e.target.value)}
                      className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground font-medium placeholder:text-white/10 outline-none transition-all focus:bg-white/10 min-h-[80px] resize-none uppercase tracking-tight"
                    />
                  </div>

                  <button
                    onClick={handleSendTag}
                    className="w-full py-4 rounded-2xl bg-white text-black font-bold text-[10px] hover:bg-white/90 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    Confirmar Tag
                  </button>
                </div>
              </div>
            ) : isClockSelectorOpen ? (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <Clock size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Agendar Lembrete</span>
                  </div>
                  <button onClick={() => { setIsClockSelectorOpen(false); setReminderDate(""); setReminderTime(""); }} className="p-1 hover:bg-white/5 rounded transition border-none bg-transparent outline-none">
                    <X size={16} className="text-white/40" />
                  </button>
                </div>

                <div className="px-2 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Data</span>
                    <div className="flex gap-3">
                      <select
                        value={reminderDate ? new Date(reminderDate + "T00:00:00").getDate() : 1}
                        onChange={(e) => {
                          const dateObj = reminderDate ? new Date(reminderDate + "T00:00:00") : new Date();
                          dateObj.setDate(parseInt(e.target.value));
                          setReminderDate(dateObj.toISOString().split('T')[0]);
                        }}
                        className="flex-1 bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground font-bold outline-none transition-all focus:bg-white/10 appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d} className="bg-[#111111]">{String(d).padStart(2, '0')} (DIA)</option>
                        ))}
                      </select>

                      <select
                        value={reminderDate ? new Date(reminderDate + "T00:00:00").getMonth() : new Date().getMonth()}
                        onChange={(e) => {
                          const dateObj = reminderDate ? new Date(reminderDate + "T00:00:00") : new Date();
                          dateObj.setMonth(parseInt(e.target.value));
                          setReminderDate(dateObj.toISOString().split('T')[0]);
                        }}
                        className="flex-1 bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground font-bold outline-none transition-all focus:bg-white/10 appearance-none cursor-pointer"
                      >
                        {["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map((m, i) => (
                          <option key={m} value={i} className="bg-[#111111]">{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Hora</span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-xs text-foreground font-bold outline-none transition-all focus:bg-white/10 uppercase"
                    />
                  </div>

                  <button
                    onClick={handleSendReminder}
                    disabled={!reminderDate || !reminderTime}
                    className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 border-none outline-none"
                  >
                    Confirmar Agendamento
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4 items-start">
                <button
                  onClick={() => setIsTaskSelectorOpen(true)}
                  className="border-none bg-transparent flex flex-col items-center gap-3 p-1 rounded-2xl transition group outline-none"
                  title="Tarefa"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white group-hover:text-black transition-all shadow-none">
                    <CheckSquare size={18} />
                  </div>
                  <span className="text-[8px] font-black text-white/30 group-hover:text-white uppercase tracking-widest text-center">Tarefa</span>
                </button>

                <button
                  onClick={() => setIsTagSelectorOpen(true)}
                  className="border-none bg-transparent flex flex-col items-center gap-3 p-1 rounded-2xl transition group outline-none"
                  title="Tag"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white group-hover:text-black transition-all shadow-none">
                    <Tag size={18} />
                  </div>
                  <span className="text-[8px] font-black text-white/30 group-hover:text-white uppercase tracking-widest text-center">Tag</span>
                </button>

                <button
                  onClick={() => setIsClockSelectorOpen(true)}
                  className="border-none bg-transparent flex flex-col items-center gap-3 p-1 rounded-2xl transition group outline-none"
                  title="Lembrete"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white group-hover:text-black transition-all shadow-none">
                    <Clock size={18} />
                  </div>
                  <span className="text-[8px] font-black text-white/30 group-hover:text-white uppercase tracking-widest text-center">Lembrete</span>
                </button>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 bg-surface-input rounded-2xl px-4 py-3 relative border-none">
          <button
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className={`transition-all bg-transparent border-none outline-none ${isToolsMenuOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Paperclip size={18} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition bg-transparent border-none outline-none">
            <Image size={18} />
          </button>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (newComment.trim()) {
                  onSendComment?.(newComment);
                  setNewComment("");
                }
              }
            }}
            placeholder="Adicionar comentário..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none border-none shadow-none"
          />
          <button
            onClick={() => {
              if (newComment.trim()) {
                onSendComment?.(newComment);
                setNewComment("");
              }
            }}
            className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/80 transition border-none outline-none"
          >
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Modal de Detalhes da Tag */}
      {selectedTagForView && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setSelectedTagForView(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div
            className="relative w-full max-w-md bg-background rounded-[24px] overflow-hidden animate-in zoom-in-95 duration-300 border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-8 ${selectedTagForView.color} ${selectedTagForView.textColor} flex items-center justify-between`}>
              <span className="text-[14px] font-black uppercase tracking-[0.2em]">
                {selectedTagForView.text}
              </span>
              <button
                onClick={() => setSelectedTagForView(null)}
                className="p-2 hover:bg-black/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-2 text-white/30">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Detalhes do Lembrete</span>
              </div>
              <p className="text-[15px] text-white/80 leading-relaxed font-medium uppercase tracking-tight">
                {selectedTagForView.description || "Nenhuma descrição detalhada fornecida para este lembrete."}
              </p>
            </div>
            <div className="p-6 bg-white/5 flex justify-end">
              <button
                onClick={() => setSelectedTagForView(null)}
                className="px-6 py-3 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-white/90 transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPanel;
