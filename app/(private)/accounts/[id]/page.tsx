import { Metadata } from 'next';
import AccountDetailPage from './account-detail-page';

export const metadata: Metadata = {
  title: 'Chi tiết tài khoản | Money DPH',
  description: 'Xem báo cáo chi tiết thu chi và các giao dịch của tài khoản.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountDetailPage id={id} />;
}
