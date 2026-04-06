import { useEffect, useState, useRef } from "react";
import { Folder, X, Plus, Upload, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface CategoryActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  onDelete?: (id: string) => void;
  isEdit?: boolean;
  initialData?: any;
}

const PRESET_BACKGROUNDS = [
  "#4ade80", // Verde
  "#a78bfa", // Roxo
  "#f472b6", // Rosa
  "#60a5fa", // Azul
  "linear-gradient(135deg, #4ade80 0%, #3b82f6 100%)", // Verde-Azul
  "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)", // Roxo-Rosa
  "linear-gradient(135deg, #f472b6 0%, #fb923c 100%)", // Rosa-Laranja
  "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)", // Azul-Roxo
];

const CategoryActionPanel = ({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  isEdit = false,
  initialData,
}: CategoryActionPanelProps) => {
  const [name, setName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("O arquivo deve ter no máximo 5MB para o banco de dados suportar.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Zera o form ao abrir ou preenche se for edição
  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        setName(initialData.name || "");
        setBackgroundUrl(initialData.background_url || "");
      } else {
        setName("");
        setBackgroundUrl("");
      }
    }
  }, [isOpen, isEdit, initialData]);

  const isCoreCategory = (name: string) => {
    const coreNames = ["faturas", "dividas", "dívidas", "tarefas", "ganhos"];
    return coreNames.includes(name.toLowerCase().trim());
  };

  const canDelete = isEdit && !isCoreCategory(initialData?.name || "");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }
    onConfirm({ name, background_url: backgroundUrl });
  };

  return (
    <>
      {/* Backdrop - Transparent but clickable */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Side Drawer - Glassmorphism style (Igual ao ActionPanel) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-black/80 backdrop-blur-xl z-[101] transition-transform duration-500 ease-in-out transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">
              {isEdit ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all self-start"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Folder className="text-white opacity-80" size={20} />
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              {isEdit 
                ? "Atualize o nome ou o papel de parede desta categoria para manter seu cockpit organizado e com o seu estilo."
                : "Crie um novo agrupamento (ex: Trabalho, Viagem, Pessoal) e adicione um papel de parede para diferenciá-lo na lateral do cockpit."}
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-6 flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Viagem Japão 2026"
                className="w-full bg-white/[0.03] border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/20 outline-none focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                <span>Papel de Parede (Opcional)</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
                >
                  <Upload size={12} />
                  <span>Subir Imagem</span>
                </button>
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                type="text"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="Ou cole o link de uma imagem (https://...)"
                className="w-full bg-white/[0.03] border-none rounded-2xl px-5 py-4 text-xs text-foreground placeholder:text-white/20 outline-none focus:bg-white/[0.05] transition-all"
              />

              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 block mb-3">Pré Definições (Cores e Degradês)</span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKGROUNDS.map((bg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBackgroundUrl(bg)}
                      className={`h-10 rounded-xl transition-all ${backgroundUrl === bg ? 'ring-2 ring-white scale-95' : 'hover:scale-105'} border-none`}
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>

              {backgroundUrl && (
                <div className="w-full h-32 rounded-3xl mt-2 overflow-hidden border-none relative group bg-white/5">
                  {backgroundUrl.startsWith('http') || backgroundUrl.startsWith('data:') ? (
                    <img src={backgroundUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <div className="w-full h-full" style={{ background: backgroundUrl }} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col gap-3 shrink-0 mt-auto">
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-5 rounded-2xl bg-white/5 backdrop-blur-xl text-white font-bold text-[10px] hover:bg-white/20 transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center"

              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[1.5] py-5 rounded-2xl bg-white text-black font-bold text-[10px] hover:bg-white/90 transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {isEdit ? <Pencil size={18} /> : <Plus size={18} />}
                {isEdit ? "Salvar Alterações" : "Criar Categoria"}
              </button>
            </div>

            {isEdit && (
              <button
                onClick={() => canDelete && initialData?.id && onDelete?.(initialData.id)}
                disabled={!canDelete}
                className={`w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  canDelete 
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                    : "bg-white/5 text-white/10 cursor-not-allowed grayscale"
                }`}
              >
                <Trash2 size={16} />
                {canDelete ? "Excluir Categoria" : "Categoria Protegida"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryActionPanel;
