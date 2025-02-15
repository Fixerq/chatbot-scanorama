
create extension if not exists "citext";

alter table public.analysis_cache 
add column if not exists analysis_result jsonb;

-- Update trigger to include new column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Update existing records with empty json
update public.analysis_cache 
set analysis_result = '{}'::jsonb 
where analysis_result is null;
