'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Regex nhận diện liên kết web (hỗ trợ https://, http://, www.)
 * Tự động loại trừ các dấu câu như chấm, phẩy, ngoặc ở cuối câu tiếng Việt.
 */
export const URL_REGEX = /((?:https?:\/\/|www\.)(?:[^\s<>"'()]|\([^\s<>"']*\))*(?:\([^\s<>"']+\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;

/**
 * Trích xuất danh sách tất cả các URL duy nhất từ một chuỗi văn bản.
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

/**
 * Component hiển thị văn bản tự động nhận diện URL và chuyển đổi thành liên kết clickable.
 */
export const LinkifiedText = React.memo(function LinkifiedText({
  text,
  className,
  linkClassName,
}: LinkifiedTextProps) {
  if (!text) return null;

  // Tách văn bản thành các token xen kẽ giữa text thường và URL
  const parts = text.split(URL_REGEX);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Kiểm tra token có phải là link hợp lệ không
        const isUrl = /^(?:https?:\/\/|www\.)/i.test(part);

        if (isUrl) {
          const href = part.toLowerCase().startsWith('www.') ? `https://${part}` : part;

          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center gap-0.5 underline underline-offset-3 font-semibold break-all cursor-pointer transition-colors duration-200 hover:opacity-80",
                linkClassName
              )}
            >
              <span>{part}</span>
              <ExternalLink className="inline-block size-3 shrink-0 ml-0.5 opacity-70" />
            </a>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
});
