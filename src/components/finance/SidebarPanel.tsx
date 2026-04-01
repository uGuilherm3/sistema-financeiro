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



interface SidebarPanelProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  salary?: number;
  totalLimits?: number;
  totalExpenses?: number;
}

import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const SidebarPanel = ({ activeNav, onNavChange, salary = 0, totalLimits = 0, totalExpenses = 0 }: SidebarPanelProps) => {
  const { profile, user, loading } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: "Visão Geral", count: 0 },
    { icon: StickyNote, label: "Minhas Notas", count: 3 },
    { icon: TrendingUp, label: "Limites", count: 0 },
    { icon: TrendingDown, label: "Despesas", count: 5 },
    { icon: PiggyBank, label: "Orçamentos", count: 0 },
    { icon: Trash2, label: "Lixeira", count: 0 },
  ];

  const userName = profile?.full_name || user?.email?.split('@')[0] || "Iniciante";
  const userPhoto = profile?.avatar_url || (user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : null);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  if (loading) {
    return (
      <aside className="w-64 shrink-0 bg-card rounded-3xl p-5 flex flex-col gap-6 h-full animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5" />
          <div className="space-y-2">
            <div className="w-24 h-3 bg-white/5 rounded" />
            <div className="w-16 h-2 bg-white/5 rounded" />
          </div>
        </div>
        <div className="flex-1 space-y-4 pt-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-10 bg-white/5 rounded-xl" />)}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 bg-card rounded-3xl p-5 flex flex-col gap-6 h-full">
      {/* User avatar + New button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 shadow-md">
            <AvatarImage src={userPhoto || ""} />
            <AvatarFallback className="bg-primary/20 text-white font-semibold text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate max-w-[110px]">{userName}</p>
            <p className="text-xs text-muted-foreground font-medium opacity-60">Premium Access</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-all active:scale-95 group shadow-sm"
        >
          <PenLine size={14} className="text-muted-foreground group-hover:text-white" />
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
        <p className="text-xl font-bold text-foreground">R$ {(salary - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-xs text-muted-foreground">Limites</p>
            <p className="text-sm font-medium text-success">+ R$ {totalLimits.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-sm font-medium text-danger">- R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarPanel;
