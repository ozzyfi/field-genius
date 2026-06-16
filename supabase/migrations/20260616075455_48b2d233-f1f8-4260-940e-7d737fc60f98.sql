
-- Fix search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Storage policies for evidence bucket (path: <org_id>/<work_record_id>/<file>)
CREATE POLICY "evidence read in org" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.current_org_id()::text);

CREATE POLICY "evidence upload in org" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.current_org_id()::text);

CREATE POLICY "evidence update in org" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.current_org_id()::text);

CREATE POLICY "evidence delete in org" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.current_org_id()::text);
