import { supabase, USERS, DEFAULT_SETTINGS } from './supabase';
import { Audit, ActionPlan, RemunerationSettings, AccessLog, UserRole } from '../types';

// AUTH
export async function loginUser(username: string): Promise<{ success: boolean; user?: any; message?: string }> {
  const user = USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return { success: false, message: 'Usuário não cadastrado.' };

  // Registrar log de acesso
  await supabase.from('access_logs').insert({
    username: user.username,
    name: user.name,
    role: user.role,
    timestamp: new Date().toISOString(),
  });

  return { success: true, user };
}

// AUDITS
export async function getAudits(): Promise<Audit[]> {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(row => ({ ...row.data, id: row.id, createdAt: row.created_at }));
}

export async function createAudit(auditData: Omit<Audit, 'id' | 'createdAt'>): Promise<boolean> {
  const { data: auditRow, error } = await supabase
    .from('audits')
    .insert({ data: auditData })
    .select()
    .single();
  
  if (error) { console.error(error); return false; }

  // Gerar planos de ação para NCs
  const ncAnswers = auditData.answers.filter(a => a.status === 'NAO_CONFORME' && a.details);
  for (const ans of ncAnswers) {
    const plan = {
      audit_id: auditRow.id,
      question_id: ans.questionId,
      data: {
        auditId: auditRow.id,
        questionId: ans.questionId,
        conferente: auditData.conferente,
        turno: auditData.turno,
        description: ans.details!.description,
        criticality: ans.details!.criticality,
        responsible: ans.details!.responsible,
        deadline: ans.details!.deadline,
        observations: ans.details!.observations || '',
        photos: ans.details!.cameraPhotos || [],
        status: 'PENDENTE',
        occurrenceLocation: ans.details!.occurrenceLocation || '',
        history: [{ timestamp: new Date().toISOString(), action: 'Plano de ação criado automaticamente.', user: auditData.auditor }],
      }
    };
    await supabase.from('action_plans').insert(plan);
  }
  return true;
}

export async function updateAudit(id: string, auditData: Omit<Audit, 'id' | 'createdAt'>): Promise<boolean> {
  const { error } = await supabase
    .from('audits')
    .update({ data: auditData, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error(error); return false; }

  // Sincronizar planos de ação
  for (const ans of auditData.answers) {
    if (ans.status === 'NAO_CONFORME' && ans.details) {
      const { data: existing } = await supabase
        .from('action_plans')
        .select('id, data')
        .eq('audit_id', id)
        .eq('question_id', ans.questionId)
        .single();

      if (existing) {
        const updatedData = {
          ...existing.data,
          description: ans.details.description,
          criticality: ans.details.criticality,
          responsible: ans.details.responsible,
          deadline: ans.details.deadline,
          history: [...(existing.data.history || []), { timestamp: new Date().toISOString(), action: 'Atualizado via edição de auditoria.', user: auditData.auditor }],
        };
        await supabase.from('action_plans').update({ data: updatedData }).eq('id', existing.id);
      } else {
        await supabase.from('action_plans').insert({
          audit_id: id,
          question_id: ans.questionId,
          data: {
            auditId: id, questionId: ans.questionId,
            conferente: auditData.conferente, turno: auditData.turno,
            description: ans.details.description, criticality: ans.details.criticality,
            responsible: ans.details.responsible, deadline: ans.details.deadline,
            observations: ans.details.observations || '', photos: ans.details.cameraPhotos || [],
            status: 'PENDENTE', occurrenceLocation: ans.details.occurrenceLocation || '',
            history: [{ timestamp: new Date().toISOString(), action: 'Criado via edição.', user: auditData.auditor }],
          }
        });
      }
    } else {
      await supabase.from('action_plans').delete().eq('audit_id', id).eq('question_id', ans.questionId);
    }
  }
  return true;
}

// ACTION PLANS
export async function getActionPlans(): Promise<ActionPlan[]> {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(row => ({ ...row.data, id: row.id }));
}

export async function updateActionPlan(id: string, status: string, observations: string, userName: string): Promise<boolean> {
  const { data: existing } = await supabase.from('action_plans').select('data').eq('id', id).single();
  if (!existing) return false;

  const updatedData = {
    ...existing.data,
    status,
    observations,
    completedAt: status === 'CONCLUIDO' ? new Date().toISOString() : existing.data.completedAt,
    history: [...(existing.data.history || []), {
      timestamp: new Date().toISOString(),
      action: `Status alterado para ${status}.`,
      user: userName,
    }],
  };

  const { error } = await supabase.from('action_plans').update({ data: updatedData }).eq('id', id);
  if (error) { console.error(error); return false; }
  return true;
}

// SETTINGS
export async function getSettings(): Promise<RemunerationSettings> {
  const { data } = await supabase.from('settings').select('data').eq('id', 1).single();
  return data?.data || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: RemunerationSettings): Promise<boolean> {
  const { error } = await supabase.from('settings').upsert({ id: 1, data: settings });
  if (error) { console.error(error); return false; }
  return true;
}

// ACCESS LOGS
export async function getAccessLogs(): Promise<AccessLog[]> {
  const { data, error } = await supabase
    .from('access_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);
  if (error) { console.error(error); return []; }
  return (data || []).map(row => ({
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as UserRole,
    timestamp: row.timestamp,
  }));
}

// RESET
export async function resetDatabase(): Promise<boolean> {
  await supabase.from('audits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('action_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('access_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('settings').upsert({ id: 1, data: DEFAULT_SETTINGS });
  return true;
}
