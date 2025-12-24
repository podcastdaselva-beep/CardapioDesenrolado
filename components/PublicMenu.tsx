
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppState, Store, Category, Product } from '../types';
import ProductModal from './ProductModal';

interface PublicMenuProps {
  state: AppState;
  trackMetric: (slug: string, metric: 'visits' | 'productViews' | 'whatsappClicks') => void;
  previewSlug?: string; 
}

const PublicMenu: React.FC<PublicMenuProps> = ({ state, trackMetric, previewSlug }) => {
  const { slug: routeSlug } = useParams();
  const slug = previewSlug || routeSlug;
  
  const store = useMemo(() => state.stores.find(s => s.slug === slug), [state.stores, slug]);
  const categories = useMemo(() => state.categories.filter(c => c.storeId === store?.id).sort((a,b) => a.sortOrder - b.sortOrder), [state.categories, store]);
  const products = useMemo(() => state.products.filter(p => categories.some(c => c.id === p.categoryId)), [state.products, categories]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    if (store && !previewSlug) {
      trackMetric(store.slug, 'visits');
    }
  }, [store, previewSlug]);

  const isClosed = useMemo(() => {
    if (!store) return false;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [hOpen, mOpen] = store.operatingHours.open.split(':').map(Number);
    const [hClose, mClose] = store.operatingHours.close.split(':').map(Number);
    const openTime = hOpen * 60 + (mOpen || 0);
    const closeTime = hClose * 60 + (mClose || 0);
    
    if (closeTime < openTime) { 
      return current < openTime && current > closeTime;
    }
    return current < openTime || current > closeTime;
  }, [store]);

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-600">Lanchonete não encontrada.</p>
      </div>
    );
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    if (!previewSlug) {
      trackMetric(store.slug, 'productViews');
    }
  };

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const container = previewSlug ? document.getElementById('preview-container') : window;
      if (previewSlug && container) {
        container.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      } else {
        const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset - 120;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
      setActiveCategory(id);
    }
  };

  return (
    <div className={`min-h-full pb-12 bg-white ${previewSlug ? 'rounded-3xl' : ''}`} style={{ '--primary-color': store.primaryColor } as React.CSSProperties}>
      {isClosed && (
        <div className="sticky top-0 z-[60] bg-gray-900 text-white text-center py-2 text-[10px] md:text-sm font-medium">
          Estamos fechados agora, mas você pode navegar!
        </div>
      )}

      {store.bannerUrl ? (
        <div className="relative h-48 md:h-64 w-full overflow-hidden">
          <img src={store.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      ) : (
        <div className="bg-primary h-24 md:h-32 shadow-lg"></div>
      )}

      <header className={`${store.bannerUrl ? '-mt-12' : '-mt-6'} relative z-10 px-4 md:px-6`}>
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl p-1.5 shadow-xl border-4 border-white mb-4 overflow-hidden">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm w-full">
            <h1 className="text-xl md:text-3xl font-bold leading-tight">{store.name}</h1>
            {store.description && <p className="text-xs md:text-sm text-gray-600 mt-2">{store.description}</p>}
            {store.address && (
              <p className="text-[10px] md:text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2}/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/></svg>
                {store.address}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-50 bg-white border-b overflow-x-auto no-scrollbar shadow-sm mt-6">
        <div className="max-w-3xl mx-auto flex whitespace-nowrap px-4 py-3 gap-6">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`text-[10px] md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 pb-1 ${
                activeCategory === cat.id ? 'border-primary text-primary' : 'border-transparent text-gray-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-8 mt-4">
        {categories.map(cat => (
          <section key={cat.id} id={cat.id}>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">{cat.name}</h2>
            <div className="grid grid-cols-1 gap-4">
              {products
                .filter(p => p.categoryId === cat.id)
                .sort((a,b) => a.sortOrder - b.sortOrder)
                .map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex bg-white border rounded-2xl overflow-hidden text-left hover:border-primary transition-all group shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex-1 p-4 flex flex-col">
                      <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-primary transition-colors">{product.name}</h3>
                      <p className="text-[10px] md:text-xs text-gray-500 line-clamp-2 mt-1 mb-3">{product.description}</p>
                      
                      <div className="mt-auto flex flex-col items-start gap-1">
                        <p className="text-primary text-sm md:text-lg font-black leading-none">
                          R$ {product.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">
                          Visualizar
                        </span>
                      </div>
                    </div>
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 m-3 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          addonGroups={state.addonGroups.filter(g => selectedProduct.addonGroupIds?.includes(g.id))}
          combos={state.combos.filter(c => selectedProduct.upsellIds?.includes(c.id))}
          store={store}
          onClose={() => setSelectedProduct(null)}
          trackMetric={trackMetric}
        />
      )}
    </div>
  );
};

export default PublicMenu;
