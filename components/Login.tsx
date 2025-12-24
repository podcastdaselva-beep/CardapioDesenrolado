
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name: formData.name,
              whatsapp: formData.whatsapp
            }
          }
        });

        if (signUpError) {
          // Tratamento amigável para erro de SMTP do Supabase
          if (signUpError.message.includes('email') || signUpError.status === 422) {
            throw new Error('Erro ao enviar e-mail de confirmação. Verifique se o e-mail está correto ou desative a confirmação de e-mail no painel do Supabase para testes.');
          }
          throw signUpError;
        }

        if (data.user && data.session) {
          // Caso a confirmação de e-mail esteja desativada no Supabase, loga direto
          navigate('/admin');
        } else {
          alert('Conta criada! Verifique sua caixa de entrada (ou spam) para confirmar seu e-mail antes de acessar.');
          setIsRegistering(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (signInError) throw signInError;
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
        
        <div className="bg-red-600 p-10 text-center">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight italic">MenuSaaS</h1>
          <p className="text-red-100 font-medium text-sm">DesenroladoBurguer Dashboard</p>
        </div>

        <div className="p-8 md:p-10">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsRegistering(false); setError(null); }}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${!isRegistering ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setIsRegistering(true); setError(null); }}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${isRegistering ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 leading-relaxed">
              <p>{error}</p>
              {isRegistering && (
                <p className="mt-2 text-[10px] opacity-70 uppercase tracking-tight">
                  Dica: Verifique sua pasta de spam.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Seu Nome</label>
                  <input 
                    name="name"
                    type="text" 
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">WhatsApp</label>
                  <input 
                    name="whatsapp"
                    type="tel" 
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
                    placeholder="55119..."
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
              <input 
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <input 
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95 mt-4 disabled:opacity-50"
            >
              {loading ? 'Processando...' : (isRegistering ? 'Finalizar Cadastro' : 'Acessar Painel')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
