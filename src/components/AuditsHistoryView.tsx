/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Calendar, FileText, Download, Printer, 
  X, CheckCircle2, AlertTriangle, ChevronRight, User, Shield, AlertCircle, Pencil
} from 'lucide-react';
import { Audit, AuditQuestion, AuditItemStatus, CriticalityLevel } from '../types';

interface AuditsHistoryViewProps {
  audits: Audit[];
  questions: AuditQuestion[];
  onEditAudit?: (audit: Audit) => void;
}

export default function AuditsHistoryView({ audits, questions, onEditAudit }: AuditsHistoryViewProps) {
  // Filters
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('ALL');
  const [selectedConferente, setSelectedConferente] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Audit for Detailed PDF/Print view modal
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  // Filter dropdown unique values
  const uniqueConferentes = useMemo(() => {
    return Array.from(new Set(audits.map(a => a.conferente)));
  }, [audits]);

  // Filtered audits list
  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      if (dateStart && audit.date < dateStart) return false;
      if (dateEnd && audit.date > dateEnd) return false;
      if (selectedTurno !== 'ALL' && audit.turno !== selectedTurno) return false;
      if (selectedConferente !== 'ALL' && audit.conferente !== selectedConferente) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = audit.auditor.toLowerCase().includes(query) ||
                             audit.area.toLowerCase().includes(query) ||
                             audit.liderSodexo.toLowerCase().includes(query) ||
                             audit.id.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [audits, dateStart, dateEnd, selectedTurno, selectedConferente, searchQuery]);

  // --- CSV / EXCEL EXPORT GENERATORS ---

  const handleExportCSV = () => {
    if (filteredAudits.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    // CSV Header (Portuguese with semicolon delimiter for easy Excel import)
    let csvContent = 'ID;Data;Hora;Auditor;Conferente;Turno;Horario;Lider Sodexo;Area;Tipo;Nota Geral;Percentual Bonus;Valor Bonus;Desclassificado;Motivo\r\n';

    filteredAudits.forEach(a => {
      const row = [
        a.id,
        a.date,
        a.time,
        a.auditor,
        a.conferente,
        a.turno,
        a.horarioTurno,
        a.liderSodexo,
        a.area,
        a.tipo,
        `${a.finalScore}%`,
        `${a.bonusPercentage}%`,
        `R$ ${a.bonusValue.toFixed(2)}`,
        a.isEliminated ? 'SIM' : 'NAO',
        a.eliminationReasons.join(' | ') || 'Nenhum'
      ].map(val => `"${val.replace(/"/g, '""')}"`).join(';');
      csvContent += row + '\r\n';
    });

    // Create Download Trigger
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auditorias_ball_br3r_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcelMock = () => {
    // Elegant spreadsheet-compatible XML or beautiful tab-separated content
    if (filteredAudits.length === 0) return;
    
    let xmlContent = 'ID\tData\tHora\tAuditor\tConferente\tTurno\tLíder Sodexo\tÁrea\tTipo\tNota Ponderada\tBônus (%)\tBônus (R$)\tDesclassificado\n';
    
    filteredAudits.forEach(a => {
      xmlContent += `${a.id}\t${a.date}\t${a.time}\t${a.auditor}\t${a.conferente}\t${a.turno}\t${a.liderSodexo}\t${a.area}\t${a.tipo}\t${a.finalScore}%\t${a.bonusPercentage}%\t${a.bonusValue.toFixed(2)}\t${a.isEliminated ? 'Sim' : 'Não'}\n`;
    });

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auditorias_ball_br3r_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct print detailed modal (A4 format)
  const triggerPrintLayout = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans no-print">
      
      {/* Filter and Export Bar */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
              Histórico de Auditorias Gravadas
            </h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
            <button
              onClick={handleExportExcelMock}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="space-y-1 sm:col-span-1 md:col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">Pesquisa Livre</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por Auditor, Área, Líder..."
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Turno */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">Turno</label>
            <select
              value={selectedTurno}
              onChange={(e) => setSelectedTurno(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Turnos</option>
              <option value="A" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno A</option>
              <option value="B" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno B</option>
              <option value="C" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno C</option>
              <option value="D" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno D</option>
            </select>
          </div>

          {/* Conferente */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">Conferente</label>
            <select
              value={selectedConferente}
              onChange={(e) => setSelectedConferente(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Conferentes</option>
              {uniqueConferentes.map(name => (
                <option key={name} value={name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{name}</option>
              ))}
            </select>
          </div>

          {/* Clean filters button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateStart('');
                setDateEnd('');
                setSelectedTurno('ALL');
                setSelectedConferente('ALL');
                setSearchQuery('');
              }}
              className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

      </div>

      {/* History table list */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
                <th className="p-4">Cód. Auditoria</th>
                <th className="p-4">Data / Hora</th>
                <th className="p-4">Conferente</th>
                <th className="p-4">Turno</th>
                <th className="p-4">Nota Geral</th>
                <th className="p-4">Bonificação</th>
                <th className="p-4 text-center">Status Operacional</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
              {filteredAudits.length > 0 ? (
                filteredAudits.map((a) => {
                  
                  // Score color class
                  let scoreColorClass = 'text-slate-800 dark:text-slate-100';
                  let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                  
                  if (a.isEliminated) {
                    scoreColorClass = 'text-rose-500 line-through';
                    statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                  } else if (a.finalScore >= 90) {
                    scoreColorClass = 'text-emerald-500 font-extrabold';
                    statusBadge = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                  } else if (a.finalScore >= 75) {
                    scoreColorClass = 'text-amber-500 font-bold';
                    statusBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  } else {
                    scoreColorClass = 'text-rose-500 font-bold';
                    statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                  }

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-all">
                      <td className="p-4 font-mono font-bold text-slate-500">
                        {a.id}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(a.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-400">{a.time}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">{a.conferente}</div>
                        <div className="text-xs text-slate-400">Auditor: {a.auditor}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded text-xs border border-indigo-500/20">
                          Turno {a.turno}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        <span className={scoreColorClass}>
                          {a.finalScore}%
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                        {a.isEliminated ? (
                          <span className="text-xs text-rose-500 uppercase tracking-wider font-extrabold">Desclassif.</span>
                        ) : (
                          `R$ ${a.bonusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${statusBadge}`}>
                          {a.isEliminated 
                            ? 'REGRA ELIMINATÓRIA' 
                            : a.finalScore >= 90 
                            ? 'EXCELENTE' 
                            : a.finalScore >= 75 
                            ? 'ATENÇÃO' 
                            : 'CRÍTICO'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedAudit(a)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all rounded-lg font-semibold text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Relatório
                          </button>
                          {onEditAudit && (
                            <button
                              onClick={() => onEditAudit(a)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-500 transition-all rounded-lg font-semibold text-[11px] cursor-pointer flex items-center gap-1 border border-amber-500/20"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* COMPREHENSIVE PDF/PRINT REPORT MODAL (A4 PRINT OPTIMIZED) */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-800 dark:text-slate-200">
            
            {/* Modal Controls (Hidden when printing) */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-950 no-print">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Visualização do Relatório</span>
                <h3 className="text-base font-display font-extrabold text-slate-800 dark:text-white">
                  Auditoria de Excelência Logística - {selectedAudit.id}
                </h3>
              </div>
              <div className="flex gap-2">
                {onEditAudit && (
                  <button
                    onClick={() => {
                      onEditAudit(selectedAudit);
                      setSelectedAudit(null);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/15 cursor-pointer no-print"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar Registro
                  </button>
                )}
                <button
                  onClick={triggerPrintLayout}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/15 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / Salvar PDF
                </button>
                <button 
                  onClick={() => setSelectedAudit(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Frame */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-white dark:bg-slate-900" id="print-area">
              
              {/* Header section (styled like standard corporate layout) */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-200 dark:border-slate-850 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm tracking-tight shadow-sm">
                      B
                    </div>
                    <div>
                      <span className="font-display font-black tracking-tight text-md text-slate-800 dark:text-white block">BALL CORPORATION</span>
                      <span className="text-xs block text-indigo-500 font-semibold uppercase tracking-wider">Logística & Excelência Unidade BR3R</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-display font-black tracking-tight pt-2 print-title text-slate-800 dark:text-white">
                    RELATÓRIO AUDITORIA E REMUNERAÇÃO VARIÁVEL
                  </h2>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded">
                    Código: {selectedAudit.id}
                  </span>
                  <div className="text-xs text-slate-500 font-medium pt-2">
                    Data: <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedAudit.date).toLocaleDateString('pt-BR')}</strong>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Hora: <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.time}</strong>
                  </div>
                </div>
              </div>

              {/* Status Banner / Regra Eliminatoria Alert */}
              {selectedAudit.isEliminated && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block uppercase">BÔNUS INTEGRAL DESCLASSIFICADO</span>
                    Ocorrência de regra eliminatória no turno auditado: <strong className="font-semibold">{selectedAudit.eliminationReasons.join(' | ')}</strong>. A equipe perde os direitos de remuneração variável para este ciclo conforme procedimento operacional padrão Ball BR3R / Sodexo.
                  </div>
                </div>
              )}

              {/* Grid of basic information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-850 print-card text-xs">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Auditor Responsável</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.auditor}</strong>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Conferente Líder</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.conferente}</strong>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Líder Sodexo</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.liderSodexo}</strong>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Área Operacional</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.area}</strong>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Turno / Turma</span>
                  <strong className="text-slate-800 dark:text-slate-200">Turma {selectedAudit.turno}</strong>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Horário Operação</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.horarioTurno}</strong>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Tipo Auditoria</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedAudit.tipo}</strong>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">Status Geral</span>
                  <span className={`font-bold uppercase ${
                    selectedAudit.isEliminated ? 'text-rose-500' : selectedAudit.finalScore >= 75 ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {selectedAudit.isEliminated ? 'Desclassificado' : selectedAudit.finalScore >= 90 ? 'Excelente' : selectedAudit.finalScore >= 75 ? 'Atenção' : 'Crítico'}
                  </span>
                </div>
              </div>

              {/* Score breakdown metrics card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* Nota Final */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm print-card text-center flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Nota Ponderada Geral</span>
                  <span className={`text-5xl font-display font-extrabold ${selectedAudit.isEliminated ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {selectedAudit.isEliminated ? '0%' : `${selectedAudit.finalScore}%`}
                  </span>
                  <span className="text-xs text-slate-400 block mt-2">
                    {selectedAudit.isEliminated ? 'Desclassificado por Regra Crítica' : `Pontuação Real: ${selectedAudit.finalScore}%`}
                  </span>
                </div>

                {/* Bonificação */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm print-card text-center flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Valor da Bonificação</span>
                  <span className={`text-4xl font-display font-extrabold ${selectedAudit.isEliminated ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedAudit.isEliminated ? 'R$ 0,00' : `R$ ${selectedAudit.bonusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                  <span className="text-xs text-slate-400 block mt-2">
                    Equivalente a {selectedAudit.isEliminated ? '0%' : `${selectedAudit.bonusPercentage}%`} do teto de bônus (R$ 250)
                  </span>
                </div>

                {/* Categoria breakdown progress */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm print-card space-y-2.5 flex flex-col justify-center text-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Índice por Categorias</span>
                  {[
                    { name: 'Segurança (40%)', val: selectedAudit.scoresByCategory.SEGURANÇA, color: 'bg-indigo-500' },
                    { name: 'Qualidade (25%)', val: selectedAudit.scoresByCategory.QUALIDADE, color: 'bg-blue-500' },
                    { name: 'Organização (15%)', val: selectedAudit.scoresByCategory.ORGANIZAÇÃO, color: 'bg-teal-500' },
                    { name: 'Limpeza (10%)', val: selectedAudit.scoresByCategory.LIMPEZA, color: 'bg-amber-500' },
                    { name: 'Gestão (10%)', val: selectedAudit.scoresByCategory.GESTÃO, color: 'bg-pink-500' }
                  ].map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>{c.name}</span>
                        <span>{c.val}%</span>
                      </div>
                      <div className="w-full bg-slate-150 dark:bg-slate-950 h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${c.color}`} style={{ width: `${c.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Complete checklist results showing Conforme / Não Conforme */}
              <div className="space-y-4">
                <h4 className="text-sm font-display font-black text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  LISTA DE VERIFICAÇÃO DETALHADA E CONFORMIDADES
                </h4>

                <div className="divide-y divide-slate-100 dark:divide-slate-850 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden text-xs">
                  {selectedAudit.answers.map((ans) => {
                    const question = questions.find(q => q.id === ans.questionId);
                    if (!question) return null;

                    let statusBadge = 'text-emerald-500 font-bold bg-emerald-500/10';
                    let statusLabel = 'CONFORME';
                    if (ans.status === 'NAO_CONFORME') {
                      statusBadge = 'text-rose-500 font-bold bg-rose-500/10';
                      statusLabel = 'NÃO CONFORME';
                    } else if (ans.status === 'NAO_APLICAVEL') {
                      statusBadge = 'text-slate-500 font-bold bg-slate-100';
                      statusLabel = 'NÃO APLICÁVEL';
                    }

                    return (
                      <div key={ans.questionId} className="p-4 bg-white dark:bg-slate-900 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider mb-0.5">
                              {question.category}
                            </span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {question.text}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider ${statusBadge}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* If non-conformance, show details and embedded photo inside report */}
                        {ans.status === 'NAO_CONFORME' && ans.details && (
                          <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 text-xs space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                              <p className="text-slate-500">
                                <strong>Criticidade:</strong> <span className="text-rose-500 font-bold">{ans.details.criticality}</span>
                              </p>
                              <p className="text-slate-500">
                                <strong>Responsável:</strong> <span className="text-slate-700 dark:text-slate-300 font-bold">{ans.details.responsible}</span>
                              </p>
                              <p className="text-slate-500">
                                <strong>Prazo Solução:</strong> <span className="text-slate-700 dark:text-slate-300 font-bold">{new Date(ans.details.deadline).toLocaleDateString('pt-BR')}</span>
                              </p>
                              <p className="sm:col-span-3 text-slate-600 dark:text-slate-400">
                                <strong>Ocorrência:</strong> {ans.details.description}
                              </p>
                            </div>

                            {/* MANDATORY PICTURES INSIDE THE PDF/REPORT */}
                            {ans.details.cameraPhotos && ans.details.cameraPhotos.length > 0 && (
                              <div className="pt-2 border-t border-rose-500/10 space-y-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Evidência Fotográfica do Desvio</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {ans.details.cameraPhotos.map((photo, pIdx) => (
                                    <div key={pIdx} className="aspect-video w-full rounded-lg border border-slate-250 overflow-hidden bg-slate-900">
                                      <img src={photo} alt="Evidência" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signatures section (Crucial for printed logs) */}
              <div className="grid grid-cols-2 gap-12 pt-16 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-b border-slate-300 dark:border-slate-700 h-8 mx-auto max-w-xs" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{selectedAudit.auditor}</span>
                  <span className="text-xs text-slate-400 uppercase font-bold">Assinatura do Auditor</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-300 dark:border-slate-700 h-8 mx-auto max-w-xs" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{selectedAudit.conferente}</span>
                  <span className="text-xs text-slate-400 uppercase font-bold">Assinatura do Conferente</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
