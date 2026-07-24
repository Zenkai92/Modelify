-- =============================================================================
-- Modelify — Politiques de sécurité au niveau ligne (RLS)
-- =============================================================================
--
-- Modèle de sécurité de l'application :
--
--   Navigateur ──(JWT)──> API FastAPI ──(clé service_role)──> Postgres
--
-- Le frontend n'interroge jamais PostgREST directement : il n'utilise Supabase
-- que pour l'authentification (supabase.auth.*). Toutes les lectures et
-- écritures de données transitent par l'API FastAPI, qui applique ses propres
-- règles métier (vérification du rôle admin, appartenance du projet, etc.).
--
-- La clé anon est publique : elle est distribuée dans le bundle JavaScript.
-- Toute permission accordée au rôle `anon` est donc accordée à n'importe qui
-- sur Internet. C'est pourquoi `anon` ne reçoit ici qu'un accès en lecture aux
-- données réellement publiques (catalogue produits, mentions légales).
--
-- Les politiques destinées au rôle `authenticated` constituent une défense en
-- profondeur : elles ne sont pas empruntées par le backend (qui utilise
-- service_role), mais elles garantissent que si un utilisateur extrayait son
-- JWT du navigateur pour interroger PostgREST directement, il ne verrait que
-- ses propres données.
--
-- Le rôle service_role contourne le RLS par conception : le backend continue
-- donc de fonctionner normalement une fois ce script appliqué, à condition
-- d'utiliser `supabase_admin` (voir la liste des appels à migrer en fin de
-- fichier).
--
-- Script idempotent : réexécutable sans effet de bord.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Fonctions utilitaires
-- -----------------------------------------------------------------------------
--
-- Ces fonctions sont en SECURITY DEFINER : elles s'exécutent avec les droits de
-- leur propriétaire, qui est propriétaire des tables et n'est donc pas soumis au
-- RLS. C'est ce qui permet à une politique sur "Users" de consulter "Users" sans
-- provoquer de récursion infinie.
--
-- Ne jamais activer FORCE ROW LEVEL SECURITY sur ces tables : cela soumettrait
-- le propriétaire au RLS et casserait ce mécanisme.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."Users" u
    where u.id = auth.uid()
      and u."role" = 'admin'
  );
$$;

comment on function public.is_admin() is
  'Vrai si l''utilisateur courant possède le rôle admin dans la table Users.';


create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u."role"
  from public."Users" u
  where u.id = auth.uid();
$$;

comment on function public.current_user_role() is
  'Rôle stocké en base pour l''utilisateur courant. Sert à empêcher l''élévation de privilèges lors d''un UPDATE sur Users.';


create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."Projects" p
    where p.id = p_project_id
      and p."userId" = auth.uid()
  );
$$;

comment on function public.owns_project(uuid) is
  'Vrai si le projet appartient à l''utilisateur courant. Utilisée par les politiques des tables filles (ProjectsImages, ProjectsMessages).';


revoke execute on function public.is_admin()            from public;
revoke execute on function public.current_user_role()   from public;
revoke execute on function public.owns_project(uuid)    from public;

grant execute on function public.is_admin()             to authenticated;
grant execute on function public.current_user_role()    to authenticated;
grant execute on function public.owns_project(uuid)     to authenticated;


-- -----------------------------------------------------------------------------
-- 2. Activation du RLS
-- -----------------------------------------------------------------------------
-- À partir d'ici, tout accès est refusé par défaut : seules les politiques
-- définies plus bas rouvrent des accès précis.

alter table public."Users"            enable row level security;
alter table public."Projects"         enable row level security;
alter table public."ProjectsImages"   enable row level security;
alter table public."ProjectsMessages" enable row level security;
alter table public."Products"         enable row level security;
alter table public."Orders"           enable row level security;
alter table public."LegalDocuments"   enable row level security;


-- -----------------------------------------------------------------------------
-- 3. Privilèges de base (GRANT)
-- -----------------------------------------------------------------------------
--
-- Le RLS filtre les lignes, mais les privilèges SQL restent la première barrière
-- et s'appliquent avant lui. Supabase accorde par défaut tous les privilèges aux
-- rôles anon et authenticated : on repart d'une base vide et on ne réaccorde que
-- le strict nécessaire.

revoke all on public."Users"            from anon, authenticated;
revoke all on public."Projects"         from anon, authenticated;
revoke all on public."ProjectsImages"   from anon, authenticated;
revoke all on public."ProjectsMessages" from anon, authenticated;
revoke all on public."Products"         from anon, authenticated;
revoke all on public."Orders"           from anon, authenticated;
revoke all on public."LegalDocuments"   from anon, authenticated;

