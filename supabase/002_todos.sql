CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own todos" ON todos
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_sort ON todos(user_id, sort_order);
