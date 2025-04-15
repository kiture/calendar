create extension if not exists "uuid-ossp";

-- Function to automatically update the updated_at column
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to get the current user's role
create or replace function current_user_role() returns varchar as $$
declare
  role_name_var varchar;
begin
  -- Example logic to determine the user's role
  -- This assumes you have a way to get the current user's ID, such as a session variable
  select r.role_name into role_name_var
  from users u
  join roles r on u.role_id = r.role_id
  where u.user_id = current_setting('myapp.user_id', true)::uuid; -- Adjust this to your context
  return role_name_var;
exception
  when others then
    return null;
end;
$$ language plpgsql stable;

-- Function to get the current user's ID
create or replace function current_user_id() returns uuid as $$
begin
  -- Example logic to determine the user's ID
  -- This assumes you have a way to get the current user's ID, such as a session variable
  return current_setting('myapp.user_id', true)::uuid; -- Adjust this to your context
exception
  when others then
    return null;
end;
$$ language plpgsql stable;