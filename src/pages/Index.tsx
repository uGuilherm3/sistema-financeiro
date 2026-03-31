import { useState } from "react";
import SidebarPanel from "@/components/finance/SidebarPanel";
import ListPanel, { items } from "@/components/finance/ListPanel";
import DetailPanel from "@/components/finance/DetailPanel";
import ActionPanel from "@/components/finance/ActionPanel";

const Index = () => {
  const [activeNav, setActiveNav] = useState("Visão Geral");
  const [activeItemId, setActiveItemId] = useState(1);

  const selectedItem = items.find((i) => i.id === activeItemId);

  return (
    <div className="min-h-screen bg-background p-4 flex gap-4">
      <SidebarPanel activeNav={activeNav} onNavChange={setActiveNav} />
      <ListPanel activeId={activeItemId} onSelect={setActiveItemId} />
      <DetailPanel item={selectedItem} />
      <ActionPanel />
    </div>
  );
};

export default Index;
