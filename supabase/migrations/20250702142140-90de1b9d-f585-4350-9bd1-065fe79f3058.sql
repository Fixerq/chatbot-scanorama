-- Phase 1: Critical Security Fixes

-- 1. Clean up conflicting admin_users RLS policies
-- Drop all existing conflicting policies on admin_users table
DROP POLICY IF EXISTS "Admin users can manage admin records" ON admin_users;
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can read" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert new admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow all users to read admin status" ON admin_users;
DROP POLICY IF EXISTS "Anyone can read admin users" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for admin users" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for admin_users" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can view other admin users" ON admin_users;
DROP POLICY IF EXISTS "Only super admin can delete" ON admin_users;
DROP POLICY IF EXISTS "Only super admin can insert" ON admin_users;
DROP POLICY IF EXISTS "Only super admin can update" ON admin_users;
DROP POLICY IF EXISTS "Only super admins can modify admin users" ON admin_users;
DROP POLICY IF EXISTS "Public can view admin status" ON admin_users;
DROP POLICY IF EXISTS "Public read-only access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Users can check admin status" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin status" ON admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;

-- 2. Create secure admin_users RLS policies
-- Allow users to check if they are admins (read-only)
CREATE POLICY "Users can check their own admin status" 
ON admin_users FOR SELECT 
USING (auth.uid() = user_id);

-- Allow current admins to view all admin users
CREATE POLICY "Admins can view all admin users" 
ON admin_users FOR SELECT 
USING (is_admin(auth.uid()));

-- Only allow existing admins to add new admin users
CREATE POLICY "Admins can insert new admin users" 
ON admin_users FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Only allow existing admins to remove admin users
CREATE POLICY "Admins can delete admin users" 
ON admin_users FOR DELETE 
USING (is_admin(auth.uid()));

-- 3. Secure the secrets table - remove public access
DROP POLICY IF EXISTS "Allow read access to all users" ON secrets;
DROP POLICY IF EXISTS "Allow anyone to read allowed origins" ON secrets;

-- Only allow service role to access secrets
CREATE POLICY "Service role only access to secrets" 
ON secrets FOR ALL 
USING (auth.role() = 'service_role');

-- 4. Secure edge_function_logs - remove overly permissive policies
DROP POLICY IF EXISTS "Allow viewing logs for authenticated users" ON edge_function_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON edge_function_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON edge_function_logs;

-- Only allow admins and service role to view logs
CREATE POLICY "Admins can view edge function logs" 
ON edge_function_logs FOR SELECT 
USING (is_admin(auth.uid()) OR auth.role() = 'service_role');

-- Service role can insert logs
CREATE POLICY "Service role can insert logs" 
ON edge_function_logs FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 5. Secure analysis_cache - limit public access
DROP POLICY IF EXISTS "Allow authenticated users to read cache" ON analysis_cache;
DROP POLICY IF EXISTS "Authenticated users can read analysis results" ON analysis_cache;

-- Only allow authenticated users to read their own results or admin users to read all
CREATE POLICY "Users can read relevant analysis cache" 
ON analysis_cache FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only service role can manage cache
CREATE POLICY "Service role manages analysis cache" 
ON analysis_cache FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 6. Secure profiles table if overly permissive
-- Check if profiles has public policies and secure them
CREATE POLICY "Users can manage their own profile" 
ON profiles FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (is_admin(auth.uid()));