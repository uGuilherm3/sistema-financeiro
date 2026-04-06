import os

filepath = r"c:\Projetos\radiant-notes-cash\src\components\finance\CardsPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update handleCardSelect to save preference
old_handle = """    const handleCardSelect = (cardId: string) => {
       setActiveCardId(cardId);
       const index = displayCards.findIndex(c => c.id === cardId);
       if (index === -1) return;
       
       const newOrder = [...displayCards.slice(0, index), ...displayCards.slice(index + 1), displayCards[index]];
       setDisplayCards(newOrder);
    };"""

new_handle = """    const handleCardSelect = (cardId: string) => {
       setActiveCardId(cardId);
       const index = displayCards.findIndex(c => c.id === cardId);
       if (index === -1) return;
       
       const newOrder = [...displayCards.slice(0, index), ...displayCards.slice(index + 1), displayCards[index]];
       setDisplayCards(newOrder);
       
       // Salva a preferência
       localStorage.setItem('preferred_card_id', String(cardId));
    };"""

content = content.replace(old_handle, new_handle)

# 2. Update useEffect to restore preference
old_sync = """      if (currentIds !== propIds || displayCards.length !== cards.length) {
          setDisplayCards(cards);
      }"""

new_sync = """      if (currentIds !== propIds || displayCards.length !== cards.length) {
         const savedId = localStorage.getItem('preferred_card_id');
         if (savedId) {
            const index = cards.findIndex(c => c.id === savedId);
            if (index !== -1) {
               const reordered = [...cards.slice(0, index), ...cards.slice(index + 1), cards[index]];
               setDisplayCards(reordered);
               setActiveCardId(savedId);
               return;
            }
         }
         setDisplayCards(cards);
      }"""

content = content.replace(old_sync, new_sync)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
