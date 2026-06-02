-- Assigned Workouts additional policies
CREATE POLICY "Assigned workouts insert" ON public.assigned_workouts
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));

CREATE POLICY "Assigned workouts update" ON public.assigned_workouts
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));

CREATE POLICY "Assigned workouts delete" ON public.assigned_workouts
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));

-- Assigned Diets policies
CREATE POLICY "Assigned diets view" ON public.assigned_diets
FOR SELECT USING (student_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));

CREATE POLICY "Assigned diets insert" ON public.assigned_diets
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));

CREATE POLICY "Assigned diets update" ON public.assigned_diets
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));

CREATE POLICY "Assigned diets delete" ON public.assigned_diets
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.student_profiles WHERE user_id = student_id AND personal_id = auth.uid()
));
