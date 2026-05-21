'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Sử dụng useState để đảm bảo QueryClient chỉ được tạo một lần duy nhất trên client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // Dữ liệu cũ sau 5 phút
            refetchOnWindowFocus: false, // Tắt tự động refetch khi tab/window focus
            retry: 1, // Chỉ thử lại 1 lần khi fetch lỗi
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
