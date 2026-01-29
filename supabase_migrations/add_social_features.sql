-- ============================================
-- Migration: Add Social Features
-- Tables: follows, interactions, comments, stories
-- RLS enabled; unique constraint: one interaction per user per entity
-- ============================================

-- ============================================
-- 1. follows
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_place_id ON follows(place_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows" ON follows
  FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Place owners can view place followers" ON follows
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM places WHERE places.id = follows.place_id AND places.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own follow" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follow" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- 2. interactions (Likes, Dislikes, Favorites)
-- One row per user per entity: cannot like the same post twice
-- ============================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('post', 'product', 'place')),
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'dislike', 'favorite')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entity_id, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_entity ON interactions(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_interactions_interaction_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at DESC);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view interactions" ON interactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own interaction" ON interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interaction" ON interactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interaction" ON interactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. comments
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('post', 'product', 'place')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comment" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment" ON comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. stories
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_place_id ON stories(place_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stories" ON stories
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Place owners can view own place stories" ON stories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM places WHERE places.id = stories.place_id AND places.user_id = auth.uid())
  );

CREATE POLICY "Place owners can insert stories" ON stories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM places WHERE places.id = stories.place_id AND places.user_id = auth.uid())
  );

CREATE POLICY "Place owners can update stories" ON stories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM places WHERE places.id = stories.place_id AND places.user_id = auth.uid())
  );

CREATE POLICY "Place owners can delete stories" ON stories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM places WHERE places.id = stories.place_id AND places.user_id = auth.uid())
  );
