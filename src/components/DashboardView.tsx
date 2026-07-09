/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList 
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, CheckCircle2, ClipboardList, 
  Calendar, Shield, Filter, RotateCcw, Award, Users, AlertCircle 
} from 'lucide-react';
import { Audit, AuditQuestion, RemunerationSettings } from '../types';

interface DashboardViewProps {
  audits: Audit[];
  questions: AuditQuestion[];
  settings: RemunerationSettings;
}

export default function DashboardView({ audits, questions, settings }: DashboardViewProps) {
  // Filter States
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('ALL');
  const [selectedConferente, setSelectedConferente] = useState('ALL');
  const [selectedAuditor, setSelectedAuditor] = useState('ALL');
  const [selectedArea, setSelectedArea] = useState('ALL');

  // Unique list values for filter dropdowns
  const uniqueConferentes = useMemo(() => {
    return Array.from(new Set(audits.map(a => a.conferente)));
  }, [audits]);

  const uniqueAuditores = useMemo(() => {
    return Array.from(new Set(audits.map(a => a.auditor)));
  }, [audits]);

  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(audits.map(a => a.area)));
  }, [audits]);

  // Reset Filters
  const resetFilters = () => {
    setDateStart('');
    setDateEnd('');
    setSelectedTurno('ALL');
    setSelectedConferente('ALL');
    setSelectedAuditor('ALL');
    setSelectedArea('ALL');
  };

  // Filtered Audits
  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      if (dateStart && audit.date < dateStart) return false;
      if (dateEnd && audit.date > dateEnd) return false;
      if (selectedTurno !== 'ALL' && audit.turno !== selectedTurno) return false;
      if (selectedConferente !== 'ALL' && audit.conferente !== selectedConferente) return false;
      if (selectedAuditor !== 'ALL' && audit.auditor !== selectedAuditor) return false;
      if (selectedArea !== 'ALL' && audit.area !== selectedArea) return false;
      return true;
    });
  }, [audits, dateStart, dateEnd, selectedTurno, selectedConferente, selectedAuditor, selectedArea]);

  // --- Calculations & KPIs ---

  // Total Audits
  const totalAudits = filteredAudits.length;

  // Average final score
  const avgScore = useMemo(() => {
    if (filteredAudits.length === 0) return 0;
    const sum = filteredAudits.reduce((acc, a) => acc + (a.isEliminated ? 0 : a.finalScore), 0);
    return Math.round(sum / filteredAudits.length);
  }, [filteredAudits]);

  // Status Indicator
  const statusIndicator = useMemo(() => {
    if (totalAudits === 0) return { label: 'Sem Dados', color: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500' };
    if (avgScore >= 90) return { label: 'Excelente', color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' };
    if (avgScore >= 75) return { label: 'Atenção', color: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' };
    return { label: 'Crítico', color: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500' };
  }, [avgScore, totalAudits]);

  // Average Category Scores
  const avgCategoryScores = useMemo(() => {
    if (filteredAudits.length === 0) {
      return { SEGURANÇA: 0, QUALIDADE: 0, ORGANIZAÇÃO: 0, LIMPEZA: 0, GESTÃO: 0 };
    }
    const sums = { SEGURANÇA: 0, QUALIDADE: 0, ORGANIZAÇÃO: 0, LIMPEZA: 0, GESTÃO: 0 };
    filteredAudits.forEach(a => {
      sums.SEGURANÇA += a.scoresByCategory.SEGURANÇA;
      sums.QUALIDADE += a.scoresByCategory.QUALIDADE;
      sums.ORGANIZAÇÃO += a.scoresByCategory.ORGANIZAÇÃO;
      sums.LIMPEZA += a.scoresByCategory.LIMPEZA;
      sums.GESTÃO += a.scoresByCategory.GESTÃO;
    });
    const len = filteredAudits.length;
    return {
      SEGURANÇA: Math.round(sums.SEGURANÇA / len),
      QUALIDADE: Math.round(sums.QUALIDADE / len),
      ORGANIZAÇÃO: Math.round(sums.ORGANIZAÇÃO / len),
      LIMPEZA: Math.round(sums.LIMPEZA / len),
      GESTÃO: Math.round(sums.GESTÃO / len),
    };
  }, [filteredAudits]);

  // Non-Conformities counter
  const ncMetrics = useMemo(() => {
    let totalNCs = 0;
    let criticalNCs = 0;
    let ncAlta = 0, ncMedia = 0, ncBaixa = 0;
    filteredAudits.forEach(audit => {
      audit.answers.forEach(ans => {
        if (ans.status === 'NAO_CONFORME') {
          totalNCs++;
          const crit = ans.details?.criticality;
          if (crit === 'ALTA') { criticalNCs++; ncAlta++; }
          else if (crit === 'MEDIA') ncMedia++;
          else ncBaixa++;
        }
      });
    });
    return { totalNCs, criticalNCs, ncAlta, ncMedia, ncBaixa };
  }, [filteredAudits]);

  // Novo cálculo: Bônus por Desconto de NC
  const bonusDesconto = useMemo(() => {
    const base = settings?.bonusBase ?? 150;
    const dAlta = settings?.discountAlta ?? 15;
    const dMedia = settings?.discountMedia ?? 8;
    const dBaixa = settings?.discountBaixa ?? 4;

    const totalDesconto = (ncMetrics.ncAlta * dAlta) + (ncMetrics.ncMedia * dMedia) + (ncMetrics.ncBaixa * dBaixa);
    const bonusFinal = Math.max(0, base - totalDesconto);
    return { base, totalDesconto, bonusFinal, dAlta, dMedia, dBaixa };
  }, [ncMetrics, settings]);

  // Remuneration / Bonificações KPIs
  const remunerationMetrics = useMemo(() => {
    if (filteredAudits.length === 0) return { totalBonus: 0, avgBonus: 0, eliminatedCount: 0 };
    
    let totalBonus = 0;
    let nonEliminatedCount = 0;
    let eliminatedCount = 0;

    filteredAudits.forEach(a => {
      if (a.isEliminated) {
        eliminatedCount++;
      } else {
        totalBonus += a.bonusValue;
        nonEliminatedCount++;
      }
    });

    const avgBonus = totalAudits > 0 ? totalBonus / totalAudits : 0;

    return {
      totalBonus,
      avgBonus,
      eliminatedCount
    };
  }, [filteredAudits, totalAudits]);

  // Days without bonus loss due to safety issues / accidents
  // Let's check the date of the latest audit with an elimination or calculate days from it
  const daysWithoutLoss = useMemo(() => {
    if (audits.length === 0) return null;
    const eliminatedAudits = audits.filter(a => a.isEliminated);
    if (eliminatedAudits.length === 0) {
      // Calculate days since the oldest audit to represent real time without loss, or default to a reasonable baseline
      const sortedAudits = [...audits].sort((a, b) => a.date.localeCompare(b.date));
      const firstAuditDate = new Date(sortedAudits[0].date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - firstAuditDate.getTime());
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return diffDays;
    }
    
    // Sort latest first
    const sorted = [...eliminatedAudits].sort((a, b) => b.date.localeCompare(a.date));
    const lastElimDate = new Date(sorted[0].date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastElimDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [audits]);

  // --- Charts Data Formatters ---

  // 1. Line Chart: Trend over time
  const trendData = useMemo(() => {
    const sortedByDate = [...filteredAudits].sort((a, b) => a.date.localeCompare(b.date));
    // Group by date or just map individual points if limited, or group
    const groups: { [date: string]: { sum: number, count: number } } = {};
    sortedByDate.forEach(a => {
      if (!groups[a.date]) {
        groups[a.date] = { sum: 0, count: 0 };
      }
      groups[a.date].sum += a.isEliminated ? 0 : a.finalScore;
      groups[a.date].count++;
    });

    return Object.keys(groups).map(date => {
      // format date from YYYY-MM-DD to DD/MM
      const parts = date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
      return {
        date: formattedDate,
        'Nota Geral': Math.round(groups[date].sum / groups[date].count),
        'Meta (85%)': 85
      };
    });
  }, [filteredAudits]);

  // 2. Bar Chart: Compliance per Category
  const categoryChartData = useMemo(() => {
    return [
      { name: 'Segurança (40%)', Valor: avgCategoryScores.SEGURANÇA, fill: '#6366f1' },
      { name: 'Qualidade (25%)', Valor: avgCategoryScores.QUALIDADE, fill: '#3b82f6' },
      { name: 'Organização (15%)', Valor: avgCategoryScores.ORGANIZAÇÃO, fill: '#14b8a6' },
      { name: 'Limpeza (10%)', Valor: avgCategoryScores.LIMPEZA, fill: '#f59e0b' },
      { name: 'Gestão (10%)', Valor: avgCategoryScores.GESTÃO, fill: '#ec4899' },
    ];
  }, [avgCategoryScores]);

  // 3. Pie Chart: Shift/Turno distribution
  const turnoPieData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    filteredAudits.forEach(a => {
      counts[a.turno] = (counts[a.turno] || 0) + 1;
    });
    return [
      { name: 'Turno A', value: counts.A, color: '#6366f1' },
      { name: 'Turno B', value: counts.B, color: '#22c55e' },
      { name: 'Turno C', value: counts.C, color: '#eab308' },
      { name: 'Turno D', value: counts.D, color: '#ec4899' },
    ].filter(d => d.value > 0);
  }, [filteredAudits]);

  // 4. Ranking of Conferentes (Rank by avg score)
  const rankingConferentes = useMemo(() => {
    const scores: { [name: string]: { sum: number, count: number, totalBonus: number } } = {};
    filteredAudits.forEach(a => {
      if (!scores[a.conferente]) {
        scores[a.conferente] = { sum: 0, count: 0, totalBonus: 0 };
      }
      scores[a.conferente].sum += a.isEliminated ? 0 : a.finalScore;
      scores[a.conferente].totalBonus += a.bonusValue;
      scores[a.conferente].count++;
    });

    return Object.keys(scores).map(name => {
      const count = scores[name].count;
      return {
        name,
        avg: Math.round(scores[name].sum / count),
        totalAudits: count,
        totalBonus: scores[name].totalBonus
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [filteredAudits]);

  // Heatmap table format for area compliance
  const areaComplianceData = useMemo(() => {
    const scores: { [area: string]: { sum: number, count: number } } = {};
    filteredAudits.forEach(a => {
      if (!scores[a.area]) {
        scores[a.area] = { sum: 0, count: 0 };
      }
      scores[a.area].sum += a.isEliminated ? 0 : a.finalScore;
      scores[a.area].count++;
    });

    return Object.keys(scores).map(name => {
      return {
        name,
        score: Math.round(scores[name].sum / scores[name].count),
        count: scores[name].count
      };
    }).sort((a, b) => b.score - a.score);
  }, [filteredAudits]);

  // Ranking of occurrence locations by number of NCs
  const rankingLocations = useMemo(() => {
    const locCounts: { [loc: string]: number } = {};
    filteredAudits.forEach(audit => {
      audit.answers.forEach(ans => {
        if (ans.status === 'NAO_CONFORME' && ans.details?.occurrenceLocation) {
          const loc = ans.details.occurrenceLocation;
          locCounts[loc] = (locCounts[loc] || 0) + 1;
        }
      });
    });

    return Object.keys(locCounts).map(name => {
      return {
        name,
        count: locCounts[name]
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredAudits]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Interactive Filters Panel */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
              Painel de Filtros Avançados
            </h3>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Date Start */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block">De:</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Date End */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block">Até:</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Turno */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block">Turno:</label>
            <select
              value={selectedTurno}
              onChange={(e) => setSelectedTurno(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Turnos</option>
              <option value="A" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno A</option>
              <option value="B" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno B</option>
              <option value="C" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno C</option>
              <option value="D" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Turno D</option>
            </select>
          </div>

          {/* Conferente */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block">Conferente:</label>
            <select
              value={selectedConferente}
              onChange={(e) => setSelectedConferente(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Conferentes</option>
              {uniqueConferentes.map(name => (
                <option key={name} value={name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{name}</option>
              ))}
            </select>
          </div>

          {/* Auditor */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block">Auditor:</label>
            <select
              value={selectedAuditor}
              onChange={(e) => setSelectedAuditor(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Auditores</option>
              {uniqueAuditores.map(name => (
                <option key={name} value={name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{name}</option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 block">Área Auditada:</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todas as Áreas</option>
              {uniqueAreas.map(name => (
                <option key={name} value={name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Score Geral & Performance Indicator */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Pontuação Geral (Média)
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusIndicator.color} text-slate-950`}>
              {statusIndicator.label}
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              {avgScore}%
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">meta 85%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                avgScore >= 90 ? 'bg-emerald-500' : avgScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${avgScore}%` }}
            />
          </div>
        </div>

        {/* KPI: Bônus por Desconto NC — NOVO SISTEMA */}
        <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Bônus a Pagar</span>
            <Award className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="my-2">
            <span className={`text-3xl font-display font-extrabold ${bonusDesconto.bonusFinal <= 0 ? 'text-rose-500' : bonusDesconto.bonusFinal < bonusDesconto.base * 0.7 ? 'text-amber-500' : 'text-emerald-500'}`}>
              R$ {bonusDesconto.bonusFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Base: R$ {bonusDesconto.base.toFixed(2)} — Desconto: <span className="text-rose-400 font-bold">- R$ {bonusDesconto.totalDesconto.toFixed(2)}</span></span>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>🔴 Alta ({ncMetrics.ncAlta} NCs × R${bonusDesconto.dAlta})</span>
              <span className="text-rose-400 font-bold">- R$ {(ncMetrics.ncAlta * bonusDesconto.dAlta).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>🟡 Média ({ncMetrics.ncMedia} NCs × R${bonusDesconto.dMedia})</span>
              <span className="text-amber-400 font-bold">- R$ {(ncMetrics.ncMedia * bonusDesconto.dMedia).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>🟢 Baixa ({ncMetrics.ncBaixa} NCs × R${bonusDesconto.dBaixa})</span>
              <span className="text-slate-400 font-bold">- R$ {(ncMetrics.ncBaixa * bonusDesconto.dBaixa).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* KPI: Não Conformidades */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Não Conformidades
            </span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="my-3 flex items-baseline gap-4">
            <span className="text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              {ncMetrics.totalNCs}
            </span>
            {ncMetrics.criticalNCs > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-semibold px-2 py-0.5 rounded-md bg-rose-500/10">
                <AlertCircle className="h-3.5 w-3.5" />
                {ncMetrics.criticalNCs} críticas
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
            <span>Turnos Desclassificados:</span>
            <span className="font-semibold text-rose-500">
              {remunerationMetrics.eliminatedCount}
            </span>
          </div>
        </div>

        {/* KPI: Segurança / Sem acidentes */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Dias sem Perda de Bônus (Seg)
            </span>
            <Shield className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="my-3">
            <span className="text-4xl font-display font-extrabold text-emerald-600 dark:text-emerald-400">
              {daysWithoutLoss === null ? '-' : `${daysWithoutLoss} dias`}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mt-1">
              {daysWithoutLoss === null ? 'Aguardando primeira auditoria' : 'Operação sem desclassificações críticas'}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
            <span>Último incidente:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {audits.length === 0 
                ? 'Sem registros' 
                : (remunerationMetrics.eliminatedCount > 0 ? 'Recente' : 'Inexistente no período')}
            </span>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend line over time (Span 2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
                Tendência de Conformidade Operacional
              </h4>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Evolução diária das notas médias dos turnos auditados
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          
          <div className="h-80 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <YAxis 
                    domain={[50, 100]} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155', 
                      color: '#f8fafc' 
                    }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                  <Line 
                    type="monotone" 
                    dataKey="Nota Geral" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  >
                    <LabelList dataKey="Nota Geral" position="top" offset={10} style={{ fontSize: '10px', fill: '#6366f1', fontWeight: 'bold' }} formatter={(val: number) => `${val}%`} />
                  </Line>
                  <Line 
                    type="monotone" 
                    dataKey="Meta (85%)" 
                    stroke="#ef4444" 
                    strokeWidth={1.5} 
                    strokeDasharray="5 5" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Calendar className="h-8 w-8 mb-2 stroke-1" />
                <span className="text-sm">Nenhuma auditoria realizada no período filtrado.</span>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart: Audit Count per Shift / Turno */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
                Auditorias por Turno
              </h4>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Distribuição proporcional de auditorias realizadas
              </p>
            </div>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            {turnoPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={turnoPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {turnoPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="inside" fill="#ffffff" stroke="none" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155', 
                      color: '#f8fafc' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">Sem dados de turnos.</div>
            )}

            {/* Absolute indicator in the center of the pie */}
            {turnoPieData.length > 0 && (
              <div className="absolute text-center flex flex-col pointer-events-none">
                <span className="text-2xl font-display font-extrabold text-slate-800 dark:text-white">
                  {totalAudits}
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total</span>
              </div>
            )}
          </div>

          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 mt-auto border-t border-slate-100 dark:border-slate-850 pt-4">
            {turnoPieData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {d.name}: <strong className="text-slate-800 dark:text-slate-200">{d.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Compliance Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
                Índice de Conformidade por Categoria (Ponderação)
              </h4>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Pontuação média atingida comparada ao peso na remuneração
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-indigo-500" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 25, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    color: '#f8fafc' 
                  }} 
                />
                <Bar dataKey="Valor" radius={[8, 8, 0, 0]} barSize={40}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="Valor" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} formatter={(val: number) => `${val}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap / Area Analysis & Ranking of Conferentes */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col">
          <div className="mb-4">
            <h4 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
              Ranking de Conferentes (BR3R)
            </h4>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Desempenho médio e bonificações estimadas
            </p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1 flex-1">
            {rankingConferentes.length > 0 ? (
              rankingConferentes.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 
                        ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/25' 
                        : idx === 1 
                        ? 'bg-slate-300 text-slate-950' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.totalAudits} audits
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold block ${
                      item.avg >= 90 
                        ? 'text-emerald-500' 
                        : item.avg >= 75 
                        ? 'text-amber-500' 
                        : 'text-rose-500'
                    }`}>
                      {item.avg}%
                    </span>
                    <span className="text-xs text-slate-500">
                      R$ {item.totalBonus.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 py-8">Nenhum conferente rankeado.</div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Local da Ocorrência Ranking & Area Compliance Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ranking of Occurrence Locations */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col">
          <div className="mb-4">
            <h4 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
              Ranking de Locais da Ocorrência
            </h4>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Locais com maior índice de não conformidades registradas
            </p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1 flex-1">
            {rankingLocations.length > 0 ? (
              rankingLocations.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25' 
                        : idx === 1 
                        ? 'bg-orange-400 text-white' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-500 block">
                      {item.count} desvios
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 py-8">Excelente! Nenhum desvio registrado.</div>
            )}
          </div>
        </div>

        {/* Area Compliance Section (Heatmap grid representation) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all flex flex-col">
          <div className="mb-4">
            <h4 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
              Análise de Conformidade por Área Auditada
            </h4>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Visualização em formato Heatmap da aderência aos procedimentos em cada setor da planta
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[350px] pr-1 flex-1">
            {areaComplianceData.map((item, idx) => {
              // Pick color class based on score
              let colorClass = 'bg-rose-500/10 border-rose-500/30 text-rose-500';
              if (item.score >= 90) {
                colorClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
              } else if (item.score >= 75) {
                colorClass = 'bg-amber-500/10 border-amber-500/30 text-amber-500';
              }

              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${colorClass}`}
                >
                  <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block mb-2 break-words">
                    {item.name}
                  </span>
                  <div className="flex items-baseline justify-between mt-auto">
                    <span className="text-2xl font-display font-extrabold">{item.score}%</span>
                    <span className="text-xs text-slate-500 font-semibold">{item.count} aud.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
