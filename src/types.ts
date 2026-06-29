/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'AUDITOR' | 'VISUALIZADOR';

export interface User {
  username: string;
  name: string;
  role: UserRole;
}

export interface AccessLog {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  timestamp: string; // ISO string
  ip?: string;
  userAgent?: string;
}

export type AuditItemStatus = 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICAVEL';
export type CriticalityLevel = 'BAIXA' | 'MEDIA' | 'ALTA';

export interface AuditItemDetails {
  cameraPhotos: string[]; // Base64 or local server URLs
  description: string;
  criticality: CriticalityLevel;
  responsible: string;
  deadline: string; // Date string
  observations: string;
  occurrenceLocation?: string;
}

export interface AuditQuestion {
  id: string;
  category: 'SEGURANÇA' | 'QUALIDADE' | 'ORGANIZAÇÃO' | 'LIMPEZA' | 'GESTÃO';
  text: string;
  photoRequired?: boolean;
}

export interface AuditAnswer {
  questionId: string;
  status: AuditItemStatus;
  details?: AuditItemDetails;
}

export interface Audit {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  auditor: string;
  conferente: string; // Luiz Domingos, Paulo Danilo, Romualdo Reinaldo, José Cláudio
  turno: 'A' | 'B' | 'C' | 'D';
  horarioTurno: string; // Preenchido automaticamente conforme a turma
  liderSodexo: string;
  area: string;
  tipo: 'Programada' | 'Surpresa' | 'Follow-up' | 'Extraordinária';
  
  // Respostas
  answers: AuditAnswer[];
  
  // Notas por Categoria (0-100)
  scoresByCategory: {
    SEGURANÇA: number;
    QUALIDADE: number;
    ORGANIZAÇÃO: number;
    LIMPEZA: number;
    GESTÃO: number;
  };
  
  // Regras eliminatórias aplicadas?
  isEliminated: boolean;
  eliminationReasons: string[]; // 'Acidente de trabalho', 'Fraude', etc.
  
  // Nota Ponderada Geral (0-100)
  finalScore: number;
  
  // Remuneração Variável
  bonusPercentage: number; // e.g., 95%
  bonusValue: number; // e.g., R$ 237,50
  
  // Metadados
  createdByUser: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActionPlan {
  id: string;
  auditId: string;
  questionId: string;
  questionText: string;
  category: string;
  conferente: string;
  turno: string;
  description: string;
  criticality: CriticalityLevel;
  responsible: string;
  deadline: string;
  observations: string;
  photos: string[];
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  resolutionTime?: number; // em horas, preenchido quando concluído
  completedAt?: string;
  occurrenceLocation?: string;
  history: {
    timestamp: string;
    action: string;
    user: string;
  }[];
}

export interface BonusConfigItem {
  minScore: number; // e.g. 95 (for >= 95%)
  percentage: number; // e.g. 95
  value: number; // e.g. 237.5
}

export interface RemunerationSettings {
  table: BonusConfigItem[];
  maxBonusValue: number; // e.g. 250.00
  scoringMethod?: 'WEIGHTED' | 'SIMPLE';
}
