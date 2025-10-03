-- Create storage bucket for plant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for plant images
CREATE POLICY "Anyone can view plant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-images');

CREATE POLICY "Authenticated users can upload plant images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'plant-images' AND auth.role() = 'authenticated');