-- Execute este SQL no Supabase SQL Editor

-- Tabela de auditorias
CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Tabela de planos de ação
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações (remuneração)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL
);

-- Tabela de logs de acesso
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO settings (id, data) VALUES (1, '{
  "table": [
    {"minScore": 100, "percentage": 100, "value": 250},
    {"minScore": 95, "percentage": 95, "value": 237.5},
    {"minScore": 90, "percentage": 90, "value": 225},
    {"minScore": 85, "percentage": 85, "value": 212.5},
    {"minScore": 80, "percentage": 80, "value": 200},
    {"minScore": 75, "percentage": 75, "value": 187.5},
    {"minScore": 70, "percentage": 70, "value": 175}
  ],
  "maxBonusValue": 250,
  "scoringMethod": "WEIGHTED"
}') ON CONFLICT (id) DO NOTHING;

-- Habilitar acesso público (RLS permissivo para uso interno)
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_audits" ON audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_action_plans" ON action_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_logs" ON access_logs FOR ALL USING (true) WITH CHECK (true);
