
-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. User registrations tracking
CREATE TABLE public.user_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  suspicious_reason TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_reg_registered_at ON public.user_registrations(registered_at DESC);
CREATE INDEX idx_user_reg_ip ON public.user_registrations(ip_address);

CREATE POLICY "Admins view all registrations"
  ON public.user_registrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins update registrations"
  ON public.user_registrations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete registrations"
  ON public.user_registrations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts registrations"
  ON public.user_registrations FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 3. Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  actor_id UUID,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

CREATE POLICY "Admins view all logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "System inserts logs"
  ON public.activity_logs FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 4. Site content CMS
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads site content"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage site content"
  ON public.site_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed
INSERT INTO public.site_content (key, value, description) VALUES
  ('hero_title', 'Where bold founders meet sharp investors', 'Landing hero title'),
  ('hero_subtitle', 'Swap Agent connects startups raising capital with investors looking for their next bet.', 'Landing hero subtitle')
ON CONFLICT (key) DO NOTHING;

-- 5. Trigger to log new user registrations
CREATE OR REPLACE FUNCTION public.log_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ip TEXT;
  _ua TEXT;
  _ip_count INT;
  _suspicious BOOLEAN := false;
  _reason TEXT;
BEGIN
  _ip := NEW.raw_user_meta_data->>'signup_ip';
  _ua := NEW.raw_user_meta_data->>'signup_user_agent';

  IF _ip IS NOT NULL THEN
    SELECT COUNT(*) INTO _ip_count
    FROM public.user_registrations
    WHERE ip_address = _ip;
    IF _ip_count >= 2 THEN
      _suspicious := true;
      _reason := 'Multiple registrations from same IP (' || (_ip_count + 1) || ')';
    END IF;
  END IF;

  INSERT INTO public.user_registrations
    (user_id, email, display_name, ip_address, user_agent, is_suspicious, suspicious_reason)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    _ip,
    _ua,
    _suspicious,
    _reason
  );

  INSERT INTO public.activity_logs (user_id, action, category, metadata, ip_address)
  VALUES (NEW.id, 'user_registered', 'auth',
    jsonb_build_object('email', NEW.email, 'suspicious', _suspicious),
    _ip);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_log
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.log_new_user_registration();

-- Ensure profile-creation trigger still exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill registrations for existing users
INSERT INTO public.user_registrations (user_id, email, display_name, registered_at)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)), u.created_at
FROM auth.users u
LEFT JOIN public.user_registrations r ON r.user_id = u.id
WHERE r.id IS NULL;
