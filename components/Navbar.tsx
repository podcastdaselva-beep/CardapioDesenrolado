
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/admin" className="flex-shrink-0 flex items-center">
              <img src="/logo.png" alt="Desenrolado Burguer" className="h-12 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900 leading-none">{user.email}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Administrador</span>
            </div>
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
