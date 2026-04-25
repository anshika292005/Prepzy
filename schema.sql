-- ============================================
-- ExamCopilot — Supabase PostgreSQL Schema
-- ============================================

-- 1. user_profiles
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name        TEXT,
  exam_type   TEXT CHECK (exam_type IN ('JEE', 'UPSC', 'BOTH')),
  target_year INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. skill_scores
CREATE TABLE skill_scores (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES user_profiles (id) ON DELETE CASCADE,
  topic           TEXT NOT NULL,
  subtopic        TEXT,
  skill_score     INT DEFAULT 1200,
  total_questions INT DEFAULT 0,
  correct_count   INT DEFAULT 0,
  last_practiced  TIMESTAMPTZ,
  UNIQUE (user_id, topic, subtopic)
);

-- 3. sessions
CREATE TABLE sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES user_profiles (id) ON DELETE CASCADE,
  topic            TEXT,
  exam_type        TEXT,
  total_questions  INT,
  correct_count    INT,
  duration_seconds INT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 4. question_responses
CREATE TABLE question_responses (
  id              SERIAL PRIMARY KEY,
  session_id      UUID REFERENCES sessions (id) ON DELETE CASCADE,
  question_text   TEXT,
  options         JSONB,
  correct_option  TEXT,
  student_answer  TEXT,
  is_correct      BOOLEAN,
  difficulty      TEXT,
  ai_explanation  TEXT,
  topic           TEXT,
  subtopic        TEXT
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- ---- user_profiles ----
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- skill_scores ----
CREATE POLICY "Users can view own skill scores"
  ON skill_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill scores"
  ON skill_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill scores"
  ON skill_scores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- sessions ----
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- question_responses ----
CREATE POLICY "Users can view own question responses"
  ON question_responses FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own question responses"
  ON question_responses FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own question responses"
  ON question_responses FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );
