/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLoginSuccess: (user: { username: string; name: string; role: UserRole }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456'); // Default simple password
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const preConfiguredUsers = [
    { label: 'Claudio (Supervisor)', username: 'claudio', role: 'ADMIN' },
    { label: 'Rickson (Analista)', username: 'rickson', role: 'SUPERVISOR' },
    { label: 'Rafael (Assistente)', username: 'rafael', role: 'AUDITOR' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor, informe o usuário.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Falha na autenticação. Verifique o usuário.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (usr: string) => {
    setUsername(usr);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-stretch bg-slate-900 font-sans">
      {/* Visual / Brand Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Abstract background decorative items */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900/40 to-slate-950 opacity-80 pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center font-display font-extrabold text-xl tracking-tight text-white shadow-lg shadow-indigo-500/30">
              B
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-lg text-slate-100">BALL CORPORATION</span>
              <span className="text-xs block text-indigo-400 font-semibold tracking-wider">UNIDADE BR3R</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
            <Shield className="h-4 w-4" /> Excelência Operacional & Logística
          </div>
          <h1 className="text-4xl xl:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
            Gestão Integrada de <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Auditorias e Remuneração
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Plataforma corporativa de auditoria em 5 minutos da Unidade Três Rios (BR3R). Gerenciamento automatizado de não conformidades, planos de ação e cálculo transparente de bonificações.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-500">
          <span>Parceria Logística Ball & Sodexo</span>
          <span>© {new Date().getFullYear()} BR3R Logistics</span>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-extrabold text-white tracking-tight">
              Acesse a plataforma
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              Entre com suas credenciais ou selecione um perfil rápido para auditoria.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 mt-8">
            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-medium animate-shake flex items-start gap-2">
                <span className="mt-0.5 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Usuário / Matrícula
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="Nome de usuário ou matrícula"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => alert('Esqueceu a senha? Entre em contato com o administrador de sistemas Sodexo/Ball para redefinir.')}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-900 border-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                />
                <span className="text-xs font-medium text-slate-400">Lembrar usuário</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Quick Access/Profiles */}
          <div className="border-t border-slate-900 pt-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-center lg:text-left mb-4">
              Acesso Rápido de Homologação (Perfis)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {preConfiguredUsers.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => selectUser(u.username)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                    username === u.username
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className="font-semibold text-slate-200">{u.role}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">{u.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
