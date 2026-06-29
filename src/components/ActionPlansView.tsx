/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, AlertTriangle, CheckCircle2, Clock, 
  Search, Filter, User, Calendar, Edit3, X, CheckSquare 
} from 'lucide-react';
import { ActionPlan, CriticalityLevel, UserRole } from '../types';

interface ActionPlansViewProps {
  actionPlans: ActionPlan[];
  currentUser: { username: string; name: string; role: UserRole };
  onUpdateActionPlan: (id: string, status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO', observations: string) => Promise<boolean>;
}

export default function ActionPlansView({ actionPlans, currentUser, onUpdateActionPlan }: ActionPlansViewProps) {
  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'>('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState<'ALL' | CriticalityLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [modalObservations, setModalObservations] = useState('');
  const [modalStatus, setModalStatus] = useState<'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO'>('PENDENTE');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Handle open modal
  const openEditModal = (plan: ActionPlan) => {
    setSelectedPlan(plan);
    setModalObservations(plan.observations);
    setModalStatus(plan.status);
    setModalError('');
  };

  // Handle save updates
  const handleSavePlanUpdates = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    setModalError('');
    try {
      const success = await onUpdateActionPlan(selectedPlan.id, modalStatus, modalObservations);
      if (success) {
        setSelectedPlan(null);
      } else {
        setModalError('Não foi possível atualizar o plano de ação.');
      }
    } catch (err) {
      console.error(err);
      setModalError('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered action plans
  const filteredPlans = useMemo(() => {
    return actionPlans.filter(plan => {
      if (statusFilter !== 'ALL' && plan.status !== statusFilter) return false;
      if (criticalityFilter !== 'ALL' && plan.criticality !== criticalityFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = plan.questionText.toLowerCase().includes(query) ||
                            plan.description.toLowerCase().includes(query) ||
                            plan.responsible.toLowerCase().includes(query) ||
                            plan.conferente.toLowerCase().includes(query) ||
                            plan.id.toLowerCase().includes(query);
        if (!matchesText) return false;
      }
      return true;
    });
  }, [actionPlans, statusFilter, criticalityFilter, searchQuery]);

  // Counts for simple summaries
  const stats = useMemo(() => {
    const counts = { total: actionPlans.length, pendente: 0, emAndamento: 0, concluido: 0 };
    actionPlans.forEach(p => {
      if (p.status === 'PENDENTE') counts.pendente++;
      else if (p.status === 'EM_ANDAMENTO') counts.emAndamento++;
      else if (p.status === 'CONCLUIDO') counts.concluido++;
    });
    return counts;
  }, [actionPlans]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Quick Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total de Ações</span>
          <span className="text-2xl font-display font-extrabold text-slate-800 dark:text-white mt-1 block">
            {stats.total} Planos
          </span>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 shadow-sm">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Pendentes</span>
          <span className="text-2xl font-display font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
            {stats.pendente} Ações
          </span>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Em Andamento</span>
          <span className="text-2xl font-display font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
            {stats.emAndamento} Ações
          </span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Concluídos</span>
          <span className="text-2xl font-display font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {stats.concluido} Ações
          </span>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por descrição, responsável..."
            className="block w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Status</option>
              <option value="PENDENTE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Pendentes</option>
              <option value="EM_ANDAMENTO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Em Andamento</option>
              <option value="CONCLUIDO" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Concluídos</option>
            </select>
          </div>

          {/* Criticality filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase hidden sm:inline">Criticidade:</span>
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value as any)}
              className="p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todas as Criticidades</option>
              <option value="BAIXA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">BAIXA</option>
              <option value="MEDIA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">MÉDIA</option>
              <option value="ALTA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">ALTA</option>
            </select>
          </div>
        </div>

      </div>

      {/* Grid of Action Plans (NO SIMPLE FORM!) */}
      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            // Picking badges
            let statusBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/30';
            let statusIcon = <Clock className="h-3.5 w-3.5" />;
            if (plan.status === 'EM_ANDAMENTO') {
              statusBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
              statusIcon = <Clock className="h-3.5 w-3.5" />;
            } else if (plan.status === 'CONCLUIDO') {
              statusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
              statusIcon = <CheckCircle2 className="h-3.5 w-3.5" />;
            }

            let criticalityColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            if (plan.criticality === 'MEDIA') criticalityColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            else if (plan.criticality === 'ALTA') criticalityColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse';

            return (
              <div 
                key={plan.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Header of Card */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-850 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{plan.id}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 uppercase ${statusBadge}`}>
                      {statusIcon}
                      {plan.status === 'EM_ANDAMENTO' ? 'Em Andamento' : plan.status}
                    </span>
                  </div>

                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${criticalityColor}`}>
                    Criticidade {plan.criticality}
                  </span>

                  {plan.occurrenceLocation && (
                    <span className="inline-block ml-1.5 px-2 py-0.5 rounded text-[9px] font-bold border border-indigo-500/30 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 uppercase">
                      Local: {plan.occurrenceLocation}
                    </span>
                  )}

                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-1">
                    Categoria: {plan.category}
                  </h4>
                  <p className="text-sm font-display font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {plan.questionText}
                  </p>
                </div>

                {/* Body of Card */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Descrição do Desvio</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {plan.description}
                    </p>
                  </div>

                  {plan.observations && (
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-500 border border-slate-100 dark:border-slate-850">
                      <span className="font-bold text-slate-600 dark:text-slate-400 uppercase block text-[9px] mb-1">Notas de Resolução</span>
                      {plan.observations}
                    </div>
                  )}

                  {/* Thumbnail Photo */}
                  {plan.photos && plan.photos.length > 0 && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-150">
                      <img src={plan.photos[0]} alt="Evidência" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                {/* Footer of Card */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 text-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
                      <User className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Resp: {plan.responsible}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Prazo: {new Date(plan.deadline).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Edit/Resolve Action trigger (Supervisor or Admin only) */}
                  {currentUser.role !== 'VISUALIZADOR' && (
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-indigo-500/15 transition-all cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
          <ClipboardList className="h-12 w-12 mx-auto stroke-1 text-slate-300 mb-2" />
          <p className="text-sm">Nenhum plano de ação encontrado para os critérios selecionados.</p>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Atualizar Ação</span>
                <h3 className="text-base font-display font-extrabold text-slate-800 dark:text-white">
                  {selectedPlan.id} - Gestão de Conformidade
                </h3>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs">
                  {modalError}
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 text-xs space-y-2">
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  <strong>Item Auditado:</strong> {selectedPlan.questionText}
                </p>
                <p className="text-slate-500">
                  <strong>Desvio original:</strong> {selectedPlan.description}
                </p>
                <p className="text-slate-500">
                  <strong>Conferente:</strong> {selectedPlan.conferente} | <strong>Turno:</strong> {selectedPlan.turno}
                  {selectedPlan.occurrenceLocation && (
                    <> | <strong>Local da Ocorrência:</strong> {selectedPlan.occurrenceLocation}</>
                  )}
                </p>
              </div>

              {/* Status update */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Novo Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'PENDENTE', label: 'Pendente', color: 'bg-rose-500' },
                    { value: 'EM_ANDAMENTO', label: 'Em Progresso', color: 'bg-amber-500' },
                    { value: 'CONCLUIDO', label: 'Concluído', color: 'bg-emerald-500' }
                  ].map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setModalStatus(st.value as any)}
                      className={`p-3 rounded-xl border text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        modalStatus === st.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-slate-800 dark:text-white'
                          : 'border-slate-200 dark:border-slate-850 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${st.color}`} />
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Observations / Execution log */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ações de Correção / Observações de Resolução
                </label>
                <textarea
                  rows={4}
                  value={modalObservations}
                  onChange={(e) => setModalObservations(e.target.value)}
                  placeholder="Descreva as ações corretivas tomadas (ex: reposicionado material, limpada a área, etc)..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Action History Trail */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Histórico de Alterações</span>
                <div className="space-y-3 pl-1">
                  {selectedPlan.history.map((log, lidx) => (
                    <div key={lidx} className="relative pl-5 border-l border-indigo-500/30 text-[11px] py-1">
                      <span className="absolute left-[-4.5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                      <div className="flex items-center justify-between text-slate-400 mb-0.5">
                        <span className="font-semibold">{log.user}</span>
                        <span className="font-mono text-[9px]">
                          {new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">{log.action}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlanUpdates}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                {saving ? 'Gravando...' : 'Gravar Alterações'}
                <CheckSquare className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
