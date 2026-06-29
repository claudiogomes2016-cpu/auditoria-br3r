/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ClipboardList, CheckSquare, Calendar, 
  Settings as SettingsIcon, LogOut, Sun, Moon, Shield, Sparkles, Menu, X 
} from 'lucide-react';

import { Audit, ActionPlan, RemunerationSettings, AccessLog, AuditQuestion, UserRole } from './types';
import Login from './components/Login';
import DashboardView from './components/DashboardView';
import AuditWizard from './components/AuditWizard';
import ActionPlansView from './components/ActionPlansView';
import AuditsHistoryView from './components/AuditsHistoryView';
import SettingsView from './components/SettingsView';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: UserRole } | null>(null);

  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Application Data States
  const [audits, setAudits] = useState<Audit[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [settings, setSettings] = useState<RemunerationSettings | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [questions, setQuestions] = useState<AuditQuestion[]>([]);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);

  // Navigation state: 'DASHBOARD' | 'AUDIT' | 'ACTION_PLANS' | 'HISTORY' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'AUDIT' | 'ACTION_PLANS' | 'HISTORY' | 'SETTINGS'>('DASHBOARD');

  // Mobile menu control
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);

  // 1. Initial hydration and checking saved user in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('prompt_master_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error(err);
      }
    }

    const savedTheme = localStorage.getItem('prompt_master_theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  // 2. Fetch full system data once authenticated
  useEffect(() => {
    if (!currentUser) return;
    fetchSystemData();
  }, [currentUser]);

  // 3. Write Theme class to HTML node
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('prompt_master_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('prompt_master_theme', 'light');
    }
  }, [darkMode]);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const [auditsRes, plansRes, settingsRes, logsRes, questionsRes] = await Promise.all([
        fetch('/api/audits'),
        fetch('/api/action-plans'),
        fetch('/api/settings'),
        fetch('/api/logs'),
        fetch('/api/questions')
      ]);

      const [auditsData, plansData, settingsData, logsData, questionsData] = await Promise.all([
        auditsRes.json(),
        plansRes.json(),
        settingsRes.json(),
        logsRes.json(),
        questionsRes.json()
      ]);

      setAudits(auditsData);
      setActionPlans(plansData);
      setSettings(settingsData);
      setAccessLogs(logsData);
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error fetching platform data', err);
    } finally {
      setLoading(false);
    }
  };

  // Callback: login trigger
  const handleLoginSuccess = (user: { username: string; name: string; role: UserRole }) => {
    setCurrentUser(user);
    localStorage.setItem('prompt_master_user', JSON.stringify(user));
  };

  // Callback: logout trigger
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('prompt_master_user');
    setActiveTab('DASHBOARD');
  };

  // API Callbacks for mutations

  // Tab switcher wrapper to reset edit mode if we navigate away from AUDIT
  const handleTabChange = (tabId: 'DASHBOARD' | 'AUDIT' | 'ACTION_PLANS' | 'HISTORY' | 'SETTINGS') => {
    setActiveTab(tabId);
    if (tabId !== 'AUDIT') {
      setEditingAudit(null);
    }
  };

  // 1. Create/Update audit
  const handleSubmitAudit = async (auditData: Omit<Audit, 'id' | 'createdAt'>, id?: string): Promise<boolean> => {
    try {
      const url = id ? `/api/audits/${id}` : '/api/audits';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData)
      });
      if (res.ok) {
        // Hydrate data again
        await fetchSystemData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // 2. Update action plan status / logs
  const handleUpdateActionPlan = async (
    id: string, 
    status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO', 
    observations: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/action-plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, observations, user: currentUser?.name })
      });
      if (res.ok) {
        // Hydrate data again
        await fetchSystemData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // 3. Update settings / Remuneration table rules
  const handleUpdateSettings = async (newSettings: RemunerationSettings): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        await fetchSystemData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // 4. Reset database mock files
  const handleResetDatabase = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // If not logged in, show the beautiful Login Panel
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const navItems = [
    { id: 'DASHBOARD' as const, label: 'Dashboard Executivo', icon: <BarChart3 className="h-4 w-4" />, roles: ['ADMIN', 'SUPERVISOR', 'AUDITOR', 'VISUALIZADOR'] },
    { id: 'AUDIT' as const, label: 'Nova Auditoria', icon: <ClipboardList className="h-4 w-4" />, roles: ['ADMIN', 'SUPERVISOR', 'AUDITOR'] },
    { id: 'ACTION_PLANS' as const, label: 'Planos de Ação', icon: <CheckSquare className="h-4 w-4" />, roles: ['ADMIN', 'SUPERVISOR', 'AUDITOR', 'VISUALIZADOR'] },
    { id: 'HISTORY' as const, label: 'Histórico', icon: <Calendar className="h-4 w-4" />, roles: ['ADMIN', 'SUPERVISOR', 'AUDITOR', 'VISUALIZADOR'] },
    { id: 'SETTINGS' as const, label: 'Configurações', icon: <SettingsIcon className="h-4 w-4" />, roles: ['ADMIN', 'SUPERVISOR'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Header Navigation (Hidden when printing reports) */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-150 dark:border-slate-850 px-6 py-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-display font-black text-lg text-white tracking-tight shadow-md shadow-indigo-600/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100">AUDITORIA BR3R</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">v2.0</span>
            </div>
            <span className="text-xs block text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Ball Corporation & Sodexo · BR3R</span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-850">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg tracking-wide transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side controls (Theme switch, user details, logout) */}
        <div className="hidden lg:flex items-center gap-4">
          
          {/* Theme switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
          </button>

          {/* User Profile display */}
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-850 pl-4">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                {currentUser.name}
              </span>
              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">
                {currentUser.role}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-600 uppercase border border-slate-200 dark:border-slate-800">
              {currentUser.name.slice(0, 2)}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
            title="Sair do sistema"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>

        </div>

        {/* Mobile menu toggle */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-400 cursor-pointer"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </header>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[73px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 z-45 flex flex-col p-4 space-y-3 shadow-lg no-print animate-fade-in">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                handleTabChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 p-3 text-xs font-bold rounded-xl tracking-wide w-full text-left transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-500 uppercase">
                {currentUser.name.slice(0, 2)}
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">{currentUser.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{currentUser.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-bold cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-medium font-mono uppercase tracking-wider">
              Conectando com o servidor de banco de dados Ball...
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'DASHBOARD' && (
              <DashboardView 
                audits={audits} 
                questions={questions} 
              />
            )}

            {activeTab === 'AUDIT' && (
              <AuditWizard
                currentUser={currentUser}
                questions={questions}
                settings={settings || { table: [], maxBonusValue: 250 }}
                onSubmitAudit={handleSubmitAudit}
                editingAudit={editingAudit}
                onCancelEdit={() => {
                  setEditingAudit(null);
                  setActiveTab('HISTORY');
                }}
              />
            )}

            {activeTab === 'ACTION_PLANS' && (
              <ActionPlansView
                actionPlans={actionPlans}
                currentUser={currentUser}
                onUpdateActionPlan={handleUpdateActionPlan}
              />
            )}

            {activeTab === 'HISTORY' && (
              <AuditsHistoryView
                audits={audits}
                questions={questions}
                onEditAudit={(audit) => {
                  setEditingAudit(audit);
                  setActiveTab('AUDIT');
                }}
              />
            )}

            {activeTab === 'SETTINGS' && (
              <SettingsView
                settings={settings || { table: [], maxBonusValue: 250 }}
                accessLogs={accessLogs}
                currentUser={currentUser}
                onUpdateSettings={handleUpdateSettings}
                onResetDatabase={handleResetDatabase}
              />
            )}
          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="py-6 text-center border-t border-slate-150 dark:border-slate-850 text-slate-400 dark:text-slate-500 text-[10px] font-semibold no-print bg-white dark:bg-slate-900 transition-colors">
        PLATACOOP · PROGRAMA DE EXCELÊNCIA OPERACIONAL BALL CORPORATION TRÊS RIOS (BR3R) & SODEXO
        <span className="block mt-1 font-normal">Desenvolvido em conformidade com as diretrizes e regras de ouro de segurança do trabalho Ball.</span>
      </footer>

    </div>
  );
}
