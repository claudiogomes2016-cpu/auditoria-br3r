/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ClipboardList, User, Shield, CheckCircle2, AlertTriangle, 
  Camera, Trash2, ChevronRight, ChevronLeft, Save, Sparkles, AlertCircle 
} from 'lucide-react';
import { 
  Audit, AuditQuestion, AuditAnswer, AuditItemStatus, 
  CriticalityLevel, UserRole, RemunerationSettings 
} from '../types';

interface AuditWizardProps {
  currentUser: { username: string; name: string; role: UserRole };
  questions: AuditQuestion[];
  settings: RemunerationSettings;
  onSubmitAudit: (audit: Omit<Audit, 'id' | 'createdAt'>, id?: string) => Promise<boolean>;
  editingAudit?: Audit | null;
  onCancelEdit?: () => void;
}

const SHIFT_HOURS_MAP = {
  A: '06:00 às 18:00',
  B: '18:00 às 06:00',
  C: '06:00 às 18:00',
  D: '18:00 às 06:00'
};

const AUDITED_AREAS = [
  'Toda a Operação',
  'Recebimento',
  'Expedição',
  'Doca 1',
  'Doca 2',
  'Doca 3',
  'Doca 4',
  'Doca 5',
  'Doca 6',
  'Rua de Latas',
  'Rua de Tampa Acabada',
  'Rua de Tampa Básica',
  'Material de Embalagem',
  'Área de Triagem de Embalagens',
  'Área de Retrabalho',
  'Sala dos Conferentes',
  'Área Externa das Docas'
];

const OCCURRENCE_LOCATIONS = [
  'Rua A',
  'Rua B',
  'Rua C',
  'Rua D',
  'Rua E',
  'Rua F',
  'Rua G',
  'Doca 1',
  'Doca 2',
  'Doca 3',
  'Doca 4',
  'Doca 5',
  'Doca 6',
  'Recebimento',
  'Expedição',
  'Rua de Tampa Acabada',
  'Rua de Tampa Básica',
  'Rua de Latas',
  'Material de Embalagem',
  'Área de Triagem de Embalagens',
  'Área de Retrabalho',
  'Sala dos Conferentes',
  'Área Externa das Docas'
];

const AREA_QUESTIONS_MAP: Record<string, string[]> = {
  'Toda a Operação': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'Q1', 'Q2', 'Q3', 'Q4', 'O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'L1', 'L2', 'L3', 'G1', 'G2', 'G3', 'G4'],
  'Recebimento': ['S4', 'S5', 'S6', 'S7', 'Q1', 'Q4', 'O1', 'O7', 'L1', 'L3', 'G1', 'G2', 'G3', 'G4'],
  'Expedição': ['S4', 'S5', 'S6', 'S7', 'Q1', 'Q4', 'O1', 'O7', 'L1', 'L3', 'G1', 'G2', 'G3', 'G4'],
  'Doca 1': ['S1', 'S2', 'S3', 'S5', 'Q4', 'L2', 'L3', 'G3', 'G4'],
  'Doca 2': ['S1', 'S2', 'S3', 'S5', 'Q4', 'L2', 'L3', 'G3', 'G4'],
  'Doca 3': ['S1', 'S2', 'S3', 'S5', 'Q4', 'L2', 'L3', 'G3', 'G4'],
  'Doca 4': ['S1', 'S2', 'S3', 'S5', 'Q4', 'L2', 'L3', 'G3', 'G4'],
  'Doca 5': ['S1', 'S2', 'S3', 'S5', 'Q4', 'L2', 'L3', 'G3', 'G4'],
  'Doca 6': ['S1', 'S2', 'S3', 'S5', 'Q4', 'L2', 'L3', 'G3', 'G4'],
  'Rua de Latas': ['S4', 'S6', 'S7', 'Q1', 'Q2', 'Q4', 'O5', 'O6', 'O7', 'L1', 'G3', 'G4'],
  'Rua de Tampa Acabada': ['S4', 'S6', 'S7', 'Q1', 'Q3', 'Q4', 'O5', 'O6', 'O7', 'L1', 'G3', 'G4'],
  'Rua de Tampa Básica': ['S4', 'S6', 'S7', 'Q1', 'Q3', 'Q4', 'O6', 'O7', 'O9', 'L1', 'G3', 'G4'],
  'Material de Embalagem': ['S4', 'S6', 'S7', 'Q1', 'Q4', 'O2', 'L1', 'G3', 'G4'],
  'Área de Triagem de Embalagens': ['S4', 'S6', 'S7', 'Q1', 'Q4', 'O4', 'L1', 'G3', 'G4'],
  'Área de Retrabalho': ['S4', 'S6', 'S7', 'Q1', 'Q4', 'O3', 'L1', 'G3', 'G4'],
  'Sala dos Conferentes': ['S4', 'S7', 'Q1', 'Q4', 'O8', 'G1', 'G2', 'G3', 'G4'],
  'Área Externa das Docas': ['S1', 'S2', 'S3', 'L2', 'G3', 'G4']
};

