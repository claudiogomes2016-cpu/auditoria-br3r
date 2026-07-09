import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const USERS = [
  { username: 'rickson', name: 'Rickson (Analista)', role: 'ADMIN' as const },
  { username: 'claudio', name: 'Claudio (Supervisor)', role: 'SUPERVISOR' as const },
  { username: 'rafael', name: 'Rafael (Assistente)', role: 'AUDITOR' as const },
];

export const AUDIT_QUESTIONS = [
  { id: 'S1', category: 'SEGURANÇA', text: 'Portas das docas fechadas.', photoRequired: true },
  { id: 'S2', category: 'SEGURANÇA', text: 'Dispositivos de trava-rodas utilizados corretamente.', photoRequired: true },
  { id: 'S3', category: 'SEGURANÇA', text: 'Trava-rodas armazenados corretamente.' },
  { id: 'S4', category: 'SEGURANÇA', text: 'Corredores livres.' },
  { id: 'S5', category: 'SEGURANÇA', text: 'Proteções coletivas posicionadas corretamente.' },
  { id: 'S6', category: 'SEGURANÇA', text: 'Sinalização preservada.' },
  { id: 'S7', category: 'SEGURANÇA', text: 'Comunicação de desvios.' },
  { id: 'Q1', category: 'QUALIDADE', text: 'Avarias comunicadas.' },
  { id: 'Q2', category: 'QUALIDADE', text: 'Ausência de avarias em latas.', photoRequired: true },
  { id: 'Q3', category: 'QUALIDADE', text: 'Ausência de avarias em tampas.', photoRequired: true },
  { id: 'Q4', category: 'QUALIDADE', text: 'Ausência de avarias gerais.' },
  { id: 'O1', category: 'ORGANIZAÇÃO', text: 'Organização do armazém.' },
  { id: 'O2', category: 'ORGANIZAÇÃO', text: 'Organização do material de embalagem.' },
  { id: 'O3', category: 'ORGANIZAÇÃO', text: 'Organização da área de retrabalho.' },
  { id: 'O4', category: 'ORGANIZAÇÃO', text: 'Organização da triagem.' },
  { id: 'O5', category: 'ORGANIZAÇÃO', text: 'Alinhamento e organização das ruas de latas e tampas acabadas (A, B, C, D, E, F e G).' },
  { id: 'O6', category: 'ORGANIZAÇÃO', text: 'Ruas identificadas.' },
  { id: 'O7', category: 'ORGANIZAÇÃO', text: 'Ausência de pallets misturados (latas e tampas).' },
  { id: 'O8', category: 'ORGANIZAÇÃO', text: 'Sala dos conferentes limpa e organizada.' },
  { id: 'O9', category: 'ORGANIZAÇÃO', text: 'Organização e alinhamento da rua de tampa básica.' },
  { id: 'L1', category: 'LIMPEZA', text: 'Limpeza do armazém.' },
  { id: 'L2', category: 'LIMPEZA', text: 'Limpeza da área externa das docas.' },
  { id: 'L3', category: 'LIMPEZA', text: 'Limpeza das empilhadeiras.' },
  { id: 'G1', category: 'GESTÃO', text: 'Cobertura adequada do turno.' },
  { id: 'G2', category: 'GESTÃO', text: 'Absenteísmo tratado conforme procedimento.' },
  { id: 'G3', category: 'GESTÃO', text: 'Organização visual da operação.' },
  { id: 'G4', category: 'GESTÃO', text: 'Cumprimento dos padrões operacionais.' },
];

export const DEFAULT_SETTINGS = {
  table: [
    { minScore: 100, percentage: 100, value: 250.00 },
    { minScore: 95, percentage: 95, value: 237.50 },
    { minScore: 90, percentage: 90, value: 225.00 },
    { minScore: 85, percentage: 85, value: 212.50 },
    { minScore: 80, percentage: 80, value: 200.00 },
    { minScore: 75, percentage: 75, value: 187.50 },
    { minScore: 70, percentage: 70, value: 175.00 },
  ],
  maxBonusValue: 250.00,
  scoringMethod: 'WEIGHTED' as const,
};
