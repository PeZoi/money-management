'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { useLoveMutation } from '@/hooks/use-love';
import { toast } from 'sonner';
import { LoveConnection } from '../constants';

interface UseEditAnniversaryDialogProps {
  loveConn: LoveConnection;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function useEditAnniversaryDialog({
  loveConn,
  isOpen,
  setIsOpen,
}: UseEditAnniversaryDialogProps) {
  const { updateAnniversary, isUpdatingAnniversary } = useLoveMutation();

  const [newAnniversaryDate, setNewAnniversaryDate] = React.useState<Date | undefined>(undefined);
  const [openAnnivCalendar, setOpenAnnivCalendar] = React.useState(false);

  // Đồng bộ ngày kỷ niệm hiện tại khi mở Dialog
  React.useEffect(() => {
    if (!isOpen || !loveConn?.anniversary_date) return;
    const timer = setTimeout(() => {
      setNewAnniversaryDate(new Date(loveConn.anniversary_date));
      setOpenAnnivCalendar(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, loveConn?.anniversary_date]);

  // Submit cập nhật ngày kỷ niệm lên database
  const handleAnniversarySubmit = async () => {
    if (!loveConn || !newAnniversaryDate) return;

    try {
      await updateAnniversary({
        connectionId: loveConn.connection_id,
        anniversaryDate: format(newAnniversaryDate, 'yyyy-MM-dd'),
      });
      toast.success('Cập nhật ngày kỷ niệm thành công!');
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Cập nhật ngày kỷ niệm thất bại.');
    }
  };

  return {
    newAnniversaryDate,
    setNewAnniversaryDate,
    openAnnivCalendar,
    setOpenAnnivCalendar,
    handleAnniversarySubmit,
    isSaving: isUpdatingAnniversary,
  };
}
