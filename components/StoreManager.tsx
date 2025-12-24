
import React, { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppState, Store, Category, Product, SelectionType, AddonGroup, Addon, Combo } from '../types';
import { DEFAULT_OPERATING_HOURS } from '../constants';
import PublicMenu from './PublicMenu';
import ProductModal from './ProductModal';

interface StoreManagerProps {
  state: AppState;
  updateStore: (store: Store) => void;
  createStore: (store: Store) => void;
  deleteStore: (id: string) => void;
  updateCategories: (cats: Category[]) => void;
  updateProducts: (prods: Product[]) => void;
  updateAddonGroups: (groups: AddonGroup[]) => void;
  updateCombos: (combos: Combo[]) => void;
}

type Tab = 'overview' | 'menu' | 'settings' | 'preview';
type MenuSubTab = 'produtos' | 'categorias' | 'complementos' | 'combos';

const StoreManager: React.FC<StoreManagerProps> = ({ 
  state, updateStore, createStore, deleteStore, updateCategories, updateProducts, updateAddonGroups, updateCombos
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const store = useMemo(() => state.stores.find(s => s.id === id), [state.stores, id]);
  
  const [activeTab, setActiveTab] = useState<Tab>(isNew ? 'settings' : 'overview');
  const [activeMenuSubTab, setActiveMenuSubTab] = useState<MenuSubTab>('produtos');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<{product: Partial<Product>, catId: string} | null>(null);
  const [editingAddonGroup, setEditingAddonGroup] = useState<Partial<AddonGroup> | null>(null);
  const [editingCombo, setEditingCombo] = useState<Partial<Combo> | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const productImgRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Store>>(() => {
    if (store) return { ...store };
    return {
      name: '',
      slug: '',
      description: '',
      address: '',
      primaryColor: '#ef4444',
      whatsapp: '',
      logoUrl: '',
      bannerUrl: '',
      facebookPixelId: '',
      operatingHours: DEFAULT_OPERATING_HOURS,
    };
  });

  if (!store && !isNew) {
    return <div className="p-8 text-center">Loja não encontrada.</div>;
  }

  const storeId = isNew ? 'temp_new' : store!.id;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'bannerUrl' | 'productImg') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Arquivo muito grande. Máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'productImg') {
          setEditingProduct(prev => prev ? { ...prev, product: { ...prev.product, imageUrl: reader.result as string } } : null);
        } else {
          setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStore: Store = {
      ...(formData as Store),
      id: storeId,
      ownerId: state.user!.id,
      analytics: isNew ? { visits: 0, productViews: 0, whatsappClicks: 0 } : store!.analytics,
      operatingHours: formData.operatingHours || DEFAULT_OPERATING_HOURS
    };

    if (isNew) {
      createStore(finalStore);
      navigate('/admin');
    } else {
      updateStore(finalStore);
      alert('Configurações salvas!');
    }
  };

  // --- CATEGORIAS ---
  const handleAddCategory = () => {
    const name = prompt('Nome da nova categoria:');
    if (name) {
      const newCat: Category = {
        id: `cat_${Date.now()}`,
        storeId: storeId,
        name,
        sortOrder: state.categories.filter(c => c.storeId === storeId).length
      };
      updateCategories([...state.categories, newCat]);
    }
  };

  const handleEditCategory = (cat: Category) => {
    const name = prompt('Editar nome da categoria:', cat.name);
    if (name) {
      updateCategories(state.categories.map(c => c.id === cat.id ? { ...c, name } : c));
    }
  };

  // --- PRODUTOS ---
  const openProductEditor = (catId: string, product?: Product) => {
    setEditingProduct({
      catId,
      product: product ? JSON.parse(JSON.stringify(product)) : {
        name: '',
        description: '',
        basePrice: undefined, // Inicia vazio
        imageUrl: 'https://picsum.photos/seed/placeholder/800/800',
        addonGroupIds: [],
        upsellIds: [],
        sortOrder: state.products.filter(p => p.categoryId === catId).length
      }
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const { product, catId } = editingProduct;
    if (!product.name) return alert('O nome do produto é obrigatório.');
    if (product.basePrice === undefined) return alert('O preço é obrigatório.');
    
    const newProduct: Product = {
      ...(product as Product),
      id: product.id || `prod_${Date.now()}`,
      categoryId: catId,
    };
    if (product.id) {
      updateProducts(state.products.map(p => p.id === product.id ? newProduct : p));
    } else {
      updateProducts([...state.products, newProduct]);
    }
    setEditingProduct(null);
  };

  // --- COMPLEMENTOS GLOBAIS ---
  const openAddonGroupEditor = (group?: AddonGroup) => {
    setEditingAddonGroup(group ? JSON.parse(JSON.stringify(group)) : {
      title: '',
      type: SelectionType.SINGLE,
      minSelection: 0,
      maxSelection: 1,
      addons: [],
      storeId: storeId
    });
  };

  const handleSaveAddonGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddonGroup) return;
    const finalGroup = { ...editingAddonGroup, id: editingAddonGroup.id || `group_${Date.now()}` } as AddonGroup;
    if (editingAddonGroup.id) {
      updateAddonGroups(state.addonGroups.map(g => g.id === editingAddonGroup.id ? finalGroup : g));
    } else {
      updateAddonGroups([...state.addonGroups, finalGroup]);
    }
    setEditingAddonGroup(null);
  };

  const handleAddAddonToGroup = () => {
    if (!editingAddonGroup) return;
    const newAddon: Addon = { id: `addon_${Date.now()}`, name: '', price: undefined as any }; // Inicia vazio
    setEditingAddonGroup({ ...editingAddonGroup, addons: [...(editingAddonGroup.addons || []), newAddon] });
  };

  // --- COMBOS / UPSELLS ---
  const openComboEditor = (combo?: Combo) => {
    setEditingCombo(combo ? JSON.parse(JSON.stringify(combo)) : {
      name: '',
      description: '',
      price: undefined as any, // Inicia vazio
      storeId: storeId
    });
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;
    if (editingCombo.price === undefined) return alert('O preço do upsell é obrigatório.');
    
    const finalCombo = { ...editingCombo, id: editingCombo.id || `combo_${Date.now()}` } as Combo;
    if (editingCombo.id) {
      updateCombos(state.combos.map(c => c.id === editingCombo.id ? finalCombo : c));
    } else {
      updateCombos([...state.combos, finalCombo]);
    }
    setEditingCombo(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm('Deseja excluir esta categoria e todos os seus produtos?')) {
      updateCategories(state.categories.filter(c => c.id !== catId));
      updateProducts(state.products.filter(p => p.categoryId !== catId));
    }
  };

  const handleRemoveProduct = (prodId: string) => {
    if (confirm('Deseja excluir este produto?')) {
      updateProducts(state.products.filter(p => p.id !== prodId));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumo', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" strokeWidth={2}/></svg> },
    { id: 'menu', label: 'Cardápio', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeWidth={2}/></svg> },
    { id: 'preview', label: 'Visualizar', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth={2}/></svg> },
    { id: 'settings', label: 'Configurações', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth={2}/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/></svg> }
  ];

  const menuSubTabs = [
    { id: 'produtos', label: 'Produtos' },
    { id: 'categorias', label: 'Categorias' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'combos', label: 'Combos' }
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen -mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Sidebar de Navegação */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 z-20 sticky top-0 md:h-[calc(100vh-64px)]">
        <div className="p-4 border-b border-gray-100 hidden md:block">
          <button onClick={() => navigate('/admin')} className="text-gray-500 text-xs font-bold hover:text-gray-700 flex items-center gap-2 mb-4 uppercase tracking-widest">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
            Suas Lojas
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-100">
              {store?.name.charAt(0) || 'N'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-gray-900 truncate">{store?.name || 'Nova Loja'}</p>
              <p className="text-[10px] text-gray-400 font-bold truncate">/{store?.slug || 'slug-pendente'}</p>
            </div>
          </div>
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar p-2 md:p-4 gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap md:w-full ${activeTab === tab.id ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 bg-gray-50/50 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && store && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-2xl font-black text-gray-900">Resumo da Loja</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Visitas</p>
                  <h4 className="text-3xl font-black text-gray-900">{store.analytics.visits}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Prod. Visualizados</p>
                  <h4 className="text-3xl font-black text-gray-900">{store.analytics.productViews}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Cliques WhatsApp</p>
                  <h4 className="text-3xl font-black text-gray-900">{store.analytics.whatsappClicks}</h4>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-black text-gray-900">Gestão do Cardápio</h2>
                <div className="flex border-b border-gray-200 gap-8 overflow-x-auto no-scrollbar">
                  {menuSubTabs.map(sub => (
                    <button key={sub.id} onClick={() => setActiveMenuSubTab(sub.id as MenuSubTab)} className={`pb-4 px-1 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${activeMenuSubTab === sub.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ABA PRODUTOS */}
              {activeMenuSubTab === 'produtos' && (
                <div className="space-y-6">
                  {state.categories.filter(c => c.storeId === storeId).map(cat => (
                    <div key={cat.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">{cat.name}</h4>
                        <button onClick={() => openProductEditor(cat.id)} className="bg-white text-red-600 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-black hover:bg-red-50 transition-colors shadow-sm">+ Produto</button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {state.products.filter(p => p.categoryId === cat.id).map(prod => (
                          <div key={prod.id} className="p-4 flex items-center gap-6 hover:bg-gray-50 group">
                            <img src={prod.imageUrl} className="w-14 h-14 rounded-2xl object-cover border" />
                            <div className="flex-1">
                              <p className="font-black text-gray-900 leading-tight">{prod.name}</p>
                              <p className="text-xs text-red-600 font-bold mt-1">R$ {prod.basePrice.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                              <button onClick={() => openProductEditor(cat.id, prod)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2}/></svg></button>
                              <button onClick={() => handleRemoveProduct(prod.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/></svg></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ABA CATEGORIAS */}
              {activeMenuSubTab === 'categorias' && (
                <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-black text-gray-900 uppercase text-xs">Suas Categorias</h3>
                    <button onClick={handleAddCategory} className="text-xs bg-red-600 text-white px-4 py-2 rounded-xl font-bold">+ Criar Categoria</button>
                  </div>
                  <div className="divide-y">
                    {state.categories.filter(c => c.storeId === storeId).map((cat, idx) => (
                      <div key={cat.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
                        <p className="font-bold text-gray-800">{cat.name}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditCategory(cat)} className="text-gray-400 hover:text-blue-600 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2}/></svg></button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-600 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA COMPLEMENTOS GLOBAIS */}
              {activeMenuSubTab === 'complementos' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black">Biblioteca de Complementos</h3>
                    <button onClick={() => openAddonGroupEditor()} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-red-100">+ Criar Grupo Global</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.addonGroups.filter(g => g.storeId === storeId).map(group => (
                      <div key={group.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-gray-900">{group.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{group.addons.length} opções • {group.type === SelectionType.SINGLE ? 'Única' : 'Múltipla'}</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => openAddonGroupEditor(group)} className="flex-1 text-xs bg-gray-50 py-2 rounded-lg font-bold hover:bg-gray-100">Editar Grupo</button>
                          <button onClick={() => updateAddonGroups(state.addonGroups.filter(g => g.id !== group.id))} className="px-3 text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA COMBOS */}
              {activeMenuSubTab === 'combos' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black">Biblioteca de Combos</h3>
                    <button onClick={() => openComboEditor()} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-red-100">+ Criar Novo Upsell</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.combos.filter(c => c.storeId === storeId).map(combo => (
                      <div key={combo.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-gray-900">{combo.name}</h4>
                          <p className="text-sm text-red-600 font-bold mt-1">+ R$ {combo.price.toFixed(2)}</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => openComboEditor(combo)} className="flex-1 text-xs bg-gray-50 py-2 rounded-lg font-bold hover:bg-gray-100">Editar Upsell</button>
                          <button onClick={() => updateCombos(state.combos.filter(c => c.id !== combo.id))} className="px-3 text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-2xl font-black mb-8">Configurações Gerais</h2>
              <form onSubmit={handleSaveSettings} className="space-y-10">
                
                {/* IDENTIDADE VISUAL */}
                <section className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
                  <h3 className="text-lg font-black text-gray-900 border-b pb-4">Identidade Visual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Logo (Perfil)</label>
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-32 h-32 rounded-3xl border-4 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-red-400 transition-all overflow-hidden relative group"
                      >
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">Alterar</div>
                      </div>
                      <input ref={logoInputRef} type="file" className="hidden" onChange={e => handleFileChange(e, 'logoUrl')} />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Banner Superior</label>
                      <div 
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full h-32 rounded-3xl border-4 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-red-400 transition-all overflow-hidden relative group"
                      >
                        {formData.bannerUrl ? (
                          <img src={formData.bannerUrl} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">Alterar Banner</div>
                      </div>
                      <input ref={bannerInputRef} type="file" className="hidden" onChange={e => handleFileChange(e, 'bannerUrl')} />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Cor Principal</label>
                      <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border">
                        <input 
                          type="color" 
                          value={formData.primaryColor} 
                          onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-12 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-sm font-bold text-gray-600 uppercase">{formData.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* INFORMAÇÕES DA LOJA */}
                <section className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
                  <h3 className="text-lg font-black text-gray-900 border-b pb-4">Informações da Loja</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Nome da Loja</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">URL Amigável (Slug)</label>
                      <div className="flex items-center bg-gray-50 rounded-2xl border px-5">
                        <span className="text-gray-400 font-bold text-sm">menu.com/</span>
                        <input required type="text" value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="flex-1 py-3 bg-transparent border-none outline-none font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">WhatsApp de Recebimento</label>
                      <input required type="text" value={formData.whatsapp} placeholder="5511999999999" onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Descrição da Loja (Bio)</label>
                      <textarea rows={3} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border focus:ring-2 focus:ring-red-500 outline-none font-medium text-sm resize-none" placeholder="Conte um pouco sobre sua lanchonete..." />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Endereço Completo</label>
                      <input type="text" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border focus:ring-2 focus:ring-red-500 outline-none font-medium text-sm" placeholder="Rua, Número, Bairro, Cidade/UF" />
                    </div>
                  </div>
                </section>

                {/* HORÁRIOS DE FUNCIONAMENTO */}
                <section className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
                  <h3 className="text-lg font-black text-gray-900 border-b pb-4">Horário de Funcionamento</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Abertura</label>
                      <input 
                        type="time" 
                        value={formData.operatingHours?.open} 
                        onChange={e => setFormData(prev => ({ ...prev, operatingHours: { ...prev.operatingHours!, open: e.target.value } }))} 
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border focus:ring-2 focus:ring-red-500 outline-none font-bold" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Fechamento</label>
                      <input 
                        type="time" 
                        value={formData.operatingHours?.close} 
                        onChange={e => setFormData(prev => ({ ...prev, operatingHours: { ...prev.operatingHours!, close: e.target.value } }))} 
                        className="w-full px-5 py-3 bg-gray-50 rounded-2xl border focus:ring-2 focus:ring-red-500 outline-none font-bold" 
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 italic">* O sistema exibirá um aviso de "Fechado" fora destes horários, mas continuará permitindo pedidos se você desejar.</p>
                </section>

                <div className="flex justify-end gap-4 pt-4 pb-12">
                   {!isNew && (
                     <button type="button" onClick={() => {if(confirm('Deseja realmente excluir esta loja? Todos os dados serão perdidos.')) deleteStore(store!.id)}} className="px-8 py-4 rounded-2xl text-red-600 font-bold hover:bg-red-50 transition-colors">Excluir Loja</button>
                   )}
                   <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">Salvar Todas as Alterações</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'preview' && store && (
            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">Visualização do Cliente</h2>
                <p className="text-gray-500">Veja exatamente como seu cardápio aparece no celular.</p>
              </div>
              <div className="relative mx-auto border-[12px] border-gray-900 rounded-[3rem] h-[720px] w-[340px] shadow-2xl overflow-hidden bg-gray-900 ring-4 ring-gray-100">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-50"></div>
                <div id="preview-container" className="rounded-[2.2rem] overflow-hidden w-full h-full bg-white overflow-y-auto no-scrollbar">
                  <PublicMenu 
                    state={state} 
                    trackMetric={() => {}} 
                    previewSlug={store.slug} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL EDITOR DE PRODUTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
            <div className="p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-black">Editor de Produto</h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="bg-gray-100 p-2 rounded-2xl hover:bg-red-50 hover:text-red-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div onClick={() => productImgRef.current?.click()} className="aspect-square w-full rounded-[2.5rem] bg-gray-50 border-4 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-red-400 overflow-hidden relative group">
                  {editingProduct.product.imageUrl ? <img src={editingProduct.product.imageUrl} className="w-full h-full object-cover" /> : <p className="text-xs font-black text-gray-300 uppercase">Foto do Produto</p>}
                </div>
                <input ref={productImgRef} type="file" className="hidden" onChange={e => handleFileChange(e, 'productImg')} />
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase block mb-2">Nome</label>
                    <input required type="text" value={editingProduct.product.name} onChange={e => setEditingProduct(prev => prev ? { ...prev, product: { ...prev.product, name: e.target.value } } : null)} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold text-gray-900 focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase block mb-2">Preço (R$)</label>
                    <input required type="number" step="0.01" value={editingProduct.product.basePrice ?? ''} onChange={e => setEditingProduct(prev => prev ? { ...prev, product: { ...prev.product, basePrice: parseFloat(e.target.value) } } : null)} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-black text-red-600 text-xl focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
              </div>

              {/* VINCULAR COMPLEMENTOS GLOBAIS */}
              <div className="space-y-4 pt-8 border-t">
                <h4 className="text-lg font-black">Complementos Vinculados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.addonGroups.filter(g => g.storeId === storeId).map(group => (
                    <label key={group.id} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${editingProduct.product.addonGroupIds?.includes(group.id) ? 'border-red-500 bg-red-50' : 'border-gray-50 bg-white'}`}>
                      <input type="checkbox" className="w-5 h-5 accent-red-600" checked={editingProduct.product.addonGroupIds?.includes(group.id)} onChange={e => {
                        const current = editingProduct.product.addonGroupIds || [];
                        const next = e.target.checked ? [...current, group.id] : current.filter(id => id !== group.id);
                        setEditingProduct({ ...editingProduct, product: { ...editingProduct.product, addonGroupIds: next } });
                      }} />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{group.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black">{group.addons.length} opções</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* VINCULAR UPSELLS */}
              <div className="space-y-4 pt-8 border-t">
                <h4 className="text-lg font-black">Upsells Recomendados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.combos.filter(c => c.storeId === storeId).map(combo => (
                    <label key={combo.id} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${editingProduct.product.upsellIds?.includes(combo.id) ? 'border-red-500 bg-red-50' : 'border-gray-50 bg-white'}`}>
                      <input type="checkbox" className="w-5 h-5 accent-red-600" checked={editingProduct.product.upsellIds?.includes(combo.id)} onChange={e => {
                        const current = editingProduct.product.upsellIds || [];
                        const next = e.target.checked ? [...current, combo.id] : current.filter(id => id !== combo.id);
                        setEditingProduct({ ...editingProduct, product: { ...editingProduct.product, upsellIds: next } });
                      }} />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{combo.name}</p>
                        <p className="text-[10px] text-red-600 font-black">+ R$ {combo.price.toFixed(2)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 border-t bg-white sticky bottom-0 z-10 flex gap-4">
              <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-4 border-2 border-gray-100 text-gray-500 font-black rounded-2xl">Cancelar</button>
              <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100">Salvar Produto</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDITOR DE GRUPO DE COMPLEMENTOS */}
      {editingAddonGroup && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={handleSaveAddonGroup} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black">Grupo de Complementos</h3>
              <button type="button" onClick={() => setEditingAddonGroup(null)} className="text-gray-400 hover:text-red-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase block mb-2">Título do Grupo</label>
                  <input required type="text" value={editingAddonGroup.title} onChange={e => setEditingAddonGroup({ ...editingAddonGroup, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase block mb-2">Tipo</label>
                    <select value={editingAddonGroup.type} onChange={e => setEditingAddonGroup({ ...editingAddonGroup, type: e.target.value as SelectionType, maxSelection: e.target.value === SelectionType.SINGLE ? 1 : editingAddonGroup.maxSelection })} className="w-full px-3 py-3 bg-gray-50 rounded-2xl font-bold text-xs">
                      <option value={SelectionType.SINGLE}>Única</option>
                      <option value={SelectionType.MULTIPLE}>Múltipla</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase block mb-2">Máximo</label>
                    <input type="number" value={editingAddonGroup.maxSelection} onChange={e => setEditingAddonGroup({ ...editingAddonGroup, maxSelection: parseInt(e.target.value) || 1 })} disabled={editingAddonGroup.type === SelectionType.SINGLE} className="w-full px-3 py-3 bg-gray-50 rounded-2xl text-center font-bold text-xs disabled:opacity-50" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opções de Adicionais</p>
                  <button type="button" onClick={handleAddAddonToGroup} className="text-xs font-black text-red-600 hover:underline">+ Adicionar Opção</button>
                </div>
                {editingAddonGroup.addons?.map((addon, idx) => (
                  <div key={addon.id} className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm">
                    <input type="text" placeholder="Nome" value={addon.name} onChange={e => {
                      const newAddons = [...(editingAddonGroup.addons || [])];
                      newAddons[idx].name = e.target.value;
                      setEditingAddonGroup({ ...editingAddonGroup, addons: newAddons });
                    }} className="flex-1 bg-transparent border-none outline-none font-bold text-sm" />
                    <div className="flex items-center gap-1 border-l pl-3">
                      <span className="text-[10px] text-gray-400 font-bold">R$</span>
                      <input type="number" step="0.01" value={addon.price ?? ''} onChange={e => {
                        const newAddons = [...(editingAddonGroup.addons || [])];
                        newAddons[idx].price = parseFloat(e.target.value);
                        setEditingAddonGroup({ ...editingAddonGroup, addons: newAddons });
                      }} className="w-16 bg-transparent border-none text-red-600 font-black text-sm outline-none" />
                    </div>
                    <button type="button" onClick={() => setEditingAddonGroup({ ...editingAddonGroup, addons: editingAddonGroup.addons?.filter(a => a.id !== addon.id) })} className="text-gray-300 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 border-t bg-white flex gap-4">
              <button type="button" onClick={() => setEditingAddonGroup(null)} className="flex-1 py-4 border-2 border-gray-100 text-gray-500 font-black rounded-2xl">Descartar</button>
              <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100">Salvar Grupo</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDITOR DE COMBO */}
      {editingCombo && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={handleSaveCombo} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black">Novo Upsell</h3>
              <button type="button" onClick={() => setEditingCombo(null)} className="text-gray-400 hover:text-red-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-2">Nome da Oferta</label>
                <input required type="text" placeholder="Ex: Adicionar Batata + Refri" value={editingCombo.name} onChange={e => setEditingCombo({ ...editingCombo, name: e.target.value })} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-2">Preço Adicional (R$)</label>
                <input required type="number" step="0.01" value={editingCombo.price ?? ''} onChange={e => setEditingCombo({ ...editingCombo, price: parseFloat(e.target.value) })} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none font-black text-red-600 text-xl focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-2">O que vem no combo?</label>
                <textarea rows={3} value={editingCombo.description} onChange={e => setEditingCombo({ ...editingCombo, description: e.target.value })} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-sm font-medium focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
            </div>
            <div className="p-8 border-t bg-white flex gap-4">
              <button type="button" onClick={() => setEditingCombo(null)} className="flex-1 py-4 border-2 border-gray-100 text-gray-500 font-black rounded-2xl">Cancelar</button>
              <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100">Criar Oferta</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StoreManager;
