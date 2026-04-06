import os
import re

filepath = r"c:\Projetos\radiant-notes-cash\src\components\finance\CardsPage.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Sync logic in useEffect
sync_pattern = r"if\s*\(currentIds\s*!==\s*propIds\s*\|\|\s*displayCards\.length\s*!==\s*cards\.length\)\s*{\s*setDisplayCards\(cards\);\s*}"
sync_replacement = """if (currentIds !== propIds || displayCards.length !== cards.length) {
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

# 2. Update handleCardSelect logic
select_pattern = r"const\s*handleCardSelect\s*=\s*\(cardId:\s*string\)\s*=>\s*{\s*setActiveCardId\(cardId\);\s*const\s*index\s*=\s*displayCards\.findIndex\(c\s*=>\s*c\.id\s*===\s*cardId\);\s*if\s*\(index\s*===\s*-1\)\s*return;\s*const\s*newOrder\s*=\s*\[\.\.\.displayCards\.slice\(0,\s*index\),\s*\.\.\.displayCards\.slice\(index\s*\+\s*1\),\s*displayCards\[index\]\];\s*setDisplayCards\(newOrder\);\s*};"
select_replacement = """const handleCardSelect = (cardId: string) => {
       setActiveCardId(cardId);
       const index = displayCards.findIndex(c => c.id === cardId);
       if (index === -1) return;
       
       const newOrder = [...displayCards.slice(0, index), ...displayCards.slice(index + 1), displayCards[index]];
       setDisplayCards(newOrder);
       
       // Salva a preferência
       localStorage.setItem('preferred_card_id', String(cardId));
    };"""

content = re.sub(sync_pattern, sync_replacement, content, flags=re.MULTILINE)
content = re.sub(select_pattern, select_replacement, content, flags=re.MULTILINE)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
