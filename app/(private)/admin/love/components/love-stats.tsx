'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { staggerContainer, scaleIn } from '@/lib/motion-variants';
import { Users, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoveStatsProps {
  isLoading: boolean;
  stats: {
    total: number;
    couples: number;
    single: number;
  };
}

export function LoveStats({ isLoading, stats }: LoveStatsProps) {
  return (
    <m.div 
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      variants={staggerContainer}
    >
      {/* Tổng người dùng */}
      <m.div 
        variants={scaleIn}
        className="bg-card hover:bg-card/90 transition-all rounded-xl p-5 border shadow-sm flex items-center gap-4"
      >
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <Users className="size-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tổng người dùng</p>
          <h3 className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : stats.total}
          </h3>
        </div>
      </m.div>

      {/* Số cặp đang yêu */}
      <m.div 
        variants={scaleIn}
        className="bg-card hover:bg-card/90 transition-all rounded-xl p-5 border shadow-sm flex items-center gap-4"
      >
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500">
          <Heart className="size-6 fill-current animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Số cặp đang yêu</p>
          <h3 className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : stats.couples}
          </h3>
        </div>
      </m.div>

      {/* Chờ bắt cặp */}
      <m.div 
        variants={scaleIn}
        className="bg-card hover:bg-card/90 transition-all rounded-xl p-5 border shadow-sm flex items-center gap-4"
      >
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400">
          <Heart className="size-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Chờ bắt cặp</p>
          <h3 className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : stats.single}
          </h3>
        </div>
      </m.div>
    </m.div>
  );
}
