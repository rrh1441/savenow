-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for item categories
CREATE TYPE item_category AS ENUM (
  'coffee',
  'food', 
  'subscription',
  'household',
  'transportation',
  'entertainment',
  'clothing',
  'other'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Items catalog table
CREATE TABLE public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category item_category NOT NULL DEFAULT 'other',
  default_price_usd NUMERIC(6,2) NOT NULL CHECK (default_price_usd > 0 AND default_price_usd < 1000),
  price_source TEXT,
  refresh_freq_days SMALLINT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User scenarios table
CREATE TABLE public.scenarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  share_hash TEXT UNIQUE, -- For public sharing
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Scenario items junction table
CREATE TABLE public.scenario_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  custom_item_name TEXT, -- For user-added items
  price_usd NUMERIC(6,2) NOT NULL CHECK (price_usd > 0),
  frequency_days INTEGER NOT NULL CHECK (frequency_days > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User custom items table
CREATE TABLE public.user_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  default_price_usd NUMERIC(6,2) NOT NULL CHECK (default_price_usd > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Items catalog is public for reading
CREATE POLICY "Items are publicly readable" ON public.items
  FOR SELECT USING (true);

-- Scenarios: users can manage their own, public read for shared scenarios
CREATE POLICY "Users can view own scenarios" ON public.scenarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared scenarios" ON public.scenarios
  FOR SELECT USING (share_hash IS NOT NULL);

CREATE POLICY "Users can insert own scenarios" ON public.scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scenarios" ON public.scenarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scenarios" ON public.scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- Scenario items: inherit permissions from scenarios
CREATE POLICY "Users can view scenario items for own scenarios" ON public.scenario_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s 
      WHERE s.id = scenario_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view scenario items for shared scenarios" ON public.scenario_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s 
      WHERE s.id = scenario_id AND s.share_hash IS NOT NULL
    )
  );

CREATE POLICY "Users can insert scenario items for own scenarios" ON public.scenario_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenarios s 
      WHERE s.id = scenario_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scenario items for own scenarios" ON public.scenario_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s 
      WHERE s.id = scenario_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scenario items for own scenarios" ON public.scenario_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s 
      WHERE s.id = scenario_id AND s.user_id = auth.uid()
    )
  );

-- User items: users can only manage their own
CREATE POLICY "Users can view own custom items" ON public.user_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom items" ON public.user_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom items" ON public.user_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom items" ON public.user_items
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_scenarios_user_id ON public.scenarios(user_id);
CREATE INDEX idx_scenarios_share_hash ON public.scenarios(share_hash);
CREATE INDEX idx_scenario_items_scenario_id ON public.scenario_items(scenario_id);
CREATE INDEX idx_items_name_trgm ON public.items USING gin(name gin_trgm_ops);
CREATE INDEX idx_items_category ON public.items(category);

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;