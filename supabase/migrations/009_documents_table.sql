-- ============================================================
-- MIGRATION 009: Tabela de Documentos (Biblioteca de Materiais)
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    content TEXT, -- Texto extraído para a IA ler
    file_url TEXT,
    is_indexed BOOLEAN DEFAULT false,
    subject TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their organization documents"
ON documents FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert documents for their organization"
ON documents FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete their organization documents"
ON documents FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
