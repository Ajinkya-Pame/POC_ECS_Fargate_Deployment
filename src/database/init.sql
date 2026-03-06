-- ============================================================
-- Cricket Scoring App — Full Database Schema
-- Runs automatically on PostgreSQL container first boot
-- ============================================================

-- 1. MATCH STATE — Single-row table holding the live match state
CREATE TABLE IF NOT EXISTS match_state (
    id TEXT PRIMARY KEY DEFAULT 'current',

    -- Teams & Venue
    team1 TEXT DEFAULT '',
    team2 TEXT DEFAULT '',
    venue TEXT DEFAULT '',
    toss_winner TEXT DEFAULT '',
    toss_decision TEXT DEFAULT '',
    match_format TEXT DEFAULT 'T20',
    match_status TEXT DEFAULT 'setup',

    -- Score
    score INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    overs NUMERIC(5,1) DEFAULT 0.0,
    recent_ball TEXT DEFAULT '-',
    inning INTEGER DEFAULT 1,
    target_score INTEGER DEFAULT 0,
    equation TEXT DEFAULT '',

    -- Current Striker
    striker_name TEXT DEFAULT 'Striker',
    striker_runs INTEGER DEFAULT 0,
    striker_balls INTEGER DEFAULT 0,

    -- Current Non-Striker
    non_striker_name TEXT DEFAULT 'Non-Striker',
    non_striker_runs INTEGER DEFAULT 0,
    non_striker_balls INTEGER DEFAULT 0,

    -- Current Bowler
    bowler_name TEXT DEFAULT '',
    bowler_runs_conceded INTEGER DEFAULT 0,
    bowler_wickets INTEGER DEFAULT 0,
    bowler_balls_bowled INTEGER DEFAULT 0,

    -- Flags
    is_free_hit BOOLEAN DEFAULT false,

    -- Extras (current innings)
    extras_wide INTEGER DEFAULT 0,
    extras_nb INTEGER DEFAULT 0,
    extras_bye INTEGER DEFAULT 0,
    extras_lb INTEGER DEFAULT 0,

    -- Extras (1st innings snapshot, used when inning=2)
    extras_wide_inn1 INTEGER DEFAULT 0,
    extras_nb_inn1 INTEGER DEFAULT 0,
    extras_bye_inn1 INTEGER DEFAULT 0,
    extras_lb_inn1 INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the single match_state row
INSERT INTO match_state (id) VALUES ('current') ON CONFLICT (id) DO NOTHING;


-- 2. COMMENTARY — Live feed / timeline entries
CREATE TABLE IF NOT EXISTS commentary (
    id SERIAL PRIMARY KEY,
    type TEXT DEFAULT 'text',           -- 'text', 'tweet', 'event'
    text TEXT DEFAULT '',
    overs TEXT DEFAULT '',
    event_badge TEXT DEFAULT '',
    bowler_batter_title TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commentary_created_at ON commentary (created_at DESC);


-- 3. ROSTER — Player roster with per-innings stats
CREATE TABLE IF NOT EXISTS roster (
    id SERIAL PRIMARY KEY,
    team TEXT NOT NULL,
    player_name TEXT NOT NULL,
    inning INTEGER DEFAULT 1,
    status TEXT DEFAULT 'dugout',       -- 'dugout', 'batting', 'out'
    batting_position INTEGER DEFAULT NULL,

    -- Batting stats
    runs_scored INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    fours_count INTEGER DEFAULT 0,
    sixes_count INTEGER DEFAULT 0,
    dismissal_text TEXT DEFAULT '',

    -- Bowling stats
    runs_conceded INTEGER DEFAULT 0,
    balls_bowled INTEGER DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roster_team_inning ON roster (team, inning);
