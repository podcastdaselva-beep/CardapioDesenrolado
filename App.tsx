
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppState, Store, Category, Product, AddonGroup, Combo, User } from './types';
import { supabase } from './services/supabase';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import StoreManager from './components/StoreManager';
import PublicMenu from './components/PublicMenu';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    user: null,
    stores: [],
    categories: [],
    products: [],
    addonGroups: [],
    combos: [],
  });

  // Listener de Autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleUserData(session.user);
      } else {
        setState(prev => ({ ...prev, user: null }));
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserData = async (sbUser: any) => {
    const user: User = {
      id: sbUser.id,
      email: sbUser.email!,
      whatsapp: sbUser.user_metadata?.whatsapp || '',
    };

    // Buscar dados do usuário no banco
    const [
      { data: stores },
      { data: categories },
      { data: products },
      { data: addonGroups },
      { data: combos }
    ] = await Promise.all([
      supabase.from('stores').select('*').eq('ownerId', user.id),
      supabase.from('categories').select('*'), // Idealmente filtrar por storeIds
      supabase.from('products').select('*'),
      supabase.from('addon_groups').select('*'),
      supabase.from('combos').select('*')
    ]);

    setState({
      user,
      stores: stores || [],
      categories: categories || [],
      products: products || [],
      addonGroups: addonGroups || [],
      combos: combos || [],
    });
    setLoading(false);
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    setState({ user: null, stores: [], categories: [], products: [], addonGroups: [], combos: [] });
  };

  const updateStore = async (updatedStore: Store) => {
    const { error } = await supabase.from('stores').upsert(updatedStore);
    if (!error) {
      setState(prev => ({
        ...prev,
        stores: prev.stores.map(s => s.id === updatedStore.id ? updatedStore : s)
      }));
    }
  };

  const createStore = async (newStore: Store) => {
    const { data, error } = await supabase.from('stores').insert(newStore).select();
    if (!error && data) {
      setState(prev => ({ ...prev, stores: [...prev.stores, data[0]] }));
    }
  };

  const deleteStore = async (id: string) => {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (!error) {
      setState(prev => ({ ...prev, stores: prev.stores.filter(s => s.id !== id) }));
    }
  };

  const trackMetric = async (slug: string, metric: 'visits' | 'productViews' | 'whatsappClicks') => {
    // Incremento otimista no front
    setState(prev => ({
      ...prev,
      stores: prev.stores.map(s => s.slug === slug ? {
        ...s,
        analytics: { ...s.analytics, [metric]: s.analytics[metric] + 1 }
      } : s)
    }));

    // Incremento real no DB
    const store = state.stores.find(s => s.slug === slug);
    if (store) {
      await supabase.rpc('increment_metric', { 
        store_id: store.id, 
        metric_name: metric 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          state.user ? <Navigate to="/admin" /> : <Login />
        } />

        <Route path="/admin/*" element={
          state.user ? (
            <div className="min-h-screen bg-gray-50">
              <Navbar user={state.user} onLogout={onLogout} />
              <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Dashboard state={state} />} />
                  <Route path="/store/:id" element={
                    <StoreManager 
                      state={state} 
                      updateStore={updateStore} 
                      createStore={createStore} 
                      deleteStore={deleteStore}
                      updateCategories={(cats) => setState(p => ({ ...p, categories: cats }))}
                      updateProducts={(prods) => setState(p => ({ ...p, products: prods }))}
                      updateAddonGroups={(groups) => setState(p => ({ ...p, addonGroups: groups }))}
                      updateCombos={(combos) => setState(p => ({ ...p, combos: combos }))}
                    />
                  } />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </Routes>
              </main>
            </div>
          ) : <Navigate to="/login" />
        } />

        <Route path="/:slug" element={<PublicMenu state={state} trackMetric={trackMetric} />} />
        <Route path="/" element={<Navigate to="/admin" />} />
      </Routes>
    </Router>
  );
};

export default App;
