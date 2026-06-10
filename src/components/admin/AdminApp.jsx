import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import DashboardView from './DashboardView';
import LeadsView from './LeadsView';
import FleetView from './FleetView';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setLoading(false);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Verifying Credentials...</div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Secure Portal</span>
            <h1 className="text-2xl font-black text-slate-900 mt-4">EuroDrive OS</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Internal Intelligence & Fleet Management</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center">{authError}</div>}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operator Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Passcode</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-6 rounded-xl shadow-lg transition mt-4">
              {loading ? 'Authenticating...' : 'Engage Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-indigo-950 text-white p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="text-lg font-black tracking-tight">EuroDrive OS</span>
            <div className="hidden md:flex gap-2">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-800' : 'hover:bg-indigo-900 text-indigo-300'}`}>BI Dashboard</button>
              <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'leads' ? 'bg-indigo-800' : 'hover:bg-indigo-900 text-indigo-300'}`}>Lead Queue</button>
              <button onClick={() => setActiveTab('fleet')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'fleet' ? 'bg-indigo-800' : 'hover:bg-indigo-900 text-indigo-300'}`}>Fleet & Drivers</button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-indigo-300">{session.user.email}</span>
            <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition font-bold">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {activeTab === 'dashboard' && <DashboardView supabase={supabase} />}
        {activeTab === 'leads' && <LeadsView supabase={supabase} />}
        {activeTab === 'fleet' && <FleetView supabase={supabase} />}
      </main>
    </div>
  );
}
