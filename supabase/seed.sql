-- NeuroForge Nexus seed data. Safe to run more than once.
-- Requires the tables from the Milestone 1 schema (roles, permissions, role_permissions, profiles).

insert into public.roles (role_name, description) values
 ('admin','Manage users, access permissions and system configurations.'),
 ('project_manager','Organize projects, plan sprints and assign tasks.'),
 ('developer','Manage assigned development tasks and project contributions.'),
 ('tester','Execute tests, validate software quality and report bugs.'),
 ('devops','Manage automated builds, deployments and application monitoring.')
on conflict (role_name) do nothing;

insert into public.permissions (permission_name, description) values
 ('users.manage','Manage users'),
 ('roles.manage','Manage roles'),
 ('system.configure','Manage system configurations'),
 ('system.view','View system-wide information'),
 ('projects.manage','Create and manage projects'),
 ('sprints.plan','Plan sprints'),
 ('tasks.assign','Assign tasks'),
 ('progress.view','View project progress'),
 ('projects.view_assigned','View assigned projects'),
 ('tasks.view_assigned','View assigned tasks'),
 ('tasks.update_progress','Update task progress'),
 ('updates.submit','Submit development updates'),
 ('tests.view_assigned','View testing assignments'),
 ('tests.execute','Execute test cases'),
 ('bugs.report','Report bugs'),
 ('testing.update_status','Update testing status'),
 ('pipelines.view','View build pipelines'),
 ('builds.manage','Manage authorized build operations'),
 ('deployments.manage','Manage deployments'),
 ('health.monitor','Monitor application health')
on conflict (permission_name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.permission_name = any (
  case r.role_name
    when 'admin' then array['users.manage','roles.manage','system.configure','system.view']
    when 'project_manager' then array['projects.manage','sprints.plan','tasks.assign','progress.view']
    when 'developer' then array['projects.view_assigned','tasks.view_assigned','tasks.update_progress','updates.submit']
    when 'tester' then array['tests.view_assigned','tests.execute','bugs.report','testing.update_status']
    when 'devops' then array['pipelines.view','builds.manage','deployments.manage','health.monitor']
  end)
on conflict do nothing;

-- First admin: sign up in the app first, confirm the email code, then run this
-- with your own email (run it in the Supabase SQL editor, which bypasses row-level security).
update public.profiles
set role = 'admin', account_status = 'active'
where lower(email) = lower('YOUR_EMAIL@example.com');
