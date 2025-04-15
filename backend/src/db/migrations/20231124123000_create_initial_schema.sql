-- Migration: Create Initial Schema
-- Date: 2023-11-24 12:30:00 UTC
-- Purpose: This migration creates the initial database schema for the AI Group Calendar application.
-- It includes tables for roles, users, groups, events, group memberships, and event attendance.
-- Row Level Security (RLS) is enabled for all tables to ensure data security and access control.


-- Create roles table
create table roles (
    role_id uuid primary key default uuid_generate_v4(),
    role_name varchar(50) unique not null -- e.g., 'standard', 'admin'
);

-- Create users table
create table users (
    user_id uuid primary key default uuid_generate_v4(),
    email varchar(255) unique not null,
    login varchar(100) not null,
    password_hash varchar(255) not null,
    first_name varchar(100),
    last_name varchar(100),
    role_id uuid not null references roles(role_id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger for users table to update updated_at
create trigger set_timestamp_users
before update on users
for each row
execute function trigger_set_timestamp();

-- Create groups table
create table groups (
    group_id uuid primary key default uuid_generate_v4(),
    group_name varchar(255) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger for groups table to update updated_at
create trigger set_timestamp_groups
before update on groups
for each row
execute function trigger_set_timestamp();

-- Create events table
create table events (
    event_id uuid primary key default uuid_generate_v4(),
    group_id uuid not null references groups(group_id) on delete cascade,
    creator_user_id uuid references users(user_id) on delete set null,
    title varchar(255) not null,
    start_time timestamptz not null,
    place varchar(255),
    description text,
    is_ai_suggestion boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger for events table to update updated_at
create trigger set_timestamp_events
before update on events
for each row
execute function trigger_set_timestamp();

-- Create group_memberships table
create table group_memberships (
    user_id uuid not null references users(user_id) on delete cascade,
    group_id uuid not null references groups(group_id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (user_id, group_id)
);

-- Create event_attendance table
create table event_attendance (
    user_id uuid not null references users(user_id) on delete cascade,
    event_id uuid not null references events(event_id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (user_id, event_id)
);

-- Enable Row Level Security (RLS) for all tables
alter table groups enable row level security;
alter table events enable row level security;
alter table group_memberships enable row level security;
alter table event_attendance enable row level security;

-- RLS Policies for groups table
create policy "Allow admin full access on groups" on groups for all
    using (current_user_role() = 'admin');
create policy "Allow members read access on their groups" on groups for select
    using (exists (select 1 from group_memberships where group_id = groups.group_id and user_id = current_user_id()));

-- RLS Policies for group_memberships table
create policy "Allow admin full access on group_memberships" on group_memberships for all
    using (current_user_role() = 'admin');
create policy "Allow users to read their own memberships" on group_memberships for select
    using (user_id = current_user_id());

-- RLS Policies for events table
create policy "Allow admin full access on events" on events for all
    using (current_user_role() = 'admin');
create policy "Allow group members to access events in their groups" on events for all
    using (exists (select 1 from group_memberships where group_id = events.group_id and user_id = current_user_id()));

-- RLS Policies for event_attendance table
create policy "Allow admin full access on event_attendance" on event_attendance for all
    using (current_user_role() = 'admin');
create policy "Allow users to manage attendance for events in their groups" on event_attendance for all
    using (
        exists (
            select 1
            from events e
            join group_memberships gm on e.group_id = gm.group_id
            where e.event_id = event_attendance.event_id and gm.user_id = current_user_id()
        )
        and
        user_id = current_user_id()
    );
create policy "Allow group members to see attendance for events in their groups" on event_attendance for select
    using (
        exists (
            select 1
            from events e
            join group_memberships gm on e.group_id = gm.group_id
            where e.event_id = event_attendance.event_id and gm.user_id = current_user_id()
        )
    );

-- Seed initial data

-- Insert default roles
INSERT INTO roles (role_name) VALUES ('standard'), ('admin') ON CONFLICT (role_name) DO NOTHING;

-- Insert default admin user
INSERT INTO users (email, login, password_hash, first_name, last_name, role_id)
SELECT
    'admin@admin.com', -- Default admin email
    'admin',             -- Default admin login
    '$2b$10$lnKjlMMNeEjCbbcfsaE7P.ufElOawqXTebwB8lSSUgYaiKc45L0bG', -- Default admin password
    'Admin',
    'User',
    (SELECT role_id FROM roles WHERE role_name = 'admin') -- Get the admin role_id
WHERE
    NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'admin@admin.com'
    ); 