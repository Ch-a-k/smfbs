'use client';

import { useState } from 'react';

interface CrossSellItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface CrossSellItemsProps {
  items: CrossSellItem[];
  onContinue: (selectedItems: string[]) => void;
}

export function CrossSellItems({ items, onContinue }: CrossSellItemsProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Обработчик выбора/отмены кросс-селла
  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };
  
  // Расчет дополнительной стоимости
  const calculateAdditionalCost = (): number => {
    return items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };
  
  // Обработчик кнопки продолжить
  const handleContinue = () => {
    onContinue(selectedItems);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`
              bg-[#231f20] border rounded-lg p-4 cursor-pointer transition-all
              ${selectedItems.includes(item.id) 
                ? 'border-[#f36e21]' 
                : 'border-white/10 hover:border-white/30'}
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-white">{item.name}</h3>
              <div className="h-5 w-5 rounded-full border border-white/30 flex items-center justify-center">
                {selectedItems.includes(item.id) && (
                  <div className="h-3 w-3 rounded-full bg-[#f36e21]"></div>
                )}
              </div>
            </div>
            <p className="text-white/70 text-sm mb-3">{item.description}</p>
            <div className="text-xl font-bold text-[#f36e21]">{item.price} zł</div>
          </div>
        ))}
      </div>
      
      <div className="bg-[#231f20] border border-white/10 rounded-lg p-4 mt-6">
        <div className="flex justify-between items-center">
          <span className="text-white">Podstawowa cena:</span>
          <span className="text-white font-bold">199 zł</span>
        </div>
        
        {calculateAdditionalCost() > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-white">Dodatki:</span>
            <span className="text-white font-bold">+{calculateAdditionalCost()} zł</span>
          </div>
        )}
        
        <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-center">
          <span className="text-white font-bold">Razem:</span>
          <span className="text-xl font-bold text-[#f36e21]">{199 + calculateAdditionalCost()} zł</span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4 mt-6">
        <button
          type="button"
          onClick={() => onContinue([])}
          className="px-6 py-3 border border-white/20 text-white rounded-md hover:bg-white/5 transition-colors"
        >
          Pomiń dodatki
        </button>
        
        <button
          type="button"
          onClick={handleContinue}
          className="px-6 py-3 bg-[#f36e21] text-white font-bold rounded-md hover:bg-[#ff7b2e] transition-colors"
        >
          {selectedItems.length > 0 ? 'Kontynuuj z dodatkami' : 'Kontynuuj'}
        </button>
      </div>
    </div>
  );
} 