'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { fadeSlideUp } from '@/lib/motion-variants';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LoveFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: 'all' | 'connected' | 'single';
  onFilterChange: (filter: 'all' | 'connected' | 'single') => void;
}

export function LoveFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: LoveFiltersProps) {
  return (
    <m.div 
      className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border"
      variants={fadeSlideUp}
    >
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
        <Input 
          placeholder="Tìm theo tên hoặc email..." 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => onFilterChange('all')}
          size="sm"
          className="flex-1 sm:flex-none cursor-pointer rounded-xl"
        >
          Tất cả
        </Button>
        <Button 
          variant={filter === 'connected' ? 'default' : 'outline'}
          onClick={() => onFilterChange('connected')}
          size="sm"
          className="flex-1 sm:flex-none cursor-pointer text-rose-600 dark:text-rose-400 rounded-xl"
        >
          Đã bắt cặp
        </Button>
        <Button 
          variant={filter === 'single' ? 'default' : 'outline'}
          onClick={() => onFilterChange('single')}
          size="sm"
          className="flex-1 sm:flex-none cursor-pointer text-yellow-600 dark:text-yellow-500 rounded-xl"
        >
          Chưa bắt cặp
        </Button>
      </div>
    </m.div>
  );
}
