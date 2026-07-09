/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, Award, Save, ClipboardList, Database, 
  RotateCcw, ShieldAlert, KeyRound, Clock, User 
} from 'lucide-react';
import { RemunerationSettings, AccessLog, UserRole } from '../types';
import { changeSystemPassword } from '../lib/api';

interface SettingsViewProps {
  settings: RemunerationSettings;
  accessLogs: AccessLog[];
  currentUser: { username: string; name: string; role: UserRole };
  onUpdateSettings: (newSettings: RemunerationSettings) => Promise<boolean>;
  onResetDatabase: () => Promise<boolean>;
}

export default function SettingsView({ settings, accessLogs, currentUser, onUpdateSettings, onResetDatabase }: SettingsViewProps) {
  const [bonusTable, setBonusTable] = useState([...settings.table].sort((a, b) => b.minScore - a.minScore));
  const [maxBonus, setMaxBonus] = useState(settings.maxBonusValue);
  const [scoringMethod, setScoringMethod] = useState(settings.scoringMethod || 'WEIGHTED');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    setPasswordMsg('');
    setPasswordError('');
    if (newPassword.length < 4) { setPasswordError('A senha deve ter no mínimo 4 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('As senhas não coincidem.'); return; }

    setChangingPassword(true);
    try {
      const ok = await changeSystemPassword(newPassword);
      if (ok) {
        setPasswordMsg('Senha alterada com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('Erro ao alterar a senha.');
      }
    } catch {
      setPasswordError('Erro de conexão.');
    } finally {
      setChangingPassword(false);
    }
  };

  const isAdmin = currentUser.role === 'ADMIN';

  // Handle single cell change
  const handleTableCellChange = (idx: number, field: 'minScore' | 'percentage' | 'value', val: number) => {
    setBonusTable(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  // Add tier row
  const handleAddTier = () => {
    setBonusTable(prev => {
      const lowestScore = prev.length > 0 ? prev[prev.length - 1].minScore - 5 : 65;
      const lowestValue = prev.length > 0 ? prev[prev.length - 1].value - 12.5 : 162.5;
      const lowestPercent = prev.length > 0 ? prev[prev.length - 1].percentage - 5 : 65;
      
      return [...prev, {
        minScore: Math.max(0, lowestScore),
        percentage: Math.max(0, lowestPercent),
        value: Math.max(0, lowestValue)
      }].sort((a, b) => b.minScore - a.minScore);
    });
  };

  // Remove tier row
  const handleRemoveTier = (idx: number) => {
    setBonusTable(prev => {
      const updated = [...prev];
      updated.splice(idx, 1);
      return updated;
    });
  };

  // Save changes
  const handleSaveSettings = async () => {
    if (!isAdmin) {
      setErrorMsg('Apenas administradores podem alterar as regras de remuneração.');
      return;
    }

    setUpdating(true);
    setSuccessMsg('');
    setErrorMsg('');

    const newSettings: RemunerationSettings = {
      table: bonusTable.sort((a, b) => b.minScore - a.minScore),
      maxBonusValue: maxBonus,
      scoringMethod: scoringMethod as 'WEIGHTED' | 'SIMPLE'
    };

    try {
      const success = await onUpdateSettings(newSettings);
      if (success) {
        setSuccessMsg('Configurações de remuneração parametrizadas com sucesso.');
      } else {
        setErrorMsg('Ocorreu um erro ao gravar as parametrizações.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro de conexão.');
    } finally {
      setUpdating(false);
    }
  };

  // Database Backup download
  const downloadDatabaseBackup = () => {
    // We can fetch database contents or export what we have
    // Triggering download of database
    const backupObj = {
      settings: { table: bonusTable, maxBonusValue: maxBonus },
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.username
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_promptmaster_settings_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerReset = async () => {
    if (!confirm('ATENÇÃO: Você tem certeza que deseja resetar o banco de dados para o estado inicial? Isso irá apagar auditorias criadas recentemente.')) {
      return;
    }
    
    setUpdating(true);
    try {
      const success = await onResetDatabase();
      if (success) {
        alert('Banco de dados resetado com sucesso! A página será atualizada.');
        window.location.reload();
      } else {
        alert('Erro ao resetar banco de dados.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao resetar.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Left/Main Column - Remuneration Parametrization (Span 2) */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-500" />
              <h3 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
                Parametrização da Remuneração Variável
              </h3>
            </div>
            
            {!isAdmin && (
              <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                Apenas Visualização
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 leading-relaxed">
            Configure as faixas de nota ponderada e seus respectivos prêmios financeiros e percentuais. Alterações alteram retroativamente os relatórios.
          </p>

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Teto do Bonus configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Teto Máximo do Bônus (R$)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={maxBonus}
                onChange={(e) => setMaxBonus(parseFloat(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
              />
              <span className="text-xs text-slate-400">Valor teto de referência (ex: R$ 250,00 para 100% de nota).</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Método de Cálculo da Nota</label>
              <select
                disabled={!isAdmin}
                value={scoringMethod}
                onChange={(e) => setScoringMethod(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
              >
                <option value="WEIGHTED">Ponderado por Categoria (Segurança 40%, Qualidade 25%...)</option>
                <option value="SIMPLE">Média Simples (Ideal para Auditorias Diárias/Segmentadas)</option>
              </select>
              <span className="text-xs text-slate-400">
                A <strong>Média Simples</strong> calcula o percentual direto de itens conformes, evitando penalidades severas em vistorias curtas.
              </span>
            </div>
          </div>

          {/* Table list */}
          <div className="space-y-3 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Tabela de Notas e Bonificações</span>
              {isAdmin && (
                <button
                  onClick={handleAddTier}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Adicionar Faixa +
                </button>
              )}
            </div>

            <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-400 uppercase border-b border-slate-150 dark:border-slate-850">
                    <th className="p-3">Nota Mínima (%)</th>
                    <th className="p-3">Porcentagem Bônus (%)</th>
                    <th className="p-3">Valor de Bonificação (R$)</th>
                    {isAdmin && <th className="p-3 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                  {bonusTable.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                       <td className="p-3">
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={tier.minScore}
                          onChange={(e) => handleTableCellChange(idx, 'minScore', parseInt(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none rounded text-sm font-bold text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-xs text-slate-400 ml-1 font-sans font-bold">%</span>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={tier.percentage}
                          onChange={(e) => handleTableCellChange(idx, 'percentage', parseInt(e.target.value) || 0)}
                          className="w-20 p-1.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none rounded text-sm font-bold text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-xs text-slate-400 ml-1 font-sans font-bold">%</span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-400 mr-1 font-sans font-bold">R$</span>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={tier.value}
                          step="0.01"
                          onChange={(e) => handleTableCellChange(idx, 'value', parseFloat(e.target.value) || 0)}
                          className="w-24 p-1.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none rounded text-sm font-bold text-slate-900 dark:text-slate-100"
                        />
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            disabled={bonusTable.length <= 1}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded disabled:opacity-35 cursor-pointer transition-all"
                          >
                            Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-150 text-[11px] text-slate-500">
              * Qualquer pontuação final obtida <strong className="text-rose-500">abaixo do menor valor parametrizado</strong> na tabela resultará automaticamente em <strong className="text-rose-500">Sem bonificação (R$ 0,00)</strong>.
            </div>
          </div>

          {/* Action buttons */}
          {isAdmin && (
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={updating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
              >
                {updating ? 'Salvando...' : 'Gravar Parâmetros'}
                <Save className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Right Column - Backup, reset & Access History Log trail */}
      <div className="space-y-6">
        
        {/* DB Utilities */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Utilidades e Backup de Segurança</h4>
          
          <div className="space-y-3">
            <button
              onClick={downloadDatabaseBackup}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-500/5 hover:border-indigo-500 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center gap-2.5"
            >
              <Database className="h-4 w-4 text-indigo-500" />
              <div>
                <span className="block font-bold">Exportar Backup JSON</span>
                <span className="text-xs text-slate-400 font-normal">Baixar cópia local dos parâmetros e auditorias</span>
              </div>
            </button>

            {isAdmin && (
              <button
                onClick={handleTriggerReset}
                disabled={updating}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-rose-500/5 hover:border-rose-500 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center gap-2.5"
              >
                <RotateCcw className="h-4 w-4 text-rose-500" />
                <div>
                  <span className="block font-bold text-rose-500">Restaurar Banco de Dados</span>
                  <span className="text-xs text-slate-400 font-normal">Reiniciar todo o sistema com dados de demonstração</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Trocar Senha do Sistema */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <KeyRound className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">Trocar Senha do Sistema</h3>
          </div>

          {passwordMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{passwordMsg}</div>
          )}
          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">{passwordError}</div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Nova senha</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Confirmar nova senha</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button onClick={handleChangePassword} disabled={changingPassword}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50">
              {changingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Essa senha é usada por todos os perfis (Rickson, Claudio, Rafael) para acessar o sistema.</p>
          </div>
        </div>

        {/* Access History Logs (Se salvar absolutamente tudo) */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Trilha de Auditoria (Acessos)</h4>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {accessLogs.slice(0, 15).map((log) => (
              <div 
                key={log.id} 
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-xs space-y-1.5"
              >
                <div className="flex justify-between items-center text-slate-400">
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                    <User className="h-3 w-3 text-indigo-400" />
                    <span>{log.name}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold">
                    {new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-bold">
                  <span>Acesso: <strong className="text-indigo-500">{log.role}</strong></span>
                  <span className="font-mono">IP: {log.ip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
