import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Bell, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function UserNav() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  
  const initials = profile?.full_name 
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  if (loading) return <div className="h-10 w-10 animate-pulse bg-white/5 rounded-full" />;

  return (
    <div className="flex items-center gap-4">
      {/* Sino de Notificação */}
      <button 
        className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 group transition-all duration-300 active:scale-95 shadow-lg shadow-black/5"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5 text-white/60 group-hover:text-white group-hover:rotate-12 transition-all" />
        <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
      </button>

      {!user ? (
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all border border-primary/20"
        >
          <LogIn size={14} />
          ENTRAR
        </button>
      ) : (
        <button
          onClick={() => navigate("/profile")}
          className="group relative h-10 w-10 rounded-full hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <Avatar className="h-10 w-10 shadow-xl border border-white/10">
            <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="User Profile" />
            <AvatarFallback className="bg-white/5 text-xs font-semibold text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </button>
      )}
    </div>
  );
}
