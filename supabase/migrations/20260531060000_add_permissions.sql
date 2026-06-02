-- Add granular permissions columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS can_add_items boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_reports boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_suppliers boolean DEFAULT false;

-- Auto-grant all permissions to existing admins
UPDATE profiles
SET can_add_items = true,
    can_view_reports = true,
    can_manage_suppliers = true
WHERE role = 'admin';
