-- Create team_invitations table for staff invitation management
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'member', 'viewer')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON public.team_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);

-- Enable Row Level Security
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations they sent
CREATE POLICY "Users can view their own invitations"
  ON public.team_invitations
  FOR SELECT
  USING (auth.uid() = invited_by);

-- Policy: Users can create invitations
CREATE POLICY "Users can create invitations"
  ON public.team_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = invited_by);

-- Policy: Users can update invitations they sent (e.g., revoke)
CREATE POLICY "Users can update their invitations"
  ON public.team_invitations
  FOR UPDATE
  USING (auth.uid() = invited_by);

-- Policy: Users can delete invitations they sent
CREATE POLICY "Users can delete their invitations"
  ON public.team_invitations
  FOR DELETE
  USING (auth.uid() = invited_by);

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_team_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to call the function before update
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_invitations_updated_at();

-- Function to automatically expire invitations
CREATE OR REPLACE FUNCTION public.expire_old_team_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;