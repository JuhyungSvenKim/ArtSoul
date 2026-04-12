-- art_taste_selections 재정의
DROP TABLE IF EXISTS art_taste_selections CASCADE;

CREATE TABLE art_taste_selections (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    selections JSONB NOT NULL DEFAULT '[]',
    top_tags JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE art_taste_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taste_select" ON art_taste_selections FOR SELECT USING (true);
CREATE POLICY "taste_insert" ON art_taste_selections FOR INSERT WITH CHECK (true);
CREATE POLICY "taste_update" ON art_taste_selections FOR UPDATE USING (true);