export default function AuditWizard({ currentUser, questions, settings, onSubmitAudit, editingAudit = null, onCancelEdit }: AuditWizardProps) {
  // Step 1: Identification, Step 2: Checklist
  const [step, setStep] = useState<1 | 2>(1);

  // Identification fields
  const [auditor, setAuditor] = useState(currentUser.name);
  const [conferente, setConferente] = useState('');
  const [turno, setTurno] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [horarioTurno, setHorarioTurno] = useState('');
  const [liderSodexo, setLiderSodexo] = useState('');
  const [area, setArea] = useState('');
  const [tipo, setTipo] = useState<'Programada' | 'Surpresa' | 'Follow-up' | 'Extraordinária'>('Programada');

  // Checklist responses
  const [answers, setAnswers] = useState<AuditAnswer[]>([]);
  // Current question index in focus (for auto-advance and keyboard)
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // New View Mode State: 'list' (collapsible category accordions) or 'sequential' (focused question-by-question)
  const [viewMode, setViewMode] = useState<'sequential' | 'list'>('list');

  // Track expanded state for categories in List View
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'SEGURANÇA': true,
    'QUALIDADE': true,
    'ORGANIZAÇÃO': true,
    'LIMPEZA': true,
    'GESTÃO': true,
  });

  // Eliminatory Rules states
  const [hasWorkAccident, setHasWorkAccident] = useState(false);
  const [hasFraud, setHasFraud] = useState(false);
  const [hasManipulation, setHasManipulation] = useState(false);
  const [hasHidingAvarias, setHasHidingAvarias] = useState(false);
  const [hasSafetyViolation, setHasSafetyViolation] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);

  // State for Docks 1 to 6 (true = open, false = closed)
  const [openDocks, setOpenDocks] = useState<boolean[]>([false, false, false, false, false, false]);

  // Filter questions based on selected area
  const filteredQuestions = useMemo(() => {
    if (!area || area === 'Toda a Operação') {
      return questions;
    }
    const questionIdsForArea = AREA_QUESTIONS_MAP[area] || [];
    return questions.filter(q => questionIdsForArea.includes(q.id));
  }, [area, questions]);

  // Group filtered questions by category for List View
  const questionsByCategory = useMemo(() => {
    const groups: Record<string, AuditQuestion[]> = {
      'SEGURANÇA': [],
      'QUALIDADE': [],
      'ORGANIZAÇÃO': [],
      'LIMPEZA': [],
      'GESTÃO': [],
    };
    
    filteredQuestions.forEach(q => {
      if (groups[q.category]) {
        groups[q.category].push(q);
      } else {
        groups[q.category] = [q];
      }
    });

    // Remove empty categories if none exist in the filtered questions
    return Object.fromEntries(
      Object.entries(groups).filter(([_, list]) => list.length > 0)
    );
  }, [filteredQuestions]);

  // Sync open docks status with question S1 ("Portas das docas fechadas.")
  useEffect(() => {
    const openDockNumbers = openDocks
      .map((isOpen, idx) => isOpen ? idx + 1 : null)
      .filter((n): n is number => n !== null);

    if (openDockNumbers.length > 0) {
      setAnswers(prev => {
        return prev.map(ans => {
          if (ans.questionId === 'S1') {
            const currentDetails = ans.details || {
              cameraPhotos: [],
              description: '',
              criticality: 'ALTA',
              responsible: liderSodexo || 'Líder Sodexo',
              deadline: calculateDefaultDeadline('ALTA'),
              observations: ''
            };
            return {
              ...ans,
              status: 'NAO_CONFORME',
              details: {
                ...currentDetails,
                criticality: 'ALTA',
                description: `Alerta de Segurança: Porta da(s) Doca(s) ${openDockNumbers.join(', ')} identificada(s) aberta(s). Conforme procedimento Ball BR3R, as docas 1 a 6 devem permanecer fechadas para segurança.`
              }
            };
          }
          return ans;
        });
      });
    }
  }, [openDocks, liderSodexo]);

  // Sync form state with editingAudit if present
  useEffect(() => {
    if (editingAudit) {
      setAuditor(editingAudit.auditor);
      setConferente(editingAudit.conferente);
      setTurno(editingAudit.turno);
      setHorarioTurno(editingAudit.horarioTurno || '');
      setLiderSodexo(editingAudit.liderSodexo);
      setArea(editingAudit.area);
      setTipo(editingAudit.tipo);
      setAnswers(editingAudit.answers || []);
      
      const reasons = editingAudit.eliminationReasons || [];
      setHasWorkAccident(reasons.some(r => r.includes('Acidente')));
      setHasFraud(reasons.some(r => r.includes('Fraude') || r.includes('Integridade')));
      setHasManipulation(reasons.some(r => r.includes('Manipulação')));
      setHasHidingAvarias(reasons.some(r => r.includes('Ocultação')));
      setHasSafetyViolation(reasons.some(r => r.includes('segurança') || r.includes('Segurança') || r.includes('Descumprimento')));
    } else {
      setAuditor(currentUser.name);
      setConferente('');
      setTurno('A');
      setHorarioTurno('');
      setLiderSodexo('');
      setArea('');
      setTipo('Programada');
      setAnswers([]);
      setHasWorkAccident(false);
      setHasFraud(false);
      setHasManipulation(false);
      setHasHidingAvarias(false);
      setHasSafetyViolation(false);
    }
  }, [editingAudit, currentUser]);

  // Initialize answers state with default value or keep existing
  useEffect(() => {
    if (!editingAudit && answers.length === 0 && questions.length > 0) {
      setAnswers(questions.map(q => ({
        questionId: q.id,
        status: 'CONFORME' // Default, allows fast pass!
      })));
    }
  }, [questions, answers, editingAudit]);

  // Handle Answer selection
  const handleSelectStatus = (questionId: string, status: AuditItemStatus) => {
    setAnswers(prev => {
      return prev.map(ans => {
        if (ans.questionId === questionId) {
          // If NAO_CONFORME, initialize details
          const details = status === 'NAO_CONFORME' ? {
            cameraPhotos: [],
            description: '',
            criticality: 'MEDIA' as CriticalityLevel,
            responsible: liderSodexo || 'Líder Sodexo',
            deadline: calculateDefaultDeadline('MEDIA'),
            observations: ''
          } : undefined;

          return { ...ans, status, details };
        }
        return ans;
      });
    });

    // Auto-Advance logic:
    // If selecting 'CONFORME' or 'NAO_APLICAVEL', advance smoothly to the next question (only in sequential mode)
    if (viewMode === 'sequential' && (status === 'CONFORME' || status === 'NAO_APLICAVEL')) {
      if (activeQuestionIdx < filteredQuestions.length - 1) {
        setTimeout(() => {
          setActiveQuestionIdx(prev => prev + 1);
        }, 180); // Smooth delay for micro-animation feel
      }
    }
  };

  const calculateDefaultDeadline = (crit: CriticalityLevel): string => {
    const d = new Date();
    if (crit === 'ALTA') {
      d.setDate(d.getDate() + 1); // Tomorrow
    } else {
      d.setDate(d.getDate() + 3); // 3 days
    }
    return d.toISOString().split('T')[0];
  };

  // Handle detailed fields for Non conformities
  const handleDetailChange = (questionId: string, field: string, value: any) => {
    setAnswers(prev => {
      return prev.map(ans => {
        if (ans.questionId === questionId && ans.details) {
          const updatedDetails = { ...ans.details, [field]: value };
          // If changing criticality, auto-calculate deadline
          if (field === 'criticality') {
            updatedDetails.deadline = calculateDefaultDeadline(value);
          }
          return { ...ans, details: updatedDetails };
        }
        return ans;
      });
    });
  };

  // Camera Simulation: Adds a mock photograph
  const triggerCameraMock = (questionId: string) => {
    // Elegant SVG base64 mock photo representing some logistical issues
    const mockPhotos = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f1f5f9"/><circle cx="150" cy="100" r="40" fill="%23ef4444" opacity="0.1"/><path d="M120 120 L180 120 L150 70 Z" fill="%23ef4444"/><text x="150" y="155" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23334155" text-anchor="middle">NC EVIDENCIA REGISTRADA</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23fef2f2"/><circle cx="150" cy="100" r="30" fill="%23ef4444" opacity="0.2"/><text x="150" y="115" font-family="sans-serif" font-size="30" fill="%23ef4444" text-anchor="middle">⚠️</text><text x="150" y="150" font-family="sans-serif" font-size="11" fill="%23ef4444" text-anchor="middle">Desvio de Segurança - Doca Aberta</text></svg>'
    ];

    const randomPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];

    setAnswers(prev => {
      return prev.map(ans => {
        if (ans.questionId === questionId && ans.details) {
          return {
            ...ans,
            details: {
              ...ans.details,
              cameraPhotos: [...ans.details.cameraPhotos, randomPhoto]
            }
          };
        }
        return ans;
      });
    });
  };

  // Upload Photo manually simulation
  const handleUploadPhoto = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAnswers(prev => {
        return prev.map(ans => {
          if (ans.questionId === questionId && ans.details) {
            return {
              ...ans,
              details: {
                ...ans.details,
                cameraPhotos: [...ans.details.cameraPhotos, base64String]
              }
            };
          }
          return ans;
        });
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (questionId: string, photoIdx: number) => {
    setAnswers(prev => {
      return prev.map(ans => {
        if (ans.questionId === questionId && ans.details) {
          const updatedPhotos = [...ans.details.cameraPhotos];
          updatedPhotos.splice(photoIdx, 1);
          return {
            ...ans,
            details: {
              ...ans.details,
              cameraPhotos: updatedPhotos
            }
          };
        }
        return ans;
      });
    });
  };

  // --- Real-time Calculations ---
  
  const scoreMetrics = useMemo(() => {
    let segN = 0, segC = 0;
    let quaN = 0, quaC = 0;
    let orgN = 0, orgC = 0;
    let limN = 0, limC = 0;
    let gesN = 0, gesC = 0;

    answers.forEach(ans => {
      const question = questions.find(q => q.id === ans.questionId);
      if (!question) return;

      const category = question.category;
      if (ans.status === 'CONFORME') {
        if (category === 'SEGURANÇA') { segC++; segN++; }
        else if (category === 'QUALIDADE') { quaC++; quaN++; }
        else if (category === 'ORGANIZAÇÃO') { orgC++; orgN++; }
        else if (category === 'LIMPEZA') { limC++; limN++; }
        else if (category === 'GESTÃO') { gesC++; gesN++; }
      } else if (ans.status === 'NAO_CONFORME') {
        if (category === 'SEGURANÇA') { segN++; }
        else if (category === 'QUALIDADE') { quaN++; }
        else if (category === 'ORGANIZAÇÃO') { orgN++; }
        else if (category === 'LIMPEZA') { limN++; }
        else if (category === 'GESTÃO') { gesN++; }
      }
    });

    const scoresByCategory = {
      SEGURANÇA: segN > 0 ? Math.round((segC / segN) * 100) : 100,
      QUALIDADE: quaN > 0 ? Math.round((quaC / quaN) * 100) : 100,
      ORGANIZAÇÃO: orgN > 0 ? Math.round((orgC / orgN) * 100) : 100,
      LIMPEZA: limN > 0 ? Math.round((limC / limN) * 100) : 100,
      GESTÃO: gesN > 0 ? Math.round((gesC / gesN) * 100) : 100,
    };

    // Ponderated score calculation
    let finalScore = Math.round(
      (scoresByCategory.SEGURANÇA * 0.40) +
      (scoresByCategory.QUALIDADE * 0.25) +
      (scoresByCategory.ORGANIZAÇÃO * 0.15) +
      (scoresByCategory.LIMPEZA * 0.10) +
      (scoresByCategory.GESTÃO * 0.10)
    );

    if (settings.scoringMethod === 'SIMPLE') {
      const totalC = segC + quaC + orgC + limC + gesC;
      const totalN = (segN - segC) + (quaN - quaC) + (orgN - orgC) + (limN - limC) + (gesN - gesC);
      finalScore = (totalC + totalN) > 0 ? Math.round((totalC / (totalC + totalN)) * 100) : 100;
    }

    // Eliminatory rules check
    const isEliminated = hasWorkAccident || hasFraud || hasManipulation || hasHidingAvarias || hasSafetyViolation;
    const eliminationReasons: string[] = [];
    if (hasWorkAccident) eliminationReasons.push('Acidente de trabalho registrado.');
    if (hasFraud) eliminationReasons.push('Desvio de integridade identificado.');
    if (hasManipulation) eliminationReasons.push('Manipulação de auditoria.');
    if (hasHidingAvarias) eliminationReasons.push('Ocultação deliberada de avarias.');
    if (hasSafetyViolation) eliminationReasons.push('Descumprimento deliberado de normas críticas de segurança.');

    // Calculate Bonus values
    let bonusPercentage = 0;
    let bonusValue = 0;

    if (!isEliminated) {
      const sortedTable = [...settings.table].sort((a, b) => b.minScore - a.minScore);
      const match = sortedTable.find(item => finalScore >= item.minScore);
      if (match) {
        bonusPercentage = match.percentage;
        bonusValue = match.value;
      }
    }

    return {
      scoresByCategory,
      finalScore,
      isEliminated,
      eliminationReasons,
      bonusPercentage,
      bonusValue
    };
  }, [answers, questions, hasWorkAccident, hasFraud, hasManipulation, hasHidingAvarias, hasSafetyViolation, settings]);

  // Proceed to Step 2 validation
  const handleProceedChecklist = () => {
    if (!conferente) {
      setFormError('Selecione o Conferente responsável.');
      return;
    }
    if (!horarioTurno) {
      setFormError('Selecione o Horário de Trabalho.');
      return;
    }
    if (!liderSodexo.trim()) {
      setFormError('Informe o Líder Sodexo do turno.');
      return;
    }
    if (!area.trim()) {
      setFormError('Informe a área que está sendo auditada.');
      return;
    }
    setFormError('');

    // Pre-populate answers: active questions get CONFORME (or current status), others get NAO_APLICAVEL
    const activeIds = filteredQuestions.map(q => q.id);
    setAnswers(questions.map(q => {
      const existing = answers.find(a => a.questionId === q.id);
      if (activeIds.includes(q.id)) {
        return {
          questionId: q.id,
          status: (existing && existing.status !== 'NAO_APLICAVEL') ? existing.status : 'CONFORME',
          details: existing?.details
        };
      } else {
        return {
          questionId: q.id,
          status: 'NAO_APLICAVEL'
        };
      }
    }));

    setActiveQuestionIdx(0);
    setStep(2);
  };

  // Submit Audit
  const handleSubmit = async () => {
    // Validate that all questions are answered
    const unanswered = answers.some(ans => !ans.status);
    if (unanswered) {
      setFormError('Por favor, responda todas as perguntas da auditoria.');
      return;
    }

    // Validate photo-mandatory fields and occurrence locations for Non-Conformances
    let photoValidationFailed = false;
    let locationValidationFailed = false;
    answers.forEach(ans => {
      if (ans.status === 'NAO_CONFORME') {
        const question = questions.find(q => q.id === ans.questionId);
        if (question?.photoRequired && (!ans.details?.cameraPhotos || ans.details.cameraPhotos.length === 0)) {
          photoValidationFailed = true;
        }
        if (!ans.details?.occurrenceLocation || !ans.details.occurrenceLocation.trim()) {
          locationValidationFailed = true;
        }
      }
    });

    if (locationValidationFailed) {
      setFormError('Por favor, selecione o "Local da Ocorrência" para todas as Não Conformidades.');
      return;
    }

    if (photoValidationFailed) {
      setFormError('Evidência fotográfica é obrigatória para itens de segurança ou qualidade em "Não Conforme".');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const auditData: Omit<Audit, 'id' | 'createdAt'> = {
      date: editingAudit ? editingAudit.date : new Date().toISOString().split('T')[0],
      time: editingAudit ? editingAudit.time : new Date().toTimeString().slice(0, 5),
      auditor,
      conferente,
      turno,
      horarioTurno,
      liderSodexo: liderSodexo.trim(),
      area: area.trim(),
      tipo,
      answers,
      scoresByCategory: scoreMetrics.scoresByCategory,
      isEliminated: scoreMetrics.isEliminated,
      eliminationReasons: scoreMetrics.eliminationReasons,
      finalScore: scoreMetrics.finalScore,
      bonusPercentage: scoreMetrics.bonusPercentage,
      bonusValue: scoreMetrics.bonusValue,
      createdByUser: editingAudit ? editingAudit.createdByUser : currentUser.username
    };

    try {
      const success = await onSubmitAudit(auditData, editingAudit?.id);
      if (success) {
        setShowSuccessCelebration(true);
        // Reset states
        setStep(1);
        setConferente('');
        setLiderSodexo('');
        setArea('');
        setAnswers([]);
        setActiveQuestionIdx(0);
        setHasWorkAccident(false);
        setHasFraud(false);
        setHasManipulation(false);
        setHasHidingAvarias(false);
        setHasSafetyViolation(false);
        
        if (editingAudit && onCancelEdit) {
          onCancelEdit();
        }
        
        setTimeout(() => {
          setShowSuccessCelebration(false);
        }, 5000);
      } else {
        setFormError('Ocorreu um erro ao salvar a auditoria no banco de dados.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Erro ao conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeQuestion = filteredQuestions[activeQuestionIdx];
  const activeAnswer = answers.find(a => a.questionId === activeQuestion?.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      
      {/* Edit Banner alert */}
      {editingAudit && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-between text-xs font-semibold no-print">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 animate-pulse text-amber-500" />
            <span>Você está EDITANDO um registro existente (Código: <strong>{editingAudit.id}</strong>). Corrija os dados necessários e grave para atualizar.</span>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-all cursor-pointer"
          >
            Cancelar Edição
          </button>
        </div>
      )}

      {/* Celebration overlay */}
      {showSuccessCelebration && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl max-w-md space-y-6 shadow-2xl shadow-emerald-500/10">
            <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
              🎉
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-extrabold text-white">Auditoria Finalizada!</h3>
              <p className="text-slate-400 text-sm">
                Os dados foram gravados com sucesso. O histórico e os planos de ação foram criados automaticamente no banco de dados.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-300 text-xs text-left divide-y divide-slate-900 font-mono">
              <div className="py-1 flex justify-between">
                <span>Nota Final:</span>
                <span className="font-bold text-emerald-400">{scoreMetrics.finalScore}%</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>Bonificação:</span>
                <span className="font-bold text-indigo-400">R$ {scoreMetrics.bonusValue.toFixed(2)}</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>Conferente:</span>
                <span>{conferente}</span>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessCelebration(false)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm transition-all"
            >
              OK, Continuar
            </button>
          </div>
        </div>
      )}

      {/* Wizard Header Progress */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
            <ClipboardList className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-display font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
              Formulário de Auditoria de Campo (5-Minutos)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rápido, visual e auto-avançável.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            step === 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            1. Identificação
          </span>
          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700 shrink-0" />
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            step === 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            2. Lista de Verificação
          </span>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left/Main Form Area (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: IDENTIFICATION FORM */}
          {step === 1 && (
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
                <h4 className="text-base font-display font-bold text-slate-800 dark:text-slate-100">
                  Dados de Identificação
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Insira as informações básicas antes de iniciar o checklist.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date/Time Read-only */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Data / Hora Atual
                  </label>
                  <div className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>

                {/* Auditor Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Auditor Responsável
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={auditor}
                      onChange={(e) => setAuditor(e.target.value)}
                      className="block w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                {/* Conferente (Drop-down) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Conferente Sob Auditoria
                  </label>
                  <select
                    value={conferente}
                    onChange={(e) => setConferente(e.target.value)}
                    className="block w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="" className="text-slate-500 bg-white dark:bg-slate-950">Selecione o Conferente...</option>
                    <option value="Luiz Domingos" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Luiz Domingos</option>
                    <option value="Paulo Danilo" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Paulo Danilo</option>
                    <option value="Romualdo Reinaldo" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Romualdo Reinaldo</option>
                    <option value="José Cláudio" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">José Cláudio</option>
                  </select>
                </div>

                 {/* Turno (Drop-down) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Turma (Turno)
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value as 'A' | 'B' | 'C' | 'D')}
                    className="block w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="A" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Turma A</option>
                    <option value="B" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Turma B</option>
                    <option value="C" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Turma C</option>
                    <option value="D" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Turma D</option>
                  </select>
                </div>

                {/* Shift Hours Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Horário de Trabalho
                  </label>
                  <select
                    value={horarioTurno}
                    onChange={(e) => setHorarioTurno(e.target.value)}
                    className="block w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="" className="text-slate-500 bg-white dark:bg-slate-950">Selecione o Horário...</option>
                    <option value="06:00 às 18:00" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">06:00 às 18:00</option>
                    <option value="18:00 às 06:00" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">18:00 às 06:00</option>
                    <option value="08:00 às 17:00" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">08:00 às 17:00</option>
                    <option value="07:00 às 17:00" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">07:00 às 17:00</option>
                  </select>
                </div>

                {/* Tipo de Auditoria */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Tipo de Auditoria
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="block w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Programada" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Programada</option>
                    <option value="Surpresa" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Surpresa</option>
                    <option value="Follow-up" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Follow-up (Acompanhamento)</option>
                    <option value="Extraordinária" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">Extraordinária</option>
                  </select>
                </div>

                {/* Líder Sodexo */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Nome do Líder Sodexo
                  </label>
                  <input
                    type="text"
                    value={liderSodexo}
                    onChange={(e) => setLiderSodexo(e.target.value)}
                    placeholder="Ex: Carlos Sodexo"
                    className="block w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Área auditada */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Área Auditada
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="block w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="" className="text-slate-500 bg-white dark:bg-slate-950">Selecione a Área Auditada...</option>
                    {AUDITED_AREAS.map(option => (
                      <option key={option} value={option} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedChecklist}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Iniciar Checklist
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVE CHECKLIST & PHOTO EVIDENCE */}
          {step === 2 && filteredQuestions.length > 0 && activeQuestion && (
            <div className="space-y-6">
              
              {/* View Mode Switcher and Quick Question Selector */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    📂 Lista por Categorias (Rápido)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('sequential')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'sequential'
                        ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    🎯 Pergunta a Pergunta (Foco)
                  </button>
                </div>

                {viewMode === 'sequential' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ir para:</span>
                    <select
                      value={activeQuestionIdx}
                      onChange={(e) => setActiveQuestionIdx(Number(e.target.value))}
                      className="p-2 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none text-slate-900 dark:text-slate-100 max-w-[200px] sm:max-w-[240px] cursor-pointer"
                    >
                      {filteredQuestions.map((q, idx) => (
                        <option key={q.id} value={idx}>
                          [{q.id}] {q.category} - {q.text.slice(0, 32)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* VIEW MODE 1: SEQUENTIAL (SINGLE ACTIVE QUESTION MODE) */}
              {viewMode === 'sequential' && (
                <>
                  {/* Question Navigation Tracker */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl">
                    <button
                      onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
                      disabled={activeQuestionIdx === 0}
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </button>

                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                      Questão <strong className="text-indigo-600 dark:text-indigo-400">{activeQuestionIdx + 1}</strong> de <strong>{filteredQuestions.length}</strong>
                    </span>

                    <button
                      onClick={() => setActiveQuestionIdx(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                      disabled={activeQuestionIdx === filteredQuestions.length - 1}
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>

                  {/* ACTIVE QUESTION CARD */}
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-6">
                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-xs font-bold text-indigo-500 tracking-widest uppercase">
                          Categoria: {activeQuestion.category}
                        </span>
                      </div>
                      {activeQuestion.photoRequired && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Foto Obrigatória se NC
                        </span>
                      )}
                    </div>

                    {/* Question Text */}
                    <h3 className="text-lg font-display font-extrabold text-slate-800 dark:text-white leading-relaxed">
                      {activeQuestion.text}
                    </h3>

                    {/* Sub-UI for Docks 1 to 6 under question S1 */}
                    {activeQuestion.id === 'S1' && (
                      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 space-y-3 animate-fade-in font-sans">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Verificação de Segurança Ball BR3R</span>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Status das Portas das Docas (1 a 6)
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium font-mono">1 a 6 abertas = NOTIFICAR</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                          {openDocks.map((isOpen, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const updated = [...openDocks];
                                updated[idx] = !isOpen;
                                setOpenDocks(updated);
                              }}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                isOpen
                                  ? 'bg-rose-500/15 border-rose-500 text-rose-500 shadow-sm shadow-rose-500/10'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <span className="text-[10px] uppercase font-mono">Doca {idx + 1}</span>
                              <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                              <span className="text-[9px] font-mono">{isOpen ? 'ABERTA 🔴' : 'FECHADA 🟢'}</span>
                            </button>
                          ))}
                        </div>

                        {openDocks.some(o => o) && (
                          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-[11px] text-rose-500 flex items-start gap-2 animate-fade-in font-medium leading-relaxed">
                            <span className="mt-0.5">⚠️</span>
                            <div>
                              <strong className="block uppercase text-[10px] font-bold tracking-wider">Doca Aberta Identificada!</strong>
                              Esta conformidade de segurança foi marcada automaticamente como <strong className="underline">NÃO CONFORME</strong> com prioridade <strong className="underline">ALTA</strong>. O plano de ação para a equipe de logística será gerado imediatamente para fechamento das portas.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Option Selector Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeQuestion.id === 'S1') {
                            setOpenDocks([false, false, false, false, false, false]);
                          }
                          handleSelectStatus(activeQuestion.id, 'CONFORME');
                        }}
                        className={`p-5 rounded-2xl border-2 text-sm sm:text-base font-black tracking-wide uppercase flex flex-col items-center gap-3 cursor-pointer transition-all ${
                          activeAnswer?.status === 'CONFORME'
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                        }`}
                      >
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white rounded-full p-0.5" />
                        <span className={activeAnswer?.status === 'CONFORME' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}>CONFORME</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectStatus(activeQuestion.id, 'NAO_CONFORME')}
                        className={`p-5 rounded-2xl border-2 text-sm sm:text-base font-black tracking-wide uppercase flex flex-col items-center gap-3 cursor-pointer transition-all ${
                          activeAnswer?.status === 'NAO_CONFORME'
                            ? 'bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-600/30 scale-[1.02]'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/5'
                        }`}
                      >
                        <AlertTriangle className="h-6 w-6 text-rose-500 bg-white rounded-full p-0.5" />
                        <span className={activeAnswer?.status === 'NAO_CONFORME' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}>NÃO CONFORME</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectStatus(activeQuestion.id, 'NAO_APLICAVEL')}
                        className={`p-5 rounded-2xl border-2 text-sm sm:text-base font-black tracking-wide uppercase flex flex-col items-center gap-3 cursor-pointer transition-all ${
                          activeAnswer?.status === 'NAO_APLICAVEL'
                            ? 'bg-slate-600 border-slate-700 text-white shadow-lg shadow-slate-600/30 scale-[1.02]'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-880 text-slate-600 dark:text-slate-400 hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        <AlertCircle className="h-6 w-6 text-slate-500 bg-white rounded-full p-0.5" />
                        <span className={activeAnswer?.status === 'NAO_APLICAVEL' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}>NÃO APLICÁVEL</span>
                      </button>
                    </div>

                    {/* NON-CONFORMANCE EXPANSION PANEL */}
                    {activeAnswer?.status === 'NAO_CONFORME' && activeAnswer.details && (
                      <div className="p-6 rounded-2xl border-2 border-rose-500/35 bg-rose-500/5 space-y-5 animate-fade-in font-sans">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 pb-3 border-b border-rose-500/20">
                          <AlertCircle className="h-5 w-5 animate-bounce" />
                          <span className="text-sm font-black uppercase tracking-wide">Parâmetros de Desvio e Plano de Ação</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Criticality */}
                          <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase">Grau de Criticidade</label>
                            <select
                              value={activeAnswer.details.criticality}
                              onChange={(e) => handleDetailChange(activeQuestion.id, 'criticality', e.target.value as CriticalityLevel)}
                              className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-200"
                            >
                              <option value="BAIXA" className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950">BAIXA</option>
                              <option value="MEDIA" className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950">MÉDIA</option>
                              <option value="ALTA" className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950">ALTA (Norma Crítica de Segurança)</option>
                            </select>
                          </div>

                          {/* Local da Ocorrência */}
                          <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase">Local da Ocorrência <span className="text-rose-500 font-bold">*</span></label>
                            <select
                              value={activeAnswer.details.occurrenceLocation || ''}
                              onChange={(e) => handleDetailChange(activeQuestion.id, 'occurrenceLocation', e.target.value)}
                              className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-200"
                            >
                              <option value="" className="text-slate-500 bg-white dark:bg-slate-950">Selecione o Local...</option>
                              {OCCURRENCE_LOCATIONS.map(loc => (
                                <option key={loc} value={loc} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950">{loc}</option>
                              ))}
                            </select>
                          </div>

                          {/* Responsible (Defaults to lider sodexo) */}
                          <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase">Responsável por Resolver</label>
                            <input
                              type="text"
                              value={activeAnswer.details.responsible}
                              onChange={(e) => handleDetailChange(activeQuestion.id, 'responsible', e.target.value)}
                              className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          {/* Deadline */}
                          <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase">Prazo de Resolução</label>
                            <input
                              type="date"
                              value={activeAnswer.details.deadline}
                              onChange={(e) => handleDetailChange(activeQuestion.id, 'deadline', e.target.value)}
                              className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase">Descrição do Desvio / Ocorrência</label>
                            <textarea
                              rows={2}
                              value={activeAnswer.details.description}
                              onChange={(e) => handleDetailChange(activeQuestion.id, 'description', e.target.value)}
                              placeholder="Descreva o que foi encontrado de irregular no local..."
                              className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>

                        {/* Camera Photo section */}
                        <div className="space-y-3 border-t border-rose-500/20 pt-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase block">
                              Evidências Fotográficas ({activeAnswer.details.cameraPhotos.length}) {activeQuestion.photoRequired && <span className="text-rose-500 font-bold">*</span>}
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => triggerCameraMock(activeQuestion.id)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10 transition-all"
                              >
                                <Camera className="h-4 w-4" />
                                Simular Câmera
                              </button>
                              
                              <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all">
                                <Camera className="h-4 w-4" />
                                Anexar Foto
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleUploadPhoto(activeQuestion.id, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Photos List Grid */}
                          {activeAnswer.details.cameraPhotos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {activeAnswer.details.cameraPhotos.map((p, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg border border-slate-200 overflow-hidden bg-slate-950 group">
                                  <img src={p} alt="Evidencia" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(activeQuestion.id, idx)}
                                    className="absolute top-1 right-1 p-1 bg-rose-600 rounded-md text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 border border-dashed border-rose-500/20 rounded-lg text-slate-400 text-xs">
                              Nenhuma foto tirada ou anexada até o momento.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* VIEW MODE 2: COLLAPSIBLE CATEGORIES LIST MODE (THE SUPER-SPEEDY MODE) */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {(Object.entries(questionsByCategory) as [string, AuditQuestion[]][]).map(([category, catQuestions]) => {
                    const isExpanded = !!expandedCategories[category];
                    
                    const IconComponent = 
                      category === 'SEGURANÇA' ? Shield :
                      category === 'QUALIDADE' ? CheckCircle2 :
                      category === 'ORGANIZAÇÃO' ? ClipboardList :
                      category === 'LIMPEZA' ? Sparkles : User;
                    
                    const iconColor = 
                      category === 'SEGURANÇA' ? 'text-rose-500 bg-rose-500/10' :
                      category === 'QUALIDADE' ? 'text-blue-500 bg-blue-500/10' :
                      category === 'ORGANIZAÇÃO' ? 'text-teal-500 bg-teal-500/10' :
                      category === 'LIMPEZA' ? 'text-amber-500 bg-amber-500/10' :
                      'text-pink-500 bg-pink-500/10';

                    const totalCat = catQuestions.length;
                    const answeredCat = catQuestions.filter(q => {
                      const ans = answers.find(a => a.questionId === q.id);
                      return ans && ans.status;
                    }).length;

                    return (
                      <div 
                        key={category} 
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                      >
                        {/* Accordion Trigger Header */}
                        <button
                          type="button"
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-850/80 transition-all text-left border-b border-slate-150 dark:border-slate-850 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${iconColor}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-display font-black text-slate-850 dark:text-white tracking-tight uppercase">
                                {category}
                              </h4>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mt-1">
                                Peso no Bônus: {
                                  category === 'SEGURANÇA' ? '40%' :
                                  category === 'QUALIDADE' ? '25%' :
                                  category === 'ORGANIZAÇÃO' ? '15%' :
                                  category === 'LIMPEZA' ? '10%' : '10%'
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-black bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200">
                              {answeredCat}/{totalCat} respondidos
                            </span>
                            <div className="text-slate-400">
                              {isExpanded ? (
                                <ChevronLeft className="h-4 w-4 rotate-270 transition-all transform" />
                              ) : (
                                <ChevronRight className="h-4 w-4 rotate-90 transition-all transform" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Accordion Panel Content */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-850">
                            {catQuestions.map((q) => {
                              const ans = answers.find(a => a.questionId === q.id);
                              
                              return (
                                <div key={q.id} className="p-4 sm:p-5 space-y-4 hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-all">
                                  
                                  {/* Item header: Code, text, dropdown */}
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                      <span className="px-3 py-1 rounded-xl font-mono font-black text-sm text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 border border-indigo-500/20 shrink-0 mt-0.5 animate-pulse">
                                        {q.id}
                                      </span>
                                      <div className="space-y-1.5">
                                        <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                          {q.text}
                                        </p>
                                        {q.photoRequired && (
                                          <span className="inline-block text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 uppercase tracking-wider">
                                            ⚠️ Foto Obrigatória se Não Conforme
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Selector Buttons (Replacing drop-down for much better usability) */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 self-end md:self-start shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (q.id === 'S1') {
                                            setOpenDocks([false, false, false, false, false, false]);
                                          }
                                          handleSelectStatus(q.id, 'CONFORME');
                                        }}
                                        className={`px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                                          ans?.status === 'CONFORME'
                                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                                        }`}
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Conforme
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSelectStatus(q.id, 'NAO_CONFORME')}
                                        className={`px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                                          ans?.status === 'NAO_CONFORME'
                                            ? 'bg-rose-600 border-rose-700 text-white shadow-md shadow-rose-600/20 scale-[1.02]'
                                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5'
                                        }`}
                                      >
                                        <AlertTriangle className="h-4 w-4" />
                                        Não Conforme
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSelectStatus(q.id, 'NAO_APLICAVEL')}
                                        className={`px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer transition-all border-2 ${
                                          ans?.status === 'NAO_APLICAVEL'
                                            ? 'bg-slate-600 border-slate-700 text-white shadow-md shadow-slate-600/20 scale-[1.02]'
                                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                        }`}
                                      >
                                        <AlertCircle className="h-4 w-4" />
                                        N/A
                                      </button>
                                    </div>
                                  </div>

                                  {/* Special sub-UI for S1 ports */}
                                  {q.id === 'S1' && (
                                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/40 space-y-3 font-sans">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Verificação de Segurança Ball BR3R</span>
                                        <span className="text-[9px] text-slate-400 font-mono">Docas 1 a 6 abertas = NOTIFICAR</span>
                                      </div>
                                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {openDocks.map((isOpen, dIdx) => (
                                          <button
                                            key={dIdx}
                                            type="button"
                                            onClick={() => {
                                              const updated = [...openDocks];
                                              updated[dIdx] = !isOpen;
                                              setOpenDocks(updated);
                                            }}
                                            className={`p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                              isOpen
                                                ? 'bg-rose-500/15 border-rose-500 text-rose-500 shadow-sm'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                          >
                                            <span className="text-[9px] uppercase font-mono">Doca {dIdx + 1}</span>
                                            <span className="text-[9px] font-bold">{isOpen ? 'ABERTA 🔴' : 'FECHADA 🟢'}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Deviation / Action Plan inline panel if status is NAO_CONFORME */}
                                  {ans?.status === 'NAO_CONFORME' && ans.details && (
                                    <div className="p-5 rounded-2xl border-2 border-rose-500/30 bg-rose-500/5 space-y-5 animate-fade-in text-sm font-sans">
                                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 border-b border-rose-500/20 pb-3">
                                        <AlertCircle className="h-5 w-5" />
                                        <span className="text-sm font-black uppercase tracking-wide">Parâmetros de Desvio e Plano de Ação - Item {q.id}</span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Criticality */}
                                        <div className="space-y-1.5">
                                          <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase block">Grau de Criticidade</label>
                                          <select
                                            value={ans.details.criticality}
                                            onChange={(e) => handleDetailChange(q.id, 'criticality', e.target.value as CriticalityLevel)}
                                            className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                          >
                                            <option value="BAIXA">BAIXA</option>
                                            <option value="MEDIA">MÉDIA</option>
                                            <option value="ALTA">ALTA (Norma Crítica de Segurança)</option>
                                          </select>
                                        </div>

                                        {/* Local da Ocorrência */}
                                        <div className="space-y-1.5">
                                          <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase block">Local da Ocorrência <span className="text-rose-500 font-bold">*</span></label>
                                          <select
                                            value={ans.details.occurrenceLocation || ''}
                                            onChange={(e) => handleDetailChange(q.id, 'occurrenceLocation', e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                          >
                                            <option value="">Selecione o Local...</option>
                                            {OCCURRENCE_LOCATIONS.map(loc => (
                                              <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Responsible */}
                                        <div className="space-y-1.5">
                                          <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase block">Responsável por Resolver</label>
                                          <input
                                            type="text"
                                            value={ans.details.responsible}
                                            onChange={(e) => handleDetailChange(q.id, 'responsible', e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                          />
                                        </div>

                                        {/* Deadline */}
                                        <div className="space-y-1.5">
                                          <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase block">Prazo de Resolução</label>
                                          <input
                                            type="date"
                                            value={ans.details.deadline}
                                            onChange={(e) => handleDetailChange(q.id, 'deadline', e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                          />
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1.5 sm:col-span-2">
                                          <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase block">Descrição do Desvio / Ocorrência</label>
                                          <textarea
                                            rows={2}
                                            value={ans.details.description}
                                            onChange={(e) => handleDetailChange(q.id, 'description', e.target.value)}
                                            placeholder="Descreva o desvio encontrado..."
                                            className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                          />
                                        </div>
                                      </div>

                                      {/* Photo Section */}
                                      <div className="space-y-3 border-t border-rose-500/20 pt-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <label className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-300 uppercase block">
                                            Evidências Fotográficas ({ans.details.cameraPhotos.length}) {q.photoRequired && <span className="text-rose-500 font-bold">*</span>}
                                          </label>
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => triggerCameraMock(q.id)}
                                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10 transition-all"
                                            >
                                              <Camera className="h-4 w-4" />
                                              Simular Câmera
                                            </button>
                                            
                                            <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all">
                                              <Camera className="h-4 w-4" />
                                              Anexar Foto
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleUploadPhoto(q.id, e)}
                                                className="hidden"
                                              />
                                            </label>
                                          </div>
                                        </div>

                                        {ans.details.cameraPhotos.length > 0 ? (
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {ans.details.cameraPhotos.map((photo, photoIdx) => (
                                              <div key={photoIdx} className="relative aspect-video rounded-lg border border-slate-200 overflow-hidden bg-slate-950 group">
                                                <img src={photo} alt="Evidencia" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                                <button
                                                  type="button"
                                                  onClick={() => removePhoto(q.id, photoIdx)}
                                                  className="absolute top-1 right-1 p-1 bg-rose-600 rounded-md text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-4 border border-dashed border-rose-500/20 rounded-lg text-slate-400 text-xs">
                                            Nenhuma foto anexada.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STICKY BOTTOM NAVIGATION BAR FOR CHECKLIST */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === 'list') {
                      setStep(1);
                    } else if (activeQuestionIdx > 0) {
                      setActiveQuestionIdx(prev => Math.max(0, prev - 1));
                    } else {
                      setStep(1); // Go back to step 1
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer"
                >
                  Voltar
                </button>

                <div className="flex gap-2">
                  {viewMode === 'list' ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/15"
                    >
                      {submitting ? 'Salvando...' : 'Finalizar Auditoria'}
                      <Save className="h-4 w-4" />
                    </button>
                  ) : activeQuestionIdx < filteredQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                      className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      Avançar Questão
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/15"
                    >
                      {submitting ? 'Salvando...' : 'Finalizar Auditoria'}
                      <Save className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* ELIMINATORY RULES CARD */}
              <div className="p-6 rounded-2xl border border-rose-500/35 bg-white dark:bg-slate-900 shadow-md space-y-4">
                <div className="flex items-center gap-2 text-rose-500 border-b border-rose-500/10 pb-3">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="text-sm font-display font-extrabold uppercase tracking-wide">
                    Regras Eliminatórias (Perda Integral de Bônus)
                  </h4>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Marque caso tenha ocorrido algum incidente crítico no turno em apuração. Isso anula 100% das bonificações da equipe, independente da nota.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-rose-500/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasWorkAccident}
                      onChange={(e) => setHasWorkAccident(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Acidente de Trabalho</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Relacionado a procedimentos de segurança</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-rose-500/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFraud}
                      onChange={(e) => setHasFraud(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Desvio de Integridade</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Qualquer falsidade material identificada</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-rose-500/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasManipulation}
                      onChange={(e) => setHasManipulation(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Manipulação de Auditoria</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Adulteração de notas ou fotos</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-rose-500/5 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHidingAvarias}
                      onChange={(e) => setHasHidingAvarias(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Ocultação de Avarias</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Tentativa de ocultar perdas materiais</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-rose-500/5 sm:col-span-2 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSafetyViolation}
                      onChange={(e) => setHasSafetyViolation(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Descumprimento de Normas Críticas de Segurança</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Violação flagrante de regras de ouro da planta (e.g. trava-rodas não usados)</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Sidebar: Live Calculator & Metas (Col-span 1) */}
        <div className="space-y-6">
          
          {/* Live Auditor Panel Indicator */}
          <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-5">
            <h4 className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Painel de Desempenho em Tempo Real
            </h4>
            
            <div className="space-y-4">
              {/* Score Display */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 text-center relative overflow-hidden">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase block tracking-widest">Nota Ponderada Atual</span>
                <span className={`text-5xl font-display font-black block my-2.5 ${
                  scoreMetrics.isEliminated 
                    ? 'text-rose-500' 
                    : scoreMetrics.finalScore >= 90 
                    ? 'text-emerald-500 animate-pulse' 
                    : scoreMetrics.finalScore >= 75 
                    ? 'text-amber-500' 
                    : 'text-rose-500'
                }`}>
                  {scoreMetrics.isEliminated ? '0%' : `${scoreMetrics.finalScore}%`}
                </span>
                
                {scoreMetrics.isEliminated ? (
                  <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full inline-block">
                    DESCLASSIFICADO
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Aprovado para Bônus? {scoreMetrics.finalScore >= 70 ? '🟢 Sim' : '🔴 Não (abaixo de 70%)'}
                  </span>
                )}
              </div>

              {/* Bonus value display */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase block">Bonificação Individual</span>
                  <span className="text-xl font-display font-black text-slate-850 dark:text-white mt-1.5 block">
                    {scoreMetrics.isEliminated ? 'R$ 0,00' : `R$ ${scoreMetrics.bonusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase block">Percentual</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block mt-1.5">
                    {scoreMetrics.isEliminated ? '0%' : `${scoreMetrics.bonusPercentage}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Score by Category Progress list */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Aderência por Categoria</span>
              
              <div className="space-y-3">
                {[
                  { name: 'Segurança (40%)', score: scoreMetrics.scoresByCategory.SEGURANÇA, color: 'bg-indigo-500' },
                  { name: 'Qualidade (25%)', score: scoreMetrics.scoresByCategory.QUALIDADE, color: 'bg-blue-500' },
                  { name: 'Organização (15%)', score: scoreMetrics.scoresByCategory.ORGANIZAÇÃO, color: 'bg-teal-500' },
                  { name: 'Limpeza (10%)', score: scoreMetrics.scoresByCategory.LIMPEZA, color: 'bg-amber-500' },
                  { name: 'Gestão (10%)', score: scoreMetrics.scoresByCategory.GESTÃO, color: 'bg-pink-500' },
                ].map((c) => (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{c.name}</span>
                      <span className="font-mono">{c.score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick instructions for the 5 minute audit limit */}
          <div className="p-5 rounded-2xl border border-dashed border-indigo-500/20 bg-indigo-500/5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4.5 w-4.5" />
              <h5 className="text-xs font-display font-extrabold uppercase tracking-wide">Como auditar em 5 min?</h5>
            </div>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Mantenha as respostas que estão em conformidade como <strong className="text-emerald-500">Conforme</strong>. Elas avançam automaticamente para poupar cliques.</li>
              <li>Só pare para preencher o formulário detalhado e anexar foto se houver uma <strong className="text-rose-500">Não Conformidade</strong>.</li>
              <li>Adicione evidências fotográficas rápidas usando os botões de simulação ou anexando diretamente pelo celular.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
