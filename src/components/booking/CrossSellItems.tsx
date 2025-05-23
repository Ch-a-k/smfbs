'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { 
  Tv, 
  Keyboard, 
  Mouse, 
  Printer, 
  Phone, 
  Camera, 
  Wine, 
  Sofa,
  Check 
} from 'lucide-react';
import { ReactElement } from 'react';

// Определение типов для кросс-селов
export type CrossSellItem = {
  id: string;
  name: string;
  icon: ReactElement;
  price: number;
  selected?: boolean;
};

// Типы иконок для предметов (такие же как в ExtraItemsSection.tsx)
type ItemKey = 'glass' | 'keyboard' | 'tvMonitor' | 'furniture' | 'printer' | 'mouse' | 'phone' | 'goProRecording';

// Цены товаров из локализации
const ITEM_PRICES: Record<ItemKey, number> = {
  'glass': 50,        // 10 стеклянных предметов - 50 PLN
  'keyboard': 20,     // Клавиатура - 20 PLN
  'tvMonitor': 100,   // ТВ/монитор - 100 PLN
  'furniture': 120,   // Мебель - 120 PLN
  'printer': 50,      // Принтер - 50 PLN
  'mouse': 10,        // Компьютерная мышь - 10 PLN
  'phone': 30,        // Телефон - 30 PLN
  'goProRecording': 50 // GoPro запись - 50 PLN
};

interface CrossSellItemsProps {
  onItemToggle: (item: CrossSellItem) => void;
  selectedItems: string[];
  totalAdditionalPrice: number;
}

export default function CrossSellItems({ onItemToggle, selectedItems, totalAdditionalPrice }: CrossSellItemsProps) {
  const { t } = useI18n();
  const [crossSellItems, setCrossSellItems] = useState<CrossSellItem[]>([]);

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    // Создаем иконки для элементов
    const getIconForItem = (id: ItemKey): ReactElement => {
      switch (id) {
        case 'glass':
          return <Wine className="w-4 h-4" />;
        case 'keyboard':
          return <Keyboard className="w-4 h-4" />;
        case 'tvMonitor':
          return <Tv className="w-4 h-4" />;
        case 'furniture':
          return <Sofa className="w-4 h-4" />;
        case 'printer':
          return <Printer className="w-4 h-4" />;
        case 'mouse':
          return <Mouse className="w-4 h-4" />;
        case 'phone':
          return <Phone className="w-4 h-4" />;
        case 'goProRecording':
          return <Camera className="w-4 h-4" />;
      }
    };

    // Список всех доступных предметов из ExtraItemsSection
    const extraItemKeys: ItemKey[] = [
      'glass',
      'keyboard',
      'tvMonitor',
      'furniture',
      'printer',
      'mouse',
      'phone',
      'goProRecording'
    ];

    // Создаем элементы для отображения в компоненте
    const items = extraItemKeys.map(itemKey => ({
      id: itemKey,
      name: getItemName(itemKey),
      icon: getIconForItem(itemKey),
      price: ITEM_PRICES[itemKey],
      selected: selectedItems.includes(itemKey)
    }));

    setCrossSellItems(items);
  }, [selectedItems, t]);

  // Получаем название товара из локализации
  const getItemName = (itemKey: ItemKey): string => {
    // Извлекаем только название товара из строки локализации
    // Пример: "10 стеклянных предметов - 50 PLN" -> "10 стеклянных предметов"
    const fullText = t(`home.pricing.extraItems.items.${itemKey}`);
    return fullText.split(' - ')[0];
  };

  // Функция для отрисовки ячейки товара
  const renderItemCell = (item: CrossSellItem, index: number) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <motion.button
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        whileHover={{ y: -3 }}
        onClick={() => onItemToggle(item)}
        className={`relative flex flex-col items-center p-3 rounded-lg border text-center transition-all duration-200
          ${isSelected 
            ? 'border-[#f36e21] bg-[#f36e21]/10' 
            : 'bg-black/40 border-white/10 hover:border-white/20'}`
        }
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-[#f36e21] rounded-full w-5 h-5 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        
        <div className={`p-2 rounded-full ${isSelected ? 'bg-[#f36e21]/20 text-[#f36e21]' : 'bg-black/30 text-gray-400'}`}>
          {item.icon}
        </div>
        
        <div className="mt-2 text-xs font-medium text-gray-300 line-clamp-2 h-8">
          {item.name}
        </div>
        
        <div className={`mt-1 text-sm font-bold ${isSelected ? 'text-[#f36e21]' : 'text-white'}`}>
          {item.price} PLN
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white text-sm font-medium">
          {t('booking.extras.title')}
        </h4>
        
        {totalAdditionalPrice > 0 && (
          <div className="text-[#f36e21] text-sm font-bold">
            +{totalAdditionalPrice} PLN
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-400">
        {t('booking.extras.subtitle')}
      </p>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
        {crossSellItems.map((item, index) => renderItemCell(item, index))}
      </div>
      
      {selectedItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <h5 className="text-white text-xs font-medium mb-2">
            {t('booking.extras.selected')}:
          </h5>
          <div className="space-y-1 text-gray-400 text-xs">
            {selectedItems.map((itemId) => {
              const item = crossSellItems.find(item => item.id === itemId);
              return (
                <div key={itemId} className="flex justify-between">
                  <span className="flex items-center">
                    <Check className="w-3 h-3 mr-1 text-[#f36e21]" />
                    {item?.name}
                  </span>
                  <span>{item?.price} PLN</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-white text-sm font-medium mt-2 pt-2 border-t border-white/10">
            <span>{t('booking.extras.total')}:</span>
            <span className="text-[#f36e21]">{totalAdditionalPrice} PLN</span>
          </div>
        </div>
      )}
    </div>
  );
} 