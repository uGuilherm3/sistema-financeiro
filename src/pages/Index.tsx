import { useState } from "react";
import SidebarPanel from "@/components/finance/SidebarPanel";
import ListPanel, { items } from "@/components/finance/ListPanel";
import DetailPanel from "@/components/finance/DetailPanel";
import ActionPanel from "@/components/finance/ActionPanel";
import NotesPanel from "@/components/finance/NotesPanel";
import { UserNav } from "@/components/finance/UserNav";
import SpotifyCard from "@/components/finance/SpotifyCard";
import { useSpotify } from "@/hooks/useSpotify";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Index = () => {
  const { handleAuthCallback } = useSpotify();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState("Visão Geral");
  const [activeItemId, setActiveItemId] = useState(1);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      handleAuthCallback(code);
    }
  }, [handleAuthCallback]);

  const selectedItem = items.find((i) => i.id === activeItemId);

  const [activeTab, setActiveTab] = useState("Home");

  return (
    <div className="h-screen bg-background p-4 flex gap-4 overflow-hidden relative">
      {/* Navbar centralizado com o site (viewport) */}
      <nav className="fixed left-1/2 -translate-x-1/2 top-6 bg-white/5 backdrop-blur-md rounded-2xl p-1 flex gap-1 shadow-2xl z-50">
        {["Home", "Dashboard", "Agenda"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative ${isActive
                ? "text-white bg-white/10 shadow-sm"
                : "text-muted-foreground hover:text-white"
                }`}
            >
              {tab}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <SidebarPanel activeNav={activeNav} onNavChange={setActiveNav} />

      <div className="flex-1 flex flex-col gap-4">
        <header className="px-4 py-2 flex items-center justify-end min-h-[56px]">
          <UserNav />
        </header>

        <div className="flex gap-4 flex-1 overflow-hidden">
          <ListPanel activeId={activeItemId} onSelect={setActiveItemId} />
          <div className="flex-1 flex gap-4 min-w-0">
            <div className="flex-1 flex flex-col gap-3 min-w-0">
               <div className="px-1 py-1 flex items-baseline">
                  <h1 className="text-3xl font-medium text-white tracking-tight">
                    Olá, {profile?.full_name?.split(' ')[0] || "Comandante"}! 
                    <span className="ml-3 text-white/80">O que vamos fazer hoje?</span>
                  </h1>
               </div>
               <DetailPanel item={selectedItem} />
            </div>
            <NotesPanel />
          </div>
          <div className="flex flex-col gap-4 w-80 shrink-0 h-full">
            <div className="shrink-0 w-full">
              <SpotifyCard />
            </div>
            <ActionPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
