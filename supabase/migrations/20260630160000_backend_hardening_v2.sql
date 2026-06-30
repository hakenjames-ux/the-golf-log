-- Backend hardening v2 (golf tables only).
-- Three parts: storage limits, foreign-key delete behaviour, uniqueness.
-- Verified before writing: 0 duplicate rows in follows/round_likes/favourites/
-- society_members, so the unique constraints apply cleanly.

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Storage: cap upload size + restrict to images
--    (both buckets currently have NO size limit and NO type restriction)
-- ─────────────────────────────────────────────────────────────────────────
update storage.buckets
   set file_size_limit = 2097152,  -- 2 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
 where id = 'avatars';

update storage.buckets
   set file_size_limit = 10485760, -- 10 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
 where id = 'course-photos';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Foreign keys -> auth.users: make account deletion robust on every path
--    (was ON DELETE NO ACTION, so deleting a user FAILED unless the app
--     deleted these rows first). Community content -> SET NULL (survives,
--     loses attribution); personal/relationship rows -> CASCADE.
-- ─────────────────────────────────────────────────────────────────────────

-- community content: keep the row, drop the link
alter table public.courses    drop constraint courses_submitted_by_fkey,
  add constraint courses_submitted_by_fkey foreign key (submitted_by) references auth.users(id) on delete set null;

alter table public.matches    drop constraint matches_created_by_fkey,
  add constraint matches_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.matches    drop constraint matches_player1_id_fkey,
  add constraint matches_player1_id_fkey foreign key (player1_id) references auth.users(id) on delete set null;
alter table public.matches    drop constraint matches_player2_id_fkey,
  add constraint matches_player2_id_fkey foreign key (player2_id) references auth.users(id) on delete set null;

alter table public.societies  drop constraint societies_created_by_fkey,
  add constraint societies_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

alter table public.tournaments drop constraint tournaments_created_by_fkey,
  add constraint tournaments_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;

-- personal / 1:1 relationship rows: remove with the user
alter table public.tournament_entries drop constraint tournament_entries_user_id_fkey,
  add constraint tournament_entries_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.challenges drop constraint challenges_challenger_id_fkey,
  add constraint challenges_challenger_id_fkey foreign key (challenger_id) references auth.users(id) on delete cascade;
alter table public.challenges drop constraint challenges_opponent_id_fkey,
  add constraint challenges_opponent_id_fkey foreign key (opponent_id) references auth.users(id) on delete cascade;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Uniqueness: stop duplicate follows / likes / favourites / memberships
-- ─────────────────────────────────────────────────────────────────────────
alter table public.follows         add constraint follows_unique         unique (follower_id, following_id);
alter table public.round_likes     add constraint round_likes_unique     unique (round_id, user_id);
alter table public.favourites      add constraint favourites_unique      unique (user_id, course_id);
alter table public.society_members add constraint society_members_unique unique (society_id, user_id);

commit;
