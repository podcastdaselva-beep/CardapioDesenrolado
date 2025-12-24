
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppState } from '../types';
import { MAX_STORES_PER_USER } from '../constants';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const navigate = useNavigate();
  const canCreateMore = state.stores.length < MAX_STORES_PER_USER;

  return (
    <div className="p-4 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Suas Lojas</h1>
          <p className="text-gray-500 font-medium">{state.stores.length} de {MAX_STORES_PER_USER} lojas criadas</p>
        </div>
        <button
          onClick={() => navigate('/admin/store/new')}
          disabled={!canCreateMore}
          className={`px-6 py-3 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${
            canCreateMore ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          Criar Nova Loja
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.stores.map((store) => (
          <div key={store.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col">
            
            {/* Visual Header - Apenas Banner */}
            <div className="h-40 bg-gray-100 relative overflow-hidden flex-shrink-0">
              {store.bannerUrl ? (
                <img 
                  src={store.bannerUrl} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-400 opacity-20 flex items-center justify-center">
                   <span className="text-red-600 font-black text-2xl opacity-40 italic">MenuSaaS</span>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-red-600 transition-colors">{store.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1 block">menu.com/{store.slug}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                  <p className="text-lg font-black text-gray-900">{store.analytics.visits}</p>
                  <p className="text-[9px] uppercase text-gray-400 font-black tracking-wider">Visitas</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                  <p className="text-lg font-black text-gray-900">{store.analytics.productViews}</p>
                  <p className="text-[9px] uppercase text-gray-400 font-black tracking-wider">Vistos</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                  <p className="text-lg font-black text-gray-900">{store.analytics.whatsappClicks}</p>
                  <p className="text-[9px] uppercase text-gray-400 font-black tracking-wider">Pedidos</p>
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <Link
                  to={`/admin/store/${store.id}`}
                  className="flex-1 text-center bg-gray-900 hover:bg-black text-white py-3.5 rounded-2xl text-xs font-black transition-all active:scale-95"
                >
                  Painel Gestão
                </Link>
                <Link
                  to={`/${store.slug}`}
                  target="_blank"
                  className="px-5 text-center bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2.5}/>
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth={2.5}/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
        
        {state.stores.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Comece agora!</h2>
            <p className="text-gray-500 max-w-xs font-medium">Você ainda não criou nenhuma loja. Que tal começar sua primeira agora mesmo?</p>
            <button
              onClick={() => navigate('/admin/store/new')}
              className="mt-8 bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-all"
            >
              Criar minha primeira loja
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
