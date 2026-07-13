
-- Knowledge Graph nodes
CREATE TABLE public.kg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  external_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_kg_nodes_unique ON public.kg_nodes(user_id, node_type, label);
CREATE INDEX idx_kg_nodes_user ON public.kg_nodes(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kg_nodes TO authenticated;
GRANT ALL ON public.kg_nodes TO service_role;

ALTER TABLE public.kg_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kg nodes"
  ON public.kg_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own kg nodes"
  ON public.kg_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own kg nodes"
  ON public.kg_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own kg nodes"
  ON public.kg_nodes FOR DELETE USING (auth.uid() = user_id);

-- Knowledge Graph edges
CREATE TABLE public.kg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.kg_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_kg_edges_unique
  ON public.kg_edges(user_id, from_node_id, to_node_id, relation);
CREATE INDEX idx_kg_edges_user ON public.kg_edges(user_id);
CREATE INDEX idx_kg_edges_from ON public.kg_edges(from_node_id);
CREATE INDEX idx_kg_edges_to ON public.kg_edges(to_node_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kg_edges TO authenticated;
GRANT ALL ON public.kg_edges TO service_role;

ALTER TABLE public.kg_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kg edges"
  ON public.kg_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own kg edges"
  ON public.kg_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own kg edges"
  ON public.kg_edges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own kg edges"
  ON public.kg_edges FOR DELETE USING (auth.uid() = user_id);
