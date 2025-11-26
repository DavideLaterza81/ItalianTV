import React, { useState } from 'react';
import { ADMIN_PASSWORD } from '../constants';

interface AdminLoginProps {
  onLogin: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-lock text-2xl text-brand-accent"></i>
          </div>
          <h2 className="text-2xl font-bold text-white">Area Riservata</h2>
          <p className="text-gray-400 text-sm mt-1">Inserisci la password amministratore</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full bg-gray-950 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent text-center tracking-widest`}
              placeholder="••••••••"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs text-center mt-2">Password non corretta</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-brand-accent hover:bg-brand-hover text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-brand-accent/20"
          >
            Accedi
          </button>
          
          <button 
            type="button"
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-white text-sm py-2 transition-colors"
          >
            Torna alla Home
          </button>
        </form>
      </div>
    </div>
  );
};