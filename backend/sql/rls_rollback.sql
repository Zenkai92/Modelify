-- =============================================================================
-- Modelify — Retour arrière du script rls_policies.sql
-- =============================================================================
--
-- Remet la base dans son état antérieur : RLS désactivé, privilèges Supabase
-- par défaut restaurés, politiques et fonctions utilitaires supprimées.
--
-- À n'utiliser qu'en dépannage : une fois exécuté, les tables sont de nouveau
-- accessibles avec la clé anon, qui est publique.
-- =============================================================================


-- 1. Désactivation du RLS
alter table public."Users"            disable row level security;
alter table public."Projects"         disable row level security;
alter table public."ProjectsImages"   disable row level security;
alter table public."ProjectsMessages" disable row level security;
alter table public."Products"         disable row level security;
alter table public."Orders"           disable row level security;
alter table public."LegalDocuments"   disable row level security;


-- 2. Suppression des politiques
drop policy if exists "users_select_self"           on public."Users";
drop policy if exists "users_select_admin"          on public."Users";
drop policy if exists "users_update_self"           on public."Users";

drop policy if exists "projects_select_own"         on public."Projects";
drop policy if exists "projects_select_admin"       on public."Projects";
drop policy if exists "projects_insert_own"         on public."Projects";
drop policy if exists "projects_update_admin"       on public."Projects";
drop policy if exists "projects_delete_admin"       on public."Projects";

drop policy if exists "projects_images_select_owner" on public."ProjectsImages";
drop policy if exists "projects_images_select_admin" on public."ProjectsImages";

drop policy if exists "messages_select_participant" on public."ProjectsMessages";
drop policy if exists "messages_select_admin"       on public."ProjectsMessages";
drop policy if exists "messages_insert_participant" on public."ProjectsMessages";
drop policy if exists "messages_insert_admin"       on public."ProjectsMessages";

drop policy if exists "products_select_public"      on public."Products";

drop policy if exists "orders_select_own"           on public."Orders";
drop policy if exists "orders_select_admin"         on public."Orders";

drop policy if exists "legal_select_public"         on public."LegalDocuments";
drop policy if exists "legal_update_admin"          on public."LegalDocuments";


-- 3. Restauration des privilèges par défaut de Supabase
-- Le GRANT colonne par colonne posé sur Products est remplacé par un privilège
-- de table entière : c'est bien le comportement d'origine, mais cela réexpose
-- la colonne download_files aux porteurs de la clé anon.
revoke all on public."Users"            from anon, authenticated;
revoke all on public."Projects"         from anon, authenticated;
revoke all on public."ProjectsImages"   from anon, authenticated;
revoke all on public."ProjectsMessages" from anon, authenticated;
revoke all on public."Products"         from anon, authenticated;
revoke all on public."Orders"           from anon, authenticated;
revoke all on public."LegalDocuments"   from anon, authenticated;

grant all on public."Users"            to anon, authenticated;
grant all on public."Projects"         to anon, authenticated;
grant all on public."ProjectsImages"   to anon, authenticated;
grant all on public."ProjectsMessages" to anon, authenticated;
grant all on public."Products"         to anon, authenticated;
grant all on public."Orders"           to anon, authenticated;
grant all on public."LegalDocuments"   to anon, authenticated;


-- 4. Suppression des fonctions utilitaires
drop function if exists public.owns_project(uuid);
drop function if exists public.current_user_role();
drop function if exists public.is_admin();
