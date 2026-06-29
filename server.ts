/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  Audit, 
  ActionPlan, 
  RemunerationSettings, 
  AccessLog, 
  User, 
  AuditItemStatus, 
  CriticalityLevel,
  UserRole
} from './src/types';

const app = express();
const PORT = 3000;

// Set up middleware
app.use(express.json({ limit: '50mb' }));

// Database file path
const DB_PATH = path.join(process.cwd(), 'database.json');

// Default Audit Questions Setup
const AUDIT_QUESTIONS = [
  // SEGURANÇA (Weight 40%)
  { id: 'S1', category: 'SEGURANÇA', text: 'Portas das docas fechadas.', photoRequired: true },
  { id: 'S2', category: 'SEGURANÇA', text: 'Dispositivos de trava-rodas utilizados corretamente.', photoRequired: true },
  { id: 'S3', category: 'SEGURANÇA', text: 'Trava-rodas armazenados corretamente.' },
  { id: 'S4', category: 'SEGURANÇA', text: 'Corredores livres.' },
  { id: 'S5', category: 'SEGURANÇA', text: 'Proteções coletivas posicionadas corretamente.' },
  { id: 'S6', category: 'SEGURANÇA', text: 'Sinalização preservada.' },
  { id: 'S7', category: 'SEGURANÇA', text: 'Comunicação de desvios.' },

  // QUALIDADE (Weight 25%)
  { id: 'Q1', category: 'QUALIDADE', text: 'Avarias comunicadas.' },
  { id: 'Q2', category: 'QUALIDADE', text: 'Ausência de avarias em latas.', photoRequired: true },
  { id: 'Q3', category: 'QUALIDADE', text: 'Ausência de avarias em tampas.', photoRequired: true },
  { id: 'Q4', category: 'QUALIDADE', text: 'Ausência de avarias gerais.' },

  // ORGANIZAÇÃO / 5S (Weight 15%)
  { id: 'O1', category: 'ORGANIZAÇÃO', text: 'Organização do armazém.' },
  { id: 'O2', category: 'ORGANIZAÇÃO', text: 'Organização do material de embalagem.' },
  { id: 'O3', category: 'ORGANIZAÇÃO', text: 'Organização da área de retrabalho.' },
  { id: 'O4', category: 'ORGANIZAÇÃO', text: 'Organização da triagem.' },
  { id: 'O5', category: 'ORGANIZAÇÃO', text: 'Alinhamento e organização das ruas de latas e tampas acabadas (A, B, C, D, E, F e G).' },
  { id: 'O6', category: 'ORGANIZAÇÃO', text: 'Ruas identificadas.' },
  { id: 'O7', category: 'ORGANIZAÇÃO', text: 'Ausência de pallets misturados (latas e tampas).' },
  { id: 'O8', category: 'ORGANIZAÇÃO', text: 'Sala dos conferentes limpa e organizada.' },
  { id: 'O9', category: 'ORGANIZAÇÃO', text: 'Organização e alinhamento da rua de tampa básica.' },

  // LIMPEZA (Weight 10%)
  { id: 'L1', category: 'LIMPEZA', text: 'Limpeza do armazém.' },
  { id: 'L2', category: 'LIMPEZA', text: 'Limpeza da área externa das docas.' },
  { id: 'L3', category: 'LIMPEZA', text: 'Limpeza das empilhadeiras.' },

  // GESTÃO OPERACIONAL (Weight 10%)
  { id: 'G1', category: 'GESTÃO', text: 'Cobertura adequada do turno.' },
  { id: 'G2', category: 'GESTÃO', text: 'Absenteísmo tratado conforme procedimento.' },
  { id: 'G3', category: 'GESTÃO', text: 'Organização visual da operação.' },
  { id: 'G4', category: 'GESTÃO', text: 'Cumprimento dos padrões operacionais.' },
];

// Initial default settings
const DEFAULT_SETTINGS: RemunerationSettings = {
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
  scoringMethod: 'WEIGHTED',
};

// Initial default users
const DEFAULT_USERS: User[] = [
  { username: 'claudio', name: 'Claudio (Supervisor)', role: 'ADMIN' },
  { username: 'rickson', name: 'Rickson (Analista)', role: 'SUPERVISOR' },
  { username: 'rafael', name: 'Rafael (Assistente)', role: 'AUDITOR' },
];

