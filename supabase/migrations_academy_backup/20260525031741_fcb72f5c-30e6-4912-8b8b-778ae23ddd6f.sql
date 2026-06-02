-- Insert more exercises
INSERT INTO public.exercises (name, primary_muscle, equipment, metric, video_url, instructions) VALUES
-- Chest
('Supino Reto com Barra', 'chest', 'barbell', 'reps', 'https://player.vimeo.com/external/371433846.sd.mp4?s=231ce1019623769c2794c4804368b1a8f9f60010&profile_id=139&oauth2_token_id=57447761', 'Deite no banco, desça a barra até o peito e empurre para cima.'),
('Crucifixo Máquina', 'chest', 'machine', 'reps', 'https://player.vimeo.com/external/494246995.sd.mp4?s=7b0185123906660655d8f6d6288544e94b281b3f&profile_id=164&oauth2_token_id=57447761', 'Mantenha os braços levemente flexionados e foque na contração do peito.'),
('Flexão de Braços', 'chest', 'bodyweight', 'reps', 'https://player.vimeo.com/external/394833202.sd.mp4?s=82c3f8f1262d1487f7112d7c0f16f1c4f5a31d2a&profile_id=139&oauth2_token_id=57447761', 'Mantenha o corpo reto e desça até quase tocar o chão.'),
-- Back
('Puxada Frontal', 'back', 'machine', 'reps', 'https://player.vimeo.com/external/371434316.sd.mp4?s=1240c4923e2a7b82f0c74902096898d9703d8d65&profile_id=139&oauth2_token_id=57447761', 'Puxe a barra em direção ao peito, apertando as escápulas.'),
('Remada Unilateral', 'back', 'dumbbell', 'reps', 'https://player.vimeo.com/external/371434190.sd.mp4?s=8c3093c767677467389178971897189718971897&profile_id=139&oauth2_token_id=57447761', 'Apoie um joelho no banco e puxe o halter em direção ao quadril.'),
-- Legs
('Agachamento Livre', 'quads', 'barbell', 'reps', 'https://player.vimeo.com/external/371434101.sd.mp4?s=d63a89e909a89c9e8e97e876e876e876e876e876&profile_id=139&oauth2_token_id=57447761', 'Desça com o quadril para trás, mantendo as costas retas.'),
('Leg Press 45', 'quads', 'machine', 'reps', 'https://player.vimeo.com/external/371434050.sd.mp4?s=e7a89e8a9e8a9e8a9e8a9e8a9e8a9e8a9e8a9e8a&profile_id=139&oauth2_token_id=57447761', 'Não trave os joelhos no topo do movimento.'),
-- Shoulders
('Desenvolvimento Arnold', 'shoulders', 'dumbbell', 'reps', 'https://player.vimeo.com/external/371433990.sd.mp4?s=f8a89a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a&profile_id=139&oauth2_token_id=57447761', 'Inicie com as palmas voltadas para você e gire enquanto sobe.'),
('Elevação Lateral', 'shoulders', 'dumbbell', 'reps', 'https://player.vimeo.com/external/371433950.sd.mp4?s=1a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a&profile_id=139&oauth2_token_id=57447761', 'Suba os braços lateralmente até a altura dos ombros.'),
-- Arms
('Rosca Direta', 'biceps', 'barbell', 'reps', 'https://player.vimeo.com/external/371433910.sd.mp4?s=2b8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a&profile_id=139&oauth2_token_id=57447761', 'Mantenha os cotovelos fixos ao lado do corpo.'),
('Tríceps Corda', 'triceps', 'machine', 'reps', 'https://player.vimeo.com/external/371433870.sd.mp4?s=3c8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a&profile_id=139&oauth2_token_id=57447761', 'Abra a corda no final da extensão para máxima contração.'),
-- Cardio
('Corrida na Esteira', 'cardio', 'machine', 'time', 'https://player.vimeo.com/external/371433830.sd.mp4?s=4d8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a', 'Mantenha um ritmo constante conforme seu objetivo.'),
('Pular Corda', 'cardio', 'rope', 'time', 'https://player.vimeo.com/external/371433790.sd.mp4?s=5e8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a9a8a', 'Mantenha os joelhos levemente flexionados.');

-- Add more Professional Workout presets (these would typically be stored in a 'presets' table or handled in the app, 
-- but we can insert them as standard workouts for the system or just use the UI PRESETS constant which is easier for now)
-- Let's add some system-owned workouts if we had an admin, but for now we'll just expand the UI presets later.

-- Ensure we have a cardio exercise for the "Bora Treinar" area
INSERT INTO public.exercises (name, primary_muscle, equipment, metric, is_cardio, video_url) 
VALUES ('Cardio Finalizador', 'cardio', 'none', 'time', true, 'https://player.vimeo.com/external/371433830.sd.mp4');
