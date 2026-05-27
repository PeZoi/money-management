'use client';

import {
  CalculatorIcon,
  ColumnsIcon,
  EyeIcon,
  EyeOffIcon,
  RowsIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ReportTable } from '@/types/report';

// ─── Header bảng báo cáo ─────────────────────────────

interface ReportTableHeaderProps {
  table: ReportTable;
  onRenameTable: (tableId: string, newName: string) => void;
  onDeleteTable: (tableId: string) => void;
  onOpenFormulaDialog: (tableId: string) => void;
  onUpdateTableLayout?: (tableId: string, layout: 'horizontal' | 'vertical') => void;
  onUpdateTableShowTotals?: (tableId: string, showTotals: boolean) => void;
  dragHandle: ReactNode;
}

export function ReportTableHeader({
  table,
  onRenameTable,
  onDeleteTable,
  onOpenFormulaDialog,
  onUpdateTableLayout,
  onUpdateTableShowTotals,
  dragHandle,
}: ReportTableHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(table.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startEditName = () => {
    setEditName(table.name);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const commitEditName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== table.name) {
      onRenameTable(table.id, trimmed);
    }
    setIsEditingName(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-linear-to-r from-muted/30 to-transparent">
      {dragHandle}

      {isEditingName ? (
        <Input
          ref={nameInputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitEditName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEditName();
            if (e.key === 'Escape') setIsEditingName(false);
          }}
          className="h-7 w-48 text-sm font-semibold rounded-lg"
        />
      ) : (
        <button
          onDoubleClick={startEditName}
          className="text-sm font-semibold tracking-tight hover:text-primary transition-colors"
          title="Nhấp đúp để đổi tên"
        >
          {table.name}
        </button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-muted-foreground hover:text-primary"
          onClick={() => onOpenFormulaDialog(table.id)}
          title="Thêm cột công thức"
        >
          <CalculatorIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-muted-foreground hover:text-primary"
          onClick={() => {
            if (onUpdateTableLayout) {
              onUpdateTableLayout(table.id, table.layout === 'vertical' ? 'horizontal' : 'vertical');
            }
          }}
          title={table.layout === 'vertical' ? 'Chuyển sang bảng dạng ngang' : 'Chuyển sang bảng dạng dọc'}
        >
          {table.layout === 'vertical' ? (
            <ColumnsIcon className="size-3.5" />
          ) : (
            <RowsIcon className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-muted-foreground hover:text-primary"
          onClick={() => {
            if (onUpdateTableShowTotals) {
              onUpdateTableShowTotals(table.id, table.showTotals !== false ? false : true);
            }
          }}
          title={table.showTotals !== false ? 'Ẩn tổng cộng' : 'Hiển thị tổng cộng'}
        >
          {table.showTotals !== false ? (
            <EyeIcon className="size-3.5" />
          ) : (
            <EyeOffIcon className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
          onClick={() => onDeleteTable(table.id)}
          title="Xóa bảng"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