interface DatabaseSchema {
  users: User[];
  settings: RemunerationSettings;
  audits: Audit[];
  actionPlans: ActionPlan[];
  accessLogs: AccessLog[];
}

// Check if database exists, if not seed it
function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_PATH)) {
    const seedData = seedDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(seedData, null, 2));
    return seedData;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);
    // Force our correct corporate users to be active
    db.users = DEFAULT_USERS;
    return db;
  } catch (error) {
    console.error('Error reading database file, using fallback seeding', error);
    return seedDatabase();
  }
}

function saveDatabase(db: DatabaseSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Generate high quality mock data to feed the analytics dashboard perfectly
function seedDatabase(): DatabaseSchema {
  return {
    users: DEFAULT_USERS,
    settings: DEFAULT_SETTINGS,
    audits: [],
    actionPlans: [],
    accessLogs: [],
  };
}

// REST APIs
// 1. Auth & Logs
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDatabase();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (user) {
    // Record login in history
    const newLog: AccessLog = {
      id: `LOG-${Date.now()}`,
      username: user.username,
      name: user.name,
      role: user.role,
      timestamp: new Date().toISOString(),
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Desconhecido'
    };
    db.accessLogs.unshift(newLog);
    saveDatabase(db);

    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Usuário não cadastrado.' });
  }
});

app.get('/api/logs', (req, res) => {
  const db = getDatabase();
  res.json(db.accessLogs);
});

// 2. Settings (Remuneration Table)
app.get('/api/settings', (req, res) => {
  const db = getDatabase();
  res.json(db.settings);
});

app.post('/api/settings', (req, res) => {
  const db = getDatabase();
  db.settings = req.body;
  saveDatabase(db);
  res.json({ success: true, settings: db.settings });
});

// 3. Audits
app.get('/api/audits', (req, res) => {
  const db = getDatabase();
  res.json(db.audits);
});

app.post('/api/audits', (req, res) => {
  const db = getDatabase();
  const newAudit: Audit = {
    ...req.body,
    id: `AUD-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  db.audits.unshift(newAudit);

  // Automatically generate Action Plans for NCs
  newAudit.answers.forEach(ans => {
    if (ans.status === 'NAO_CONFORME' && ans.details) {
      const question = AUDIT_QUESTIONS.find(q => q.id === ans.questionId);
      const actionPlanId = `AP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const plan: ActionPlan = {
        id: actionPlanId,
        auditId: newAudit.id,
        questionId: ans.questionId,
        questionText: question ? question.text : '',
        category: question ? question.category : 'SEGURANÇA',
        conferente: newAudit.conferente,
        turno: newAudit.turno,
        description: ans.details.description,
        criticality: ans.details.criticality,
        responsible: ans.details.responsible,
        deadline: ans.details.deadline,
        observations: ans.details.observations,
        photos: ans.details.cameraPhotos || [],
        status: 'PENDENTE',
        occurrenceLocation: ans.details.occurrenceLocation,
        history: [
          {
            timestamp: new Date().toISOString(),
            action: 'Plano de ação criado automaticamente a partir da não conformidade detectada na auditoria.',
            user: newAudit.auditor
          }
        ]
      };
      db.actionPlans.unshift(plan);
    }
  });

  saveDatabase(db);
  res.json({ success: true, audit: newAudit });
});

