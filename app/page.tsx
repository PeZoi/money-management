import { redirect } from 'next/navigation';

/** Dự phòng — người đã đăng nhập vào `/` thường được chuyển ngay ở `middleware.ts`. */
export default function Home() {
  redirect('/dashboard');
}