grant select, update            on public."Users"            to authenticated;
grant select, insert            on public."Projects"         to authenticated;
grant select                    on public."ProjectsImages"   to authenticated;
grant select, insert            on public."ProjectsMessages" to authenticated;
grant select                    on public."Orders"           to authenticated;
grant select                    on public."LegalDocuments"   to anon, authenticated;

-- Products : privilèges accordés colonne par colonne.
-- Le RLS ne sait pas masquer une colonne ; or `download_files` contient les
-- liens vers les fichiers payants et `stripe_price_id` / `stripe_product_id`
-- sont des identifiants de facturation. Un GRANT restreint aux colonnes
-- publiques est ici le bon outil : le catalogue reste lisible, les fichiers
-- vendus ne fuitent pas.
grant select (
  id,
  title,
  description,
  price,
  overview_model_file,
  file_formats,
  created_at,
  updated_at
) on public."Products" to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 4. Users
-- -----------------------------------------------------------------------------

drop policy if exists "users_select_self"     on public."Users";
drop policy if exists "users_select_admin"    on public."Users";
drop policy if exists "users_update_self"     on public."Users";

-- Chacun lit sa propre fiche.
create policy "users_select_self"
  on public."Users"
  for select
  to authenticated
  using (auth.uid() = id);

-- Un administrateur lit toutes les fiches (écran d'administration).
create policy "users_select_admin"
  on public."Users"
  for select
  to authenticated
  using (public.is_admin());

-- Chacun met à jour sa propre fiche, sans pouvoir changer son identifiant ni
-- s'attribuer le rôle admin : le WITH CHECK impose que le rôle après écriture
-- soit identique au rôle actuellement stocké en base.
create policy "users_update_self"
  on public."Users"
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and "role" is not distinct from public.current_user_role()
  );

-- Aucune politique INSERT ni DELETE : la création de profil est faite par le
-- backend (POST /users, service_role) après vérification que le compte existe
-- bien dans auth.users et que l'email correspond.


-- -----------------------------------------------------------------------------
-- 5. Projects
-- -----------------------------------------------------------------------------

drop policy if exists "projects_select_own"    on public."Projects";
drop policy if exists "projects_select_admin"  on public."Projects";
drop policy if exists "projects_insert_own"    on public."Projects";
drop policy if exists "projects_update_admin"  on public."Projects";
drop policy if exists "projects_delete_admin"  on public."Projects";

create policy "projects_select_own"
  on public."Projects"
  for select
  to authenticated
  using (auth.uid() = "userId");

create policy "projects_select_admin"
  on public."Projects"
  for select
  to authenticated
  using (public.is_admin());

-- Un utilisateur ne peut créer un projet qu'en son propre nom, et le projet
-- démarre obligatoirement au statut « en attente » : impossible de s'auto-livrer
-- un projet en le créant directement au statut « payé ».
create policy "projects_insert_own"
  on public."Projects"
  for insert
  to authenticated
  with check (
    auth.uid() = "userId"
    and status = 'en attente'
  );

-- Les transitions de statut (devis, paiement, livraison) relèvent de la logique
-- métier et du webhook Stripe : réservées à l'administration.
create policy "projects_update_admin"
  on public."Projects"
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "projects_delete_admin"
  on public."Projects"
  for delete
  to authenticated
  using (public.is_admin());


-- -----------------------------------------------------------------------------
-- 6. ProjectsImages
-- -----------------------------------------------------------------------------
-- Fichiers joints à un projet (pièces fournies par le client, livrables déposés
-- par l'administration). Lecture réservée au propriétaire du projet parent.

drop policy if exists "projects_images_select_owner" on public."ProjectsImages";
drop policy if exists "projects_images_select_admin" on public."ProjectsImages";

create policy "projects_images_select_owner"
  on public."ProjectsImages"
  for select
  to authenticated
  using (public.owns_project("projectId"));

create policy "projects_images_select_admin"
  on public."ProjectsImages"
  for select
  to authenticated
  using (public.is_admin());

-- Aucune politique d'écriture : les dépôts de fichiers passent par le backend,
-- qui valide le type MIME et la taille avant d'écrire (service_role).


-- -----------------------------------------------------------------------------
-- 7. ProjectsMessages
-- -----------------------------------------------------------------------------
-- Messagerie entre le client et l'administration, rattachée à un projet.

drop policy if exists "messages_select_participant" on public."ProjectsMessages";
drop policy if exists "messages_select_admin"       on public."ProjectsMessages";
drop policy if exists "messages_insert_participant" on public."ProjectsMessages";
drop policy if exists "messages_insert_admin"       on public."ProjectsMessages";

create policy "messages_select_participant"
  on public."ProjectsMessages"
  for select
  to authenticated
  using (public.owns_project("projectId"));

create policy "messages_select_admin"
  on public."ProjectsMessages"
  for select
  to authenticated
  using (public.is_admin());

-- Le client écrit dans la discussion de son projet, en son nom, et ne peut pas
-- se faire passer pour l'administration via sender_role.
create policy "messages_insert_participant"
  on public."ProjectsMessages"
  for insert
  to authenticated
  with check (
    auth.uid() = "senderId"
    and public.owns_project("projectId")
    and sender_role = 'client'
  );

create policy "messages_insert_admin"
  on public."ProjectsMessages"
  for insert
  to authenticated
  with check (
    auth.uid() = "senderId"
    and public.is_admin()
    and sender_role = 'admin'
  );

-- Ni UPDATE ni DELETE : l'historique de discussion est immuable, ce qui vaut
-- preuve en cas de litige sur le périmètre d'un projet.


-- -----------------------------------------------------------------------------
-- 8. Products
-- -----------------------------------------------------------------------------
-- Catalogue de la boutique. Lecture publique, mais restreinte aux colonnes
-- non sensibles par le GRANT de la section 3.

drop policy if exists "products_select_public" on public."Products";

create policy "products_select_public"
  on public."Products"
  for select
  to anon, authenticated
  using (true);

-- Aucune politique d'écriture : la création d'un produit crée aussi un produit
-- et un prix Stripe, opération strictement backend (service_role).


-- -----------------------------------------------------------------------------
-- 9. Orders
-- -----------------------------------------------------------------------------
-- Commandes issues des paiements Stripe. Un client consulte ses achats ;
-- personne n'écrit depuis un client.

drop policy if exists "orders_select_own"   on public."Orders";
drop policy if exists "orders_select_admin" on public."Orders";

create policy "orders_select_own"
  on public."Orders"
  for select
  to authenticated
  using (auth.uid() = client_id);

create policy "orders_select_admin"
  on public."Orders"
  for select
  to authenticated
  using (public.is_admin());

-- Aucune politique INSERT / UPDATE / DELETE, volontairement : une commande ne
-- naît que du webhook Stripe, après vérification de la signature. Autoriser un
-- client à écrire dans Orders reviendrait à lui laisser s'offrir n'importe quel
-- produit payant.


-- -----------------------------------------------------------------------------
-- 10. LegalDocuments
-- -----------------------------------------------------------------------------
-- CGV, mentions légales, politique de confidentialité : lecture publique.

drop policy if exists "legal_select_public" on public."LegalDocuments";
drop policy if exists "legal_update_admin"  on public."LegalDocuments";

create policy "legal_select_public"
  on public."LegalDocuments"
  for select
  to anon, authenticated
  using (true);

-- Rédaction réservée à l'administration (le backend passe par service_role,
-- cette politique documente et verrouille l'intention).
create policy "legal_update_admin"
  on public."LegalDocuments"
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================================
-- 11. Vérification
-- =============================================================================
-- Confirme que le RLS est actif partout et liste les politiques en place.
--
-- select
--   c.relname                                   as table_name,
--   c.relrowsecurity                            as rls_active,
--   coalesce(count(p.policyname) filter (where p.policyname is not null), 0)
--                                               as nb_policies
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- left join pg_policies p
--   on p.schemaname = n.nspname and p.tablename = c.relname
-- where n.nspname = 'public'
--   and c.relkind = 'r'
-- group by c.relname, c.relrowsecurity
-- order by c.relname;


-- =============================================================================
-- 12. Correspondance avec le code applicatif
-- =============================================================================
--
-- Le backend n'attache jamais le JWT de l'utilisateur au client PostgREST :
-- auth.uid() vaut donc NULL sur le client anon. Toutes les opérations qui
-- dépendent d'une identité passent en conséquence par supabase_admin, le
-- contrôle d'accès étant assuré côté API (get_current_user, check_admin,
-- vérification d'appartenance du projet).
--
-- Deux lectures seulement empruntent encore le client anon, et ce sont les deux
-- seules qui n'exigent aucune authentification :
--
--   app/routers/products.py   GET /products  → policy products_select_public,
--                             restreinte aux colonnes PUBLIC_PRODUCT_COLUMNS.
--                             download_files et les identifiants Stripe sont
--                             hors de portée du rôle anon : un select("*")
--                             serait rejeté par la base (erreur 42501).
--
--   app/routers/legal.py      GET /legal     → policy legal_select_public.
--
-- Les fichiers payants restent accessibles à ceux qui y ont droit, par des
-- routes authentifiées servies en service_role :
--
--   GET /products/{id}/purchased  → renvoie download_files si une commande
--                                   'completed' existe pour l'utilisateur.
--   GET /products/{id}/admin      → produit complet, réservé aux admins.
--
-- =============================================================================
