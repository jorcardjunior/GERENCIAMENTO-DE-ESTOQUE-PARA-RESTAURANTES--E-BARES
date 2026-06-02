-- Ensure base exercises have demonstration video URLs (using high-quality fitness placeholders)
UPDATE public.exercises SET video_url = 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-exercises-with-dumbbells-at-home-40342-large.mp4' WHERE video_url IS NULL;
UPDATE public.exercises SET video_url = 'https://assets.mixkit.co/videos/preview/mixkit-man-training-with-dumbbells-in-the-gym-23253-large.mp4' WHERE primary_muscle IN ('biceps', 'shoulders');
UPDATE public.exercises SET video_url = 'https://assets.mixkit.co/videos/preview/mixkit-young-man-doing-push-ups-at-the-gym-23255-large.mp4' WHERE primary_muscle = 'chest';
UPDATE public.exercises SET video_url = 'https://assets.mixkit.co/videos/preview/mixkit-man-running-on-the-treadmill-23257-large.mp4' WHERE primary_muscle = 'cardio';
