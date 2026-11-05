-- Apply once to a NEW Supabase project. This migration does not delete existing data.
begin;

create table public.question_catalog (
  id text primary key,
  subject_id text not null,
  exam_id text not null,
  option_ids text[] not null,
  selection_count integer not null check (selection_count between 1 and 26),
  eligible boolean not null
);
alter table public.question_catalog enable row level security;
revoke all on public.question_catalog from anon, authenticated;

create table public.study_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  kind text not null check (kind in ('start', 'answer', 'check', 'move', 'submit')),
  happened_at timestamptz not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  received_at timestamptz not null default now()
);
create index study_events_user_order on public.study_events(user_id, happened_at, id);
create index study_events_session on public.study_events(user_id, session_id);
create unique index study_events_one_start on public.study_events(user_id, session_id) where kind = 'start';
alter table public.study_events enable row level security;
revoke all on public.study_events from anon, authenticated;
grant select on public.study_events to authenticated;
create policy study_events_read_own on public.study_events for select to authenticated using ((select auth.uid()) = user_id);

-- Only this authenticated RPC can append. It validates the event envelope,
-- question membership, option IDs and the owner; callers cannot edit past events.
create function public.append_study_events(items jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  item jsonb;
  event_id uuid;
  sid uuid;
  event_kind text;
  event_time timestamptz;
  payload jsonb;
  start_data jsonb;
  source_options text[];
  source_count integer;
  inserted integer := 0;
  affected integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(items) is distinct from 'array' then raise exception 'items must be an array' using errcode = '22023'; end if;
  if jsonb_array_length(items) > 100 then raise exception 'At most 100 events per batch' using errcode = '22023'; end if;

  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) is distinct from 'object' or pg_column_size(item) > 200000 then raise exception 'Invalid event' using errcode = '22023'; end if;
    if not (item ?& array['id','sessionId','kind','at','data']) then raise exception 'Missing event fields' using errcode = '22023'; end if;
    event_id := (item->>'id')::uuid;
    sid := (item->>'sessionId')::uuid;
    event_kind := item->>'kind';
    event_time := (item->>'at')::timestamptz;
    payload := item->'data';
    if event_id is null or sid is null or event_time is null or event_kind is null
       or event_kind not in ('start','answer','check','move','submit')
       or jsonb_typeof(payload) is distinct from 'object'
       or event_time < timestamptz '2020-01-01 00:00:00+00'
       or event_time > now() + interval '1 day' then
      raise exception 'Invalid event envelope' using errcode = '22023';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(actor::text || sid::text, 0));
    -- Same UUID + same contents is a retry; a different payload cannot replace it.
    if exists (select 1 from public.study_events where id = event_id) then
      if not exists (select 1 from public.study_events where id = event_id and user_id = actor and session_id = sid and kind = event_kind and happened_at = event_time and data = payload) then
        raise exception 'Event identity conflict' using errcode = '22023';
      end if;
      continue;
    end if;
    select data into start_data from public.study_events where user_id = actor and session_id = sid and kind = 'start';

    if event_kind = 'start' then
      if start_data is not null then raise exception 'Session already started' using errcode = '22023'; end if;
      if not (payload ?& array['mode','subjectId','examId','questionIds'])
         or jsonb_typeof(payload->'mode') is distinct from 'string'
         or (payload->>'mode') not in ('practice','exam','review')
         or jsonb_typeof(payload->'subjectId') is distinct from 'string'
         or jsonb_typeof(payload->'examId') is distinct from 'string'
         or jsonb_typeof(payload->'questionIds') is distinct from 'array' then
        raise exception 'Invalid session' using errcode = '22023';
      end if;
      if jsonb_array_length(payload->'questionIds') not between 1 and 2000 then raise exception 'Invalid question count' using errcode = '22023'; end if;
      if (select count(*) from jsonb_array_elements_text(payload->'questionIds')) <> (select count(distinct value) from jsonb_array_elements_text(payload->'questionIds')) then raise exception 'Duplicate question IDs' using errcode = '22023'; end if;
      if exists (
        select 1 from jsonb_array_elements_text(payload->'questionIds') q(id)
        left join public.question_catalog c on c.id = q.id
        where c.id is null or not c.eligible or c.subject_id <> payload->>'subjectId'
          or ((payload->>'mode') <> 'review' and c.exam_id <> payload->>'examId')
      ) then raise exception 'Question not eligible for this session' using errcode = '22023'; end if;
    else
      if start_data is null then raise exception 'Unknown session' using errcode = '22023'; end if;
      if event_kind in ('answer','check') then
        if jsonb_typeof(payload->'questionId') is distinct from 'string' or not (start_data->'questionIds' ? (payload->>'questionId')) then raise exception 'Question not in session' using errcode = '22023'; end if;
      end if;
      if event_kind = 'answer' then
        if jsonb_typeof(payload->'optionIds') is distinct from 'array' then raise exception 'Invalid answer array' using errcode = '22023'; end if;
        if jsonb_array_length(payload->'optionIds') > 26 then raise exception 'Too many options' using errcode = '22023'; end if;
        select option_ids, selection_count into source_options, source_count from public.question_catalog where id = payload->>'questionId';
        if exists (select 1 from jsonb_array_elements_text(payload->'optionIds') o(id) where not (o.id = any(source_options)))
           or (select count(*) from jsonb_array_elements_text(payload->'optionIds')) <> (select count(distinct value) from jsonb_array_elements_text(payload->'optionIds'))
           or (source_count = 1 and jsonb_array_length(payload->'optionIds') > 1) then
          raise exception 'Invalid answer options' using errcode = '22023';
        end if;
      end if;
      if event_kind = 'check' and start_data->>'mode' = 'exam' then raise exception 'Cannot check an exam before submission' using errcode = '22023'; end if;
      if event_kind = 'move' then
        if jsonb_typeof(payload->'cursor') is distinct from 'number' or (payload->>'cursor') !~ '^[0-9]+$' then raise exception 'Invalid cursor' using errcode = '22023'; end if;
        if (payload->>'cursor')::integer >= jsonb_array_length(start_data->'questionIds') then raise exception 'Cursor out of range' using errcode = '22023'; end if;
      end if;
    end if;

    insert into public.study_events(id,user_id,session_id,kind,happened_at,data)
    values(event_id,actor,sid,event_kind,event_time,payload) on conflict (id) do nothing;
    get diagnostics affected = row_count;
    inserted := inserted + affected;
  end loop;
  return inserted;
end;
$$;
revoke all on function public.append_study_events(jsonb) from public, anon;
grant execute on function public.append_study_events(jsonb) to authenticated;

commit;
