-- PostIQ Database Schema (PostgreSQL)
-- Compatible with Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE plan_type AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE platform AS ENUM ('INSTAGRAM', 'LINKEDIN', 'X', 'FACEBOOK', 'TIKTOK');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan_type plan_type DEFAULT 'FREE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    platform platform NOT NULL,
    topic VARCHAR(500),
    tone VARCHAR(50),
    audience VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_platform ON posts(platform);

-- Analysis Results
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    engagement_score FLOAT NOT NULL,
    hook_score FLOAT NOT NULL,
    cta_score FLOAT NOT NULL,
    readability_score FLOAT NOT NULL,
    hashtag_score FLOAT NOT NULL,
    emotional_score FLOAT DEFAULT 0,
    length_score FLOAT DEFAULT 0,
    question_score FLOAT DEFAULT 0,
    risk_flags JSONB DEFAULT '[]',
    breakdown_json JSONB NOT NULL,
    suggestions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_post_id ON analysis_results(post_id);

-- Brand Profiles (Phase 2)
CREATE TABLE brand_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tone_preferences JSONB DEFAULT '{}',
    audience_type VARCHAR(200),
    writing_style VARCHAR(200),
    brand_voice TEXT,
    keywords JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
