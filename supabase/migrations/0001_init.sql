-- subgrad MVP schema — per-user persistence, progress, streaks, problem library.
-- Paste into the Supabase SQL editor (Dashboard → SQL) or run via `supabase db push`.
-- Every user-owned table is protected by Row Level Security keyed on auth.uid().

-- ── sessions ──────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id text primary key,                       -- backend session_id (uuid hex)
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  goal text,
  hint_level int default 1,
  total_correct int default 0,
  total_errors int default 0,
  error_categories jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists sessions_user_idx on public.sessions(user_id, updated_at desc);

-- ── messages ──────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','tutor','system','tool')),
  content text not null,
  tool_used text,
  created_at timestamptz default now()
);
create index if not exists messages_session_idx on public.messages(session_id, created_at);

-- ── progress (mastery per topic) ──────────────────────────────────────────
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  attempts int default 0,
  correct int default 0,
  mastery numeric default 0,                 -- 0..1
  last_seen timestamptz default now(),
  primary key (user_id, topic)
);

-- ── streaks / xp ──────────────────────────────────────────────────────────
create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  xp int default 0,
  freezes_left int default 2,
  updated_at timestamptz default now()
);

-- ── problems (curated library; readable by any signed-in user) ─────────────
create table if not exists public.problems (
  id text primary key,
  topic text not null,
  difficulty text not null,                  -- intro | core | challenge
  title text not null,
  statement text not null,
  goal_text text not null,                   -- seeds the chat session goal
  sort int default 0
);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.progress enable row level security;
alter table public.streaks  enable row level security;
alter table public.problems enable row level security;

create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own streaks" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- problem library: read-only to authenticated users, no client writes
create policy "read problems" on public.problems
  for select using (auth.role() = 'authenticated');

-- ── Seed: starter problem library (Calculus + ML) ─────────────────────────
insert into public.problems (id, topic, difficulty, title, statement, goal_text, sort) values
  ('calc-product-1','Calculus · Product Rule','intro','Derivative of x·sin(x)','Differentiate f(x) = x·sin(x).','Find the derivative of x*sin(x) using the product rule',10),
  ('calc-chain-1','Calculus · Chain Rule','intro','Derivative of sin(x²)','Differentiate f(x) = sin(x^2).','Find the derivative of sin(x**2) using the chain rule',20),
  ('calc-quotient-1','Calculus · Quotient Rule','core','Derivative of x/(x²+1)','Differentiate f(x) = x / (x^2 + 1).','Find the derivative of x/(x**2+1) using the quotient rule',30),
  ('calc-limit-1','Calculus · Limits','intro','The classic sin limit','Evaluate lim(x→0) sin(x)/x.','Evaluate the limit of sin(x)/x as x approaches 0',40),
  ('calc-defint-1','Calculus · Integration','intro','Definite integral of 2x+3','Compute the integral of (2x + 3) from 0 to 1.','Compute the definite integral of 2*x+3 from 0 to 1',50),
  ('calc-parts-1','Calculus · Integration by Parts','challenge','Integral of x·eˣ','Find ∫ x·e^x dx.','Find the integral of x*exp(x) using integration by parts',60),
  ('calc-second-1','Calculus · Higher Derivatives','core','Second derivative of x³−3x','Find f''''(x) for f(x) = x^3 − 3x.','Find the second derivative of x**3 - 3*x',70),
  ('ml-gd-1','ML · Gradient Descent','intro','Rolling downhill','On a convex bowl loss surface, explain how gradient descent reaches the minimum.','Build intuition for gradient descent on a convex loss surface',80),
  ('ml-mse-1','ML · Loss Gradients','core','Gradient of MSE','For MSE loss L=(wx−y)², find dL/dw.','Derive the gradient of MSE loss with respect to the weight w',90),
  ('ml-backprop-1','ML · Backpropagation','core','Chain rule backward','In a linear model pred=wx+b, trace dL/dw via the chain rule.','Trace the backpropagation chain rule for dL/dw in a linear model',100),
  ('ml-lr-1','ML · Learning Rate','intro','When the step is too big','Explain why too large a learning rate makes training diverge.','Understand why a too-large learning rate causes divergence',110),
  ('calc-partial-1','Calculus · Partial Derivatives','core','Partials of x²+y²','Find ∂f/∂x and ∂f/∂y for f(x,y)=x^2+y^2.','Find the partial derivatives of x**2 + y**2',120),
  ('ml-sigmoid-1','ML · Activations','challenge','Derivative of the sigmoid','Show that σ''(x) = σ(x)(1−σ(x)).','Derive the derivative of the sigmoid function',130),
  ('ml-xent-1','ML · Cross-Entropy','challenge','Cross-entropy gradient','Build intuition for the gradient of cross-entropy with softmax.','Understand the gradient of cross-entropy loss with softmax',140),
  ('calc-tangent-1','Calculus · Derivatives','intro','Slope as a limit','Explain the derivative as the limit of a secant slope.','Understand the derivative as the limit of the secant line slope',150)
on conflict (id) do nothing;