app.put('/api/audits/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const auditIndex = db.audits.findIndex(a => a.id === id);

  if (auditIndex !== -1) {
    const originalAudit = db.audits[auditIndex];
    const updatedAudit = {
      ...req.body,
      id,
      createdAt: originalAudit.createdAt,
      updatedAt: new Date().toISOString()
    };
    db.audits[auditIndex] = updatedAudit;

    // Check if new action plans need to be created or updated
    updatedAudit.answers.forEach((ans: any) => {
      if (ans.status === 'NAO_CONFORME' && ans.details) {
        // Find if action plan already exists for this audit & question
        let planIndex = db.actionPlans.findIndex(p => p.auditId === id && p.questionId === ans.questionId);
        const question = AUDIT_QUESTIONS.find(q => q.id === ans.questionId);
        
        if (planIndex !== -1) {
          // Update existing plan
          const plan = db.actionPlans[planIndex];
          plan.conferente = updatedAudit.conferente;
          plan.turno = updatedAudit.turno;
          plan.description = ans.details.description;
          plan.criticality = ans.details.criticality;
          plan.responsible = ans.details.responsible;
          plan.deadline = ans.details.deadline;
          plan.observations = ans.details.observations || plan.observations || '';
          plan.photos = ans.details.cameraPhotos || plan.photos || [];
          plan.occurrenceLocation = ans.details.occurrenceLocation || plan.occurrenceLocation || 'Recebimento';
          plan.history.push({
            timestamp: new Date().toISOString(),
            action: 'Plano de ação atualizado após edição da auditoria.',
            user: updatedAudit.auditor || 'Sistema'
          });
        } else {
          // Create new plan
          const actionPlanId = `AP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newPlan: ActionPlan = {
            id: actionPlanId,
            auditId: id,
            questionId: ans.questionId,
            questionText: question ? question.text : '',
            category: question ? question.category : 'SEGURANÇA',
            conferente: updatedAudit.conferente,
            turno: updatedAudit.turno,
            description: ans.details.description,
            criticality: ans.details.criticality,
            responsible: ans.details.responsible,
            deadline: ans.details.deadline,
            observations: ans.details.observations || '',
            photos: ans.details.cameraPhotos || [],
            status: 'PENDENTE',
            occurrenceLocation: ans.details.occurrenceLocation || 'Recebimento',
            history: [
              {
                timestamp: new Date().toISOString(),
                action: 'Plano de ação criado a partir da edição da auditoria.',
                user: updatedAudit.auditor || 'Sistema'
              }
            ]
          };
          db.actionPlans.unshift(newPlan);
        }
      } else {
        // If it is CONFORME or NAO_APLICAVEL now, remove the corresponding pending action plan
        db.actionPlans = db.actionPlans.filter(p => !(p.auditId === id && p.questionId === ans.questionId));
      }
    });

    saveDatabase(db);
    res.json({ success: true, audit: updatedAudit });
  } else {
    res.status(404).json({ success: false, message: 'Auditoria não encontrada.' });
  }
});

// 3.5. Reset Database
app.post('/api/reset', (req, res) => {
  const db = {
    users: DEFAULT_USERS,
    settings: DEFAULT_SETTINGS,
    audits: [],
    actionPlans: [],
    accessLogs: [],
  };
  saveDatabase(db);
  res.json({ success: true });
});

// 4. Action Plans
app.get('/api/action-plans', (req, res) => {
  const db = getDatabase();
  res.json(db.actionPlans);
});

app.patch('/api/action-plans/:id', (req, res) => {
  const { id } = req.params;
  const { status, observations, user } = req.body;
  const db = getDatabase();
  const planIndex = db.actionPlans.findIndex(p => p.id === id);

  if (planIndex !== -1) {
    const plan = db.actionPlans[planIndex];
    const prevStatus = plan.status;
    plan.status = status;
    plan.observations = observations || plan.observations;
    
    let actionDescription = `Plano de ação alterado de ${prevStatus} para ${status}.`;
    
    if (status === 'CONCLUIDO') {
      plan.completedAt = new Date().toISOString();
      const createdTime = new Date(plan.history[0].timestamp).getTime();
      const completedTime = new Date(plan.completedAt).getTime();
      plan.resolutionTime = parseFloat(((completedTime - createdTime) / (1000 * 60 * 60)).toFixed(1)); // in hours
      actionDescription = 'Plano de ação concluído. Efidências de correção verificadas.';
    }

    plan.history.push({
      timestamp: new Date().toISOString(),
      action: actionDescription,
      user: user || 'Sistema'
    });

    db.actionPlans[planIndex] = plan;
    saveDatabase(db);
    res.json({ success: true, plan });
  } else {
    res.status(404).json({ success: false, message: 'Plano de ação não encontrado.' });
  }
});

// 5. Audit Questions Metadata
app.get('/api/questions', (req, res) => {
  res.json(AUDIT_QUESTIONS);
});

// Serve Vite dev server or static distribution files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
