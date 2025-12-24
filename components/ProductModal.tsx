
import React, { useState, useMemo } from 'react';
import { Product, Store, SelectionType, Addon, AddonGroup, Combo } from '../types';

interface ProductModalProps {
  product: Product;
  addonGroups: AddonGroup[];
  combos: Combo[]; // Recebe os combos (upsells) vinculados
  store: Store;
  onClose: () => void;
  trackMetric: (slug: string, metric: 'visits' | 'productViews' | 'whatsappClicks') => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, addonGroups, combos, store, onClose, trackMetric }) => {
  const [selections, setSelections] = useState<Record<string, Addon[]>>({});
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = useMemo(() => {
    let addonsTotal = 0;
    (Object.values(selections) as Addon[][]).forEach(groupAddons => {
      groupAddons.forEach(addon => {
        addonsTotal += (addon.price || 0);
      });
    });

    let upsellsTotal = 0;
    combos.forEach(combo => {
      if (selectedUpsells.includes(combo.id)) {
        upsellsTotal += (combo.price || 0);
      }
    });

    return (product.basePrice || 0) + addonsTotal + upsellsTotal;
  }, [product, selections, selectedUpsells, combos]);

  const handleSelection = (groupId: string, addon: Addon, type: SelectionType, min: number, max: number) => {
    setSelections(prev => {
      const current = prev[groupId] || [];
      if (type === SelectionType.SINGLE) {
        return { ...prev, [groupId]: [addon] };
      } else {
        const exists = current.find(a => a.id === addon.id);
        if (exists) {
          return { ...prev, [groupId]: current.filter(a => a.id !== addon.id) };
        } else {
          if (current.length >= max) return prev;
          return { ...prev, [groupId]: [...current, addon] };
        }
      }
    });
    setError(null);
  };

  const toggleUpsell = (comboId: string) => {
    setSelectedUpsells(prev => 
      prev.includes(comboId) ? prev.filter(id => id !== comboId) : [...prev, comboId]
    );
  };

  const handleOrder = () => {
    for (const group of addonGroups) {
      const selectedCount = (selections[group.id] || []).length;
      if (selectedCount < group.minSelection) {
        setError(`Por favor, selecione pelo menos ${group.minSelection} item(s) em "${group.title}"`);
        return;
      }
    }

    let message = `Olá! Gostaria de fazer um pedido:\n\n`;
    message += `*1x ${product.name}*\n`;
    
    (Object.entries(selections) as [string, Addon[]][]).forEach(([groupId, addons]) => {
      const group = addonGroups.find(g => g.id === groupId);
      if (addons.length > 0) {
        message += `  - ${group?.title}:\n`;
        addons.forEach(a => {
          message += `    • ${a.name} ${a.price > 0 ? `(+R$ ${a.price.toFixed(2)})` : ''}\n`;
        });
      }
    });

    const activeUpsells = combos.filter(c => selectedUpsells.includes(c.id));
    if (activeUpsells.length > 0) {
      message += `\n*Combos/Extras:*\n`;
      activeUpsells.forEach(c => {
        message += `  • ${c.name} (+R$ ${c.price.toFixed(2)})\n`;
      });
    }

    message += `\n*Total: R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;

    trackMetric(store.slug, 'whatsappClicks');
    if (store.facebookPixelId) {
      console.log(`[PIXEL] Contact tracking for Product: ${product.name}`);
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${store.whatsapp}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-end md:items-center justify-center backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl md:rounded-3xl max-h-[95vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <div className="relative h-64 md:h-80 flex-shrink-0">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white text-gray-900 w-10 h-10 rounded-full shadow-2xl hover:bg-gray-100 flex items-center justify-center border border-gray-200 z-[110]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-2xl font-bold text-red-600 whitespace-nowrap">R$ {(product.basePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <p className="text-gray-500 mt-3 text-sm md:text-base leading-relaxed">{product.description}</p>

          <div className="mt-8 space-y-8">
            {addonGroups.map(group => (
              <div key={group.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{group.title}</h4>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">
                      {group.type === SelectionType.SINGLE ? 'Escolha apenas 1' : `Escolha de ${group.minSelection} a ${group.maxSelection}`}
                    </p>
                  </div>
                  {group.minSelection > 0 && (
                    <span className="bg-red-600 text-white text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">Obrigatório</span>
                  )}
                </div>

                <div className="space-y-3">
                  {group.addons.map(addon => {
                    const isSelected = !!(selections[group.id] || []).find(a => a.id === addon.id);
                    return (
                      <div 
                        key={addon.id} 
                        onClick={() => handleSelection(group.id, addon, group.type, group.minSelection, group.maxSelection)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-red-600 bg-red-50/50' : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                        }`}
                      >
                        {addon.imageUrl && (
                          <img src={addon.imageUrl} alt={addon.name} className="w-14 h-14 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm md:text-base font-bold ${isSelected ? 'text-red-600' : 'text-gray-800'}`}>{addon.name}</p>
                          {addon.price > 0 && (
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">+ R$ {(addon.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'bg-red-600 border-red-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* UPSELLS SECTION */}
            {combos.length > 0 && (
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-gray-900 text-lg mb-4">Turbine seu pedido! 🔥</h4>
                <div className="space-y-3">
                  {combos.map(combo => {
                    const isSelected = selectedUpsells.includes(combo.id);
                    return (
                      <div 
                        key={combo.id}
                        onClick={() => toggleUpsell(combo.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-orange-600 bg-orange-100' : 'bg-white border-transparent shadow-sm'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm md:text-base">{combo.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{combo.description}</p>
                          <p className="text-orange-600 font-black text-sm mt-1">+ R$ {(combo.price || 0).toFixed(2)}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={4}/></svg>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-6 mt-auto shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          {error && <p className="text-red-600 text-xs font-bold mb-4 text-center animate-bounce">{error}</p>}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-black text-gray-900">R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <button
              onClick={handleOrder}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-sm md:text-base"
            >
              Pedir no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
