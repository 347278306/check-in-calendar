-- Supabase Database Schema for Check-in Calendar
-- Run this SQL in your Supabase project's SQL Editor

-- Drop existing tables if needed (uncomment to reset)
-- drop table if exists records cascade;
-- drop table if exists calendars cascade;

-- Create calendars table
create table if not exists calendars (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text not null,
  color text not null,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create records table
create table if not exists records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  calendar_id uuid references calendars(id) on delete cascade not null,
  date text not null,
  check_in_time timestamptz default now(),
  content text default '',
  images text[] default '{}',
  is_retroactive boolean default false,
  retroactive_time timestamptz,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table calendars enable row level security;
alter table records enable row level security;

-- RLS Policies for calendars
-- Users can view their own calendars
create policy "Users can view their own calendars" on calendars
  for select using (auth.uid() = user_id);

-- Users can insert their own calendars
create policy "Users can insert their own calendars" on calendars
  for insert with check (auth.uid() = user_id);

-- Users can update their own calendars
create policy "Users can update their own calendars" on calendars
  for update using (auth.uid() = user_id);

-- Users can delete their own calendars
create policy "Users can delete their own calendars" on calendars
  for delete using (auth.uid() = user_id);

-- RLS Policies for records
-- Users can view their own records
create policy "Users can view their own records" on records
  for select using (auth.uid() = user_id);

-- Users can insert their own records
create policy "Users can insert their own records" on records
  for insert with check (auth.uid() = user_id);

-- Users can update their own records
create policy "Users can update their own records" on records
  for update using (auth.uid() = user_id);

-- Users can delete their own records
create policy "Users can delete their own records" on records
  for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_calendars_user_id on calendars(user_id);
create index idx_records_calendar_id on records(calendar_id);
create index idx_records_date on records(date);
create index idx_records_user_id on records(user_id);

-- Enable realtime for records (optional, for live updates)
alter publication supabase_realtime add table records;
