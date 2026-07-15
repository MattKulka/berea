-- Replace SM-2 spaced-repetition scheduling with simple, user-named decks
-- that can be freely browsed and re-studied any number of times.
create table decks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table decks enable row level security;

create policy "users manage own decks"
  on decks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table memory_cards add column deck_id bigint references decks(id) on delete cascade;

-- Backfill: put any existing cards into a default "My Verses" deck per user.
insert into decks (user_id, name)
select distinct user_id, 'My Verses' from memory_cards where deck_id is null
on conflict (user_id, name) do nothing;

update memory_cards mc
set deck_id = d.id
from decks d
where mc.deck_id is null and d.user_id = mc.user_id and d.name = 'My Verses';

alter table memory_cards alter column deck_id set not null;
alter table memory_cards add constraint memory_cards_deck_verse_key unique (deck_id, verse_id);

alter table memory_cards drop column ease_factor;
alter table memory_cards drop column interval_days;
alter table memory_cards drop column repetitions;
alter table memory_cards drop column due_at;
alter table memory_cards drop column last_reviewed_at;
