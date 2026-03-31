import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  StickyNote,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Trash2,
  PenLine,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { icon: LayoutDashboard, label: "Visão Geral", count: 0 },
  { icon: StickyNote, label: "Minhas Notas", count: 3 },
  { icon: TrendingUp, label: "Receitas", count: 0 },
  { icon: TrendingDown, label: "Despesas", count: 5 },
  { icon: PiggyBank, label: "Orçamentos", count: 0 },
  { icon: Trash2, label: "Lixeira", count: 0 },
];

interface SidebarPanelProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

const SidebarPanel = ({ activeNav, onNavChange }: SidebarPanelProps) => {
  const [userName, setUserName] = useState("João D.");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const savedPhoto = localStorage.getItem("userPhoto");
    if (savedName) setUserName(savedName);
    if (savedPhoto) setUserPhoto(savedPhoto);
  }, []);

  const initials = userName
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-card rounded-3xl p-5 flex flex-col gap-6 h-full">
      {/* User avatar + New button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 shadow-md">
            <AvatarImage src={userPhoto || ""} />
            <AvatarFallback className="bg-primary/30 text-primary-foreground font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate max-w-[110px]">{userName}</p>
            <p className="text-xs text-muted-foreground">Premium</p>
          </div>
        </div>
        <button className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
          <PenLine size={16} className="text-primary-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onNavChange(item.label)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive
                  ? "bg-primary/15 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              <item.icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${isActive
                      ? "bg-primary/30 text-foreground"
                      : "bg-secondary text-muted-foreground"
                    }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom stats */}
      <div className="mt-auto rounded-2xl bg-surface-elevated p-4">
        <p className="text-xs text-muted-foreground mb-2">Saldo do Mês</p>
        <p className="text-xl font-bold text-foreground">R$ 4.250,00</p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-sm font-medium text-success">+ R$ 8.500</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-sm font-medium text-danger">- R$ 4.250</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarPanel;
