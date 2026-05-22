-- Migration: Remove color column from categories table
ALTER TABLE public.categories DROP COLUMN IF EXISTS color;
