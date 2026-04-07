-- 유저 코인 테이블
CREATE TABLE IF NOT EXISTS user_coins (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    coins INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코인 사용 내역 테이블
CREATE TABLE IF NOT EXISTS coin_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INT NOT NULL,               -- 양수=충전, 음수=차감
    balance_after INT NOT NULL,         -- 거래 후 잔액
    transaction_type TEXT NOT NULL,     -- 'fortune_today', 'fortune_weekly', 'fortune_monthly', 'fortune_yearly', 'charge', 'signup_bonus'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON user_coins (user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions (created_at DESC);

-- RLS
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own coins"
    ON user_coins FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own coins"
    ON user_coins FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own coins"
    ON user_coins FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can read own transactions"
    ON coin_transactions FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own transactions"
    ON coin_transactions FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);
