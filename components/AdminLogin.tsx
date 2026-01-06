
import React, { useState } from 'react';
import { AppLanguage } from '../types';

interface Props {
  onLoginSuccess: () => void;
  onBack: () => void;
  t: any;
  lang: AppLanguage;
}

const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBack, t, lang }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'admin1234') {
      onLoginSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-prylom-dark min-h-screen">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl animate-fadeIn">
        <div className="text-center mb-10">
          <div className="text-prylom-gold font-black text-3xl mb-2">Prylom</div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t.adminLogin}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.adminUser}</label>
            <input 
              type="text" 
              value={user}
              onChange={e => setUser(e.target.value)}
              placeholder="admin"
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-prylom-gold rounded-2xl outline-none font-bold text-prylom-dark transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.adminPass}</label>
            <input 
              type="password" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-prylom-gold rounded-2xl outline-none font-bold text-prylom-dark transition-all"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase text-center animate-shake">Denied. Access Restricted.</p>
          )}

          <button 
            type="submit" 
            className="w-full bg-prylom-dark text-white font-black py-5 rounded-full text-xs uppercase tracking-widest hover:bg-prylom-gold transition-all shadow-xl active:scale-95"
          >
            {t.adminEnter}
          </button>
        </form>

        <button 
          onClick={onBack}
          className="w-full mt-8 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-prylom-dark transition-colors"
        >
          {t.btnBack}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
