
-- Enums
CREATE TYPE public.app_role AS ENUM ('technician','supervisor','admin');
CREATE TYPE public.work_type AS ENUM ('ariza','bakim','test','kurulum','parca','diger');
CREATE TYPE public.work_status AS ENUM ('beklemede','devam_ediyor','kapanis_eksik','tamamlandi','iptal');
CREATE TYPE public.work_priority AS ENUM ('dusuk','normal','yuksek','kritik');
CREATE TYPE public.work_source AS ENUM ('atanan','teknisyen');
CREATE TYPE public.evidence_kind AS ENUM ('foto_oncesi','foto_sonrasi','video_oncesi','video_sonrasi','ses','olcum_oncesi','olcum_sonrasi','hata_kodu','diger');

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.profiles(org_id);

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- Sites
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.sites(org_id);

-- Machines
CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  model TEXT,
  serial TEXT,
  qr_code TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.machines(org_id);
CREATE INDEX ON public.machines(site_id);

-- Work records
CREATE TABLE public.work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type public.work_type NOT NULL,
  status public.work_status NOT NULL DEFAULT 'beklemede',
  priority public.work_priority NOT NULL DEFAULT 'normal',
  source public.work_source NOT NULL DEFAULT 'teknisyen',
  title TEXT NOT NULL,
  description TEXT,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  location_note TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  initial_state TEXT,
  work_performed TEXT,
  final_state TEXT,
  root_cause TEXT,
  root_cause_status TEXT,
  follow_up_needed BOOLEAN NOT NULL DEFAULT false,
  follow_up_reason TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.work_records(org_id);
CREATE INDEX ON public.work_records(assigned_to);
CREATE INDEX ON public.work_records(created_by);
CREATE INDEX ON public.work_records(machine_id);
CREATE INDEX ON public.work_records(status);

-- Evidence
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_record_id UUID NOT NULL REFERENCES public.work_records(id) ON DELETE CASCADE,
  kind public.evidence_kind NOT NULL,
  storage_path TEXT,
  text_value TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.evidence(work_record_id);
CREATE INDEX ON public.evidence(org_id);

-- Interventions / parts (lightweight)
CREATE TABLE public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_record_id UUID NOT NULL REFERENCES public.work_records(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- onarim, ayar, kalibrasyon, temizlik, reset, degisim
  notes TEXT,
  part_code TEXT,
  part_name TEXT,
  quantity NUMERIC,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.interventions(work_record_id);

-- Voice closures
CREATE TABLE public.voice_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_record_id UUID NOT NULL REFERENCES public.work_records(id) ON DELETE CASCADE,
  audio_path TEXT,
  transcript TEXT,
  structured JSONB NOT NULL DEFAULT '{}'::jsonb,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.voice_closures(work_record_id);

-- AI conversations (per work record)
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_record_id UUID REFERENCES public.work_records(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user / assistant
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_messages(work_record_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;
GRANT ALL ON public.machines TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_records TO authenticated;
GRANT ALL ON public.work_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence TO authenticated;
GRANT ALL ON public.evidence TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interventions TO authenticated;
GRANT ALL ON public.interventions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_closures TO authenticated;
GRANT ALL ON public.voice_closures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read org" ON public.organizations FOR SELECT TO authenticated
  USING (id = public.current_org_id());

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR org_id = public.current_org_id());
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Generic org-scoped policies
CREATE POLICY "org read sites" ON public.sites FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org write sites" ON public.sites FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "org read machines" ON public.machines FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org write machines" ON public.machines FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "org read work" ON public.work_records FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org write work" ON public.work_records FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "org read evidence" ON public.evidence FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org write evidence" ON public.evidence FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "org read interventions" ON public.interventions FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org write interventions" ON public.interventions FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "org read closures" ON public.voice_closures FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org write closures" ON public.voice_closures FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "org read ai" ON public.ai_messages FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY "org write ai" ON public.ai_messages FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

-- Auto updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_work_records_updated BEFORE UPDATE ON public.work_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- New user trigger: attach to demo org if exists, otherwise create org for user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_org_id UUID;
  v_full_name TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1));
  SELECT id INTO v_org_id FROM public.organizations WHERE name = 'ToolA Demo' LIMIT 1;
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations(name) VALUES ('ToolA Demo') RETURNING id INTO v_org_id;
  END IF;
  INSERT INTO public.profiles(id, org_id, full_name) VALUES (NEW.id, v_org_id, v_full_name);
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'technician');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
