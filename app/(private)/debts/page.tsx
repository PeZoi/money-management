import DebtsPage from "@/app/(private)/debts/debts-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ghi chú người nợ | Money+",
  description: "Quản lý danh sách những người nợ tiền của bạn, ghi chú số tiền, ngày mượn, hạn trả và tự động gửi thông báo nhắc nhở đến Telegram.",
};

export default function Page() {
  return <DebtsPage />;
}
