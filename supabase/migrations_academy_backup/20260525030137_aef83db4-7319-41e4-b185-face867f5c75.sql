-- Add new columns to exercises
ALTER TABLE public.exercises 
ADD COLUMN video_url TEXT,
ADD COLUMN audio_url TEXT,
ADD COLUMN muscle_highlight_primary_url TEXT,
ADD COLUMN muscle_highlight_secondary_url TEXT;

-- Create a storage bucket for exercise assets if not exists
-- (Assuming storage is enabled)

-- Insert professional exercises (placeholders for URLs)
INSERT INTO public.exercises (name, primary_muscle, secondary_muscles, equipment, metric, instructions, is_cardio) VALUES
('Supino Reto', 'chest', ARRAY['triceps', 'shoulders']::public.muscle_group[], 'Barra', 'reps', 'Deite-se no banco, segure a barra com pegada média e desça até o peito.', false),
('Agachamento Livre', 'quads', ARRAY['glutes', 'hamstrings']::public.muscle_group[], 'Barra', 'reps', 'Mantenha as costas retas, desça o quadril até as coxas ficarem paralelas ao chão.', false),
('Remada Curvada', 'back', ARRAY['biceps', 'shoulders']::public.muscle_group[], 'Barra', 'reps', 'Incline o tronco, mantenha a coluna neutra e puxe a barra em direção ao umbigo.', false),
('Desenvolvimento Militar', 'shoulders', ARRAY['triceps']::public.muscle_group[], 'Halteres', 'reps', 'Empurre os pesos acima da cabeça até estender os braços.', false),
('Rosca Direta', 'biceps', ARRAY['forearms']::public.muscle_group[], 'Barra W', 'reps', 'Mantenha os cotovelos fixos e flexione os braços puxando a barra.', false),
('Tríceps Pulley', 'triceps', NULL, 'Polia', 'reps', 'Estenda os braços para baixo mantendo os cotovelos junto ao corpo.', false),
('Leg Press 45', 'quads', ARRAY['glutes', 'calves']::public.muscle_group[], 'Máquina', 'reps', 'Empurre a plataforma com os pés afastados na largura dos ombros.', false),
('Cadeira Extensora', 'quads', NULL, 'Máquina', 'reps', 'Estenda as pernas totalmente e retorne devagar.', false),
('Mesa Flexora', 'hamstrings', ARRAY['glutes']::public.muscle_group[], 'Máquina', 'reps', 'Flexione as pernas trazendo o rolo em direção aos glúteos.', false),
('Elevação Lateral', 'shoulders', NULL, 'Halteres', 'reps', 'Eleve os halteres lateralmente até a altura dos ombros.', false),
('Puxada Frontal', 'back', ARRAY['biceps']::public.muscle_group[], 'Polia', 'reps', 'Puxe a barra em direção à parte superior do peito.', false),
('Corrida Moderada', 'cardio', ARRAY['full_body']::public.muscle_group[], 'Esteira', 'time', 'Mantenha um ritmo constante que permita falar frases curtas.', true);
