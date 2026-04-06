import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { LogIn, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";

export function UserNav() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  if (loading) return <div className="h-10 w-10 animate-pulse bg-white/5 rounded-full" />;

  return (
    <div className="flex items-center gap-4">
      {/* Busca Expansível (Substitui o Sino) */}
      <div className={`relative flex items-center bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-500 ease-in-out h-10 ${isSearchOpen ? 'w-64' : 'w-10'}`}>
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="z-10 h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300 font-bold active:scale-95 shrink-0"
          aria-label="Buscar"
        >
          {isSearchOpen ? (
            <X size={18} className="text-white/60 hover:text-white transition-colors" />
          ) : (
            <Search size={18} className="text-white/60 group-hover:text-white transition-all group-hover:rotate-12" />
          )}
        </button>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar no cockpit..."
          className={`h-full w-full bg-transparent border-none focus:outline-none text-xs text-white placeholder:text-white/20 transition-all duration-500 ${isSearchOpen
              ? 'pl-2 pr-4 opacity-100 pointer-events-auto'
              : 'pl-0 pr-0 opacity-0 pointer-events-none w-0'
            }`}
        />
      </div>

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
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="User Profile" />
            <AvatarFallback className="bg-white/5 text-xs font-semibold text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </button>
      )}
    </div>
  );
}
