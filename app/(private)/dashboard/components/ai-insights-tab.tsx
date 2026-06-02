'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  SparklesIcon,
  BrainIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  RefreshCwIcon,
  SendIcon,
  CoinsIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  ScaleIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  BotIcon,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatVnd } from '@/app/(private)/transactions/transaction-ui';
import { cn } from '@/lib/utils';
import type { AIInsightsResponse, AIAlert, AIRecommendation, AICategoryAnalysis } from '@/lib/utils/ai-insights-server';

interface AiInsightsTabProps {
  activeWorkspaceId: string | undefined;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Helper render Markdown đơn giản cho tin nhắn của AI
function renderMarkdown(text: string) {
  if (!text) return null;
  const paragraphs = text.split('\n');
  return paragraphs.map((para, i) => {
    const cleanText = para.trim();
    if (!cleanText) return <div key={i} className="h-2" />;

    // Nhận diện dòng là tiêu đề (ví dụ: ### Tiêu đề)
    if (cleanText.startsWith('###')) {
      const content = cleanText.replace(/^###\s*/, '');
      return <h4 key={i} className="text-sm font-bold mt-4 mb-1.5 text-foreground flex items-center gap-1.5" dangerouslySetInnerHTML={{ __html: formatBoldItalic(content) }} />;
    }
    if (cleanText.startsWith('##')) {
      const content = cleanText.replace(/^##\s*/, '');
      return <h3 key={i} className="text-base font-extrabold mt-5 mb-2 text-foreground border-b pb-1 border-border/40" dangerouslySetInnerHTML={{ __html: formatBoldItalic(content) }} />;
    }

    // Nhận diện list item
    if (cleanText.startsWith('-') || cleanText.startsWith('*')) {
      const content = cleanText.replace(/^[-*]\s*/, '');
      return (
        <ul key={i} className="list-disc pl-5 my-1.5">
          <li className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBoldItalic(content) }} />
        </ul>
      );
    }

    // Dòng bình thường
    return (
      <p key={i} className="text-xs sm:text-sm leading-relaxed my-1.5 text-muted-foreground/95" dangerouslySetInnerHTML={{ __html: formatBoldItalic(cleanText) }} />
    );
  });
}

// Format chữ in đậm **text** và in nghiêng *text* sang thẻ HTML tương ứng
function formatBoldItalic(text: string): string {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-foreground bg-primary/5 px-1 rounded-sm">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  return formatted;
}

export function AiInsightsTab({ activeWorkspaceId }: AiInsightsTabProps) {
  const [months, setMonths] = React.useState<number>(1);
  const [insights, setInsights] = React.useState<AIInsightsResponse | null>(null);

  // State chatbot
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Khôi phục cache Insights từ LocalStorage khi mount hoặc đổi workspace/tháng
  React.useEffect(() => {
    if (!activeWorkspaceId) return;
    const cacheKey = `ai_insights_${activeWorkspaceId}_${months}`;
    const cachedData = localStorage.getItem(cacheKey);
    let dataToSet: AIInsightsResponse | null = null;
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Cache có hiệu lực trong vòng 1 ngày (86400000 ms)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          dataToSet = parsed.data;
        }
      } catch (e) {
        console.error('Lỗi parse cache AI Insights', e);
      }
    }

    const handleCache = () => {
      setInsights(dataToSet);
    };
    const timer = setTimeout(handleCache, 0);
    return () => clearTimeout(timer);
  }, [activeWorkspaceId, months]);

  // Cuộn chat xuống cuối khi có tin nhắn mới
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mutation gọi API phân tích AI
  const insightsMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspaceId) throw new Error('Không tìm thấy ID workspace.');
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: activeWorkspaceId, months }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Có lỗi xảy ra khi gọi AI');
      }
      const json = await res.json();
      return json.data as AIInsightsResponse;
    },
    onSuccess: (data) => {
      if (data && activeWorkspaceId) {
        setInsights(data);
        // Lưu vào LocalStorage làm cache
        const cacheKey = `ai_insights_${activeWorkspaceId}_${months}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
      }
    }
  });

  // Mutation gọi API chat
  const chatMutation = useMutation({
    mutationFn: async (updatedMessages: Message[]) => {
      if (!activeWorkspaceId) throw new Error('Không tìm thấy ID workspace.');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: activeWorkspaceId, messages: updatedMessages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Trợ lý AI bận, vui lòng thử lại sau.');
      }
      const json = await res.json();
      return json.data as string;
    },
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Lỗi: ${error.message}` }
      ]);
    }
  });

  const handleStartAnalysis = () => {
    insightsMutation.mutate();
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || chatMutation.isPending) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    if (!textToSend) setInputMessage('');

    chatMutation.mutate(newMessages);
  };

  // Các câu hỏi gợi ý nhanh
  const quickPrompts = [
    'Tháng này tôi tiêu nhiều nhất vào việc gì?',
    'Làm thế nào để tiết kiệm 1 triệu VND tháng này?',
    'So sánh chi tiêu 2 tháng gần đây của tôi.',
    'Nhận xét các khoản chi tiêu ăn uống của tôi.'
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">

      {/* 1. CARD HEADER & CONFIG - GLASSMORPHISM PREMIUM */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-card/35 p-6 backdrop-blur-xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300 hover:border-primary/20">
        {/* Glow hiệu ứng tròn chuyển động mờ */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="flex items-start gap-4 relative z-10">
          <div className="size-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/5 animate-pulse">
            <BrainIcon className="size-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground flex flex-wrap items-center gap-2.5">
              Trợ lý Phân tích Tài chính AI
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary tracking-wider uppercase">
                <SparklesIcon className="size-3 animate-bounce" /> Llama 3.3
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-xl leading-relaxed">
              Phân tích thói quen tiêu dùng trong quá khứ, phát hiện các giao dịch bất thường và cung cấp các lời khuyên tiết kiệm tài chính cá nhân hóa dành riêng cho bạn.
            </p>
          </div>
        </div>

        {/* Cấu hình thời gian */}
        <div className="flex items-center gap-3.5 self-end md:self-center shrink-0 relative z-10">
          <Select
            value={String(months)}
            onValueChange={(val) => setMonths(Number(val))}
            disabled={insightsMutation.isPending}
          >
            <SelectTrigger className="w-[165px] rounded-xl text-xs h-9.5 bg-card/75 border border-border/60 hover:bg-card focus:ring-primary/25 transition-all">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/80">
              <SelectItem value="1" className="text-xs rounded-lg">1 tháng gần đây</SelectItem>
              <SelectItem value="2" className="text-xs rounded-lg">2 tháng gần đây</SelectItem>
              <SelectItem value="3" className="text-xs rounded-lg">3 tháng gần đây</SelectItem>
            </SelectContent>
          </Select>

          {insights && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartAnalysis}
              className="rounded-xl text-xs h-9.5 flex items-center gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all active:scale-98"
              disabled={insightsMutation.isPending}
            >
              <RefreshCwIcon className={cn("size-3.5", insightsMutation.isPending && "animate-spin")} />
              Phân tích lại
            </Button>
          )}
        </div>
      </div>

      {/* RENDER KHI CHƯA CÓ DỮ LIỆU & ĐANG LOAD */}
      {!insights && !insightsMutation.isPending && (
        <div className="rounded-3xl border border-dashed border-primary/20 p-12 flex flex-col items-center justify-center text-center bg-card/15 min-h-[350px] relative overflow-hidden transition-all duration-300 hover:bg-card/20 hover:border-primary/30">
          <div className="absolute inset-0 bg-gradient-radial from-primary/3 to-transparent pointer-events-none" />
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative">
              <SparklesIcon className="size-8 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Sẵn sàng mở khóa Insights tài chính của bạn
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground/70 max-w-md mb-8 leading-relaxed">
            Hệ thống sẽ tổng hợp toàn bộ lịch sử chi tiêu trong {months} tháng qua của nhóm để AI phân tích và đưa ra các cảnh báo thói quen, giúp bạn tiết kiệm tiền.
          </p>
          <Button
            type="button"
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20 border-primary/10 px-8 py-6 text-sm font-extrabold flex items-center gap-2.5 transition-all hover:scale-103 active:scale-97 cursor-pointer"
            onClick={handleStartAnalysis}
          >
            <BrainIcon className="size-5 animate-pulse" />
            Bắt đầu phân tích ngay
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {insightsMutation.isPending && (
        <div className="rounded-3xl border border-primary/10 bg-card/30 p-10 text-center space-y-8 animate-pulse relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-primary/30 to-transparent animate-shimmer" />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <RefreshCwIcon className="size-8 text-primary animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-foreground">Trợ lý AI đang phân tích dữ liệu...</div>
              <div className="text-xs text-muted-foreground/75 max-w-sm leading-relaxed">
                Đang quét toàn bộ giao dịch, quy đổi tiền tệ, phân nhóm danh mục và thiết lập các lời khuyên tiết kiệm tối ưu.
              </div>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted/40 rounded-2xl border border-muted/50" />
            ))}
          </div>
          <div className="h-36 bg-muted/40 rounded-2xl border border-muted/50" />
        </div>
      )}

      {/* HIỂN THỊ KẾT QUẢ PHÂN TÍCH */}
      {insights && !insightsMutation.isPending && (
        <div className="space-y-6">

          {/* 1. TÓM TẮT CHUNG (EXECUTIVE SUMMARY) - PREMIUM BUBBLE FULLWIDTH */}
          <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/8 via-primary/3 to-transparent p-6 backdrop-blur-xl relative overflow-hidden shadow-xs hover:border-primary/25 transition-all duration-300">
            <div className="absolute -right-10 -bottom-10 opacity-[0.04] select-none pointer-events-none group-hover:scale-105 transition-all">
              <SparklesIcon className="size-48 text-primary" />
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Trực quan hóa
              </span>
            </div>
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3.5 flex items-center gap-2 select-none">
              <SparklesIcon className="size-4 animate-spin-slow" />
              Nhận xét tổng quan của AI
            </h3>
            <p className="text-sm sm:text-base text-foreground font-bold leading-relaxed relative z-10 pl-2 border-l-2 border-primary/45 italic">
              &ldquo;{insights.summary}&rdquo;
            </p>
          </div>

          {/* HỆ GRID 2 CỘT: KPI + LỜI KHUYÊN (2/3 CỘT) VÀ TỶ TRỌNG DANH MỤC (1/3 CỘT) */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

            {/* CỘT TRÁI (2/3 CỘT): KPI & LỜI KHUYÊN */}
            <div className="lg:col-span-2 space-y-6">

              {/* CHỈ SỐ KPI GRID */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                {/* Tổng Chi tiêu */}
                <div className="rounded-2xl border bg-card/45 p-4.5 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:shadow-xs group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform">
                    <TrendingDownIcon className="size-16 text-rose-500" />
                  </div>
                  <div className="flex items-center justify-between gap-1.5 relative z-10">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tổng chi</span>
                    <div className="size-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all">
                      <TrendingDownIcon className="size-3.5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-rose-600 dark:text-rose-400 mt-3 truncate relative z-10 tracking-tight">
                    {formatVnd(insights.metrics.total_expense)}
                  </h4>
                </div>

                {/* Tổng Thu nhập */}
                <div className="rounded-2xl border bg-card/45 p-4.5 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xs group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform">
                    <TrendingUpIcon className="size-16 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between gap-1.5 relative z-10">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tổng thu</span>
                    <div className="size-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <TrendingUpIcon className="size-3.5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-3 truncate relative z-10 tracking-tight">
                    {formatVnd(insights.metrics.total_income)}
                  </h4>
                </div>

                {/* Tỷ lệ Tiết kiệm */}
                <div className="rounded-2xl border bg-card/45 p-4.5 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xs group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform">
                    <ScaleIcon className="size-16 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between gap-1.5 relative z-10">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tích lũy</span>
                    <div className="size-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <ScaleIcon className="size-3.5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-3 relative z-10">
                    <h4 className="text-2xl font-black text-foreground tracking-tight">{insights.metrics.saving_rate}%</h4>
                    <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">lưu</span>
                  </div>
                </div>

                {/* Chi nhiều nhất */}
                <div className="rounded-2xl border bg-card/45 p-4.5 flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xs group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform">
                    <CoinsIcon className="size-16 text-primary" />
                  </div>
                  <div className="flex items-center justify-between gap-1.5 relative z-10">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Chi lớn nhất</span>
                    <div className="size-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <CoinsIcon className="size-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 min-w-0 relative z-10">
                    <div className="text-[10px] font-extrabold text-foreground truncate select-none">
                      {insights.metrics.most_spent_category}
                    </div>
                    <div className="text-xs font-black text-muted-foreground/90 truncate tracking-tight mt-0.5">
                      {formatVnd(insights.metrics.most_spent_amount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* LỜI KHUYÊN TÀI CHÍNH */}
              <div className="space-y-4.5">
                <div className="flex items-center gap-2 select-none pl-1">
                  <CoinsIcon className="size-5 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Lời khuyên tiết kiệm tài chính cá nhân hóa
                  </h3>
                </div>
                <div className="grid gap-4.5 grid-cols-1 md:grid-cols-2">
                  {insights.recommendations.map((rec: AIRecommendation, i: number) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border/80 bg-linear-to-br from-primary/5 via-card/80 to-card p-5.5 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/3 rounded-full blur-xl pointer-events-none group-hover:bg-primary/5 transition-colors" />
                      <div className="space-y-2.5 relative z-10">
                        <div className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors flex items-start justify-between gap-2.5">
                          <span className="line-clamp-1">{rec.title}</span>
                          <span className="inline-flex items-center shrink-0 gap-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5 select-none">
                            +{formatVnd(rec.potential_saving)}/thg
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
                          {rec.description}
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-border/40 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 group-hover:translate-x-1.5 transition-all duration-300">
                        Áp dụng giải pháp này ngay <ArrowRightIcon className="size-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* CỘT PHẢI (1/3 CỘT): PHÂN TÍCH DANH MỤC */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-border/80 bg-card/45 p-6 shadow-xs space-y-6 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 border-b pb-4.5 select-none relative z-10">
                  <BrainIcon className="size-5 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Phân tích tỷ trọng danh mục
                  </h3>
                </div>

                <div className="space-y-5.5 relative z-10">
                  {insights.categories_analysis.map((cat: AICategoryAnalysis, i: number) => {
                    const isHigh = cat.status === 'high';
                    const isLow = cat.status === 'low';
                    return (
                      <div key={i} className="space-y-2 group cursor-pointer">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-foreground/90 group-hover:text-primary transition-colors">{cat.category}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-muted-foreground font-extrabold tabular-nums">
                              {formatVnd(cat.amount)}
                            </span>
                            <span className={cn(
                              "inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest scale-90",
                              isHigh && "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                              isLow && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                              !isHigh && !isLow && "bg-muted text-muted-foreground border border-border/40"
                            )}>
                              {cat.status}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar gradient */}
                        <div className="relative w-full h-2 bg-muted/65 rounded-full overflow-hidden border border-border/10 shadow-inner">
                          <div
                            className={cn(
                              "absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out",
                              isHigh && "bg-linear-to-r from-rose-500 to-orange-400",
                              isLow && "bg-linear-to-r from-emerald-500 to-teal-400",
                              !isHigh && !isLow && "bg-linear-to-r from-blue-500 to-indigo-400"
                            )}
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                        <div className="text-[9.5px] text-muted-foreground/75 text-right font-bold group-hover:text-foreground transition-colors">
                          Chiếm {cat.percentage}% tổng chi tiêu
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* 4. CẢNH BÁO TÀI CHÍNH (ALERTS) - FULLWIDTH LAYOUT OUTSIDE THE GRID */}
          {insights.alerts && insights.alerts.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 select-none pl-1">
                <AlertTriangleIcon className="size-5 text-rose-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cảnh báo rủi ro & thói quen chi tiêu
                </h3>
              </div>
              <div className="flex flex-col gap-4.5">
                {insights.alerts.map((alert: AIAlert, i: number) => {
                  const isCritical = alert.type === 'critical';
                  const isWarning = alert.type === 'warning';
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl border p-5 flex gap-4 items-start relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group",
                        isCritical && "bg-linear-to-br from-rose-500/6 via-rose-500/1 to-card border-rose-500/20 text-rose-700 dark:text-rose-400 hover:border-rose-500/35",
                        isWarning && "bg-linear-to-br from-amber-500/6 via-amber-500/1 to-card border-amber-500/20 text-amber-700 dark:text-amber-400 hover:border-amber-500/35",
                        !isCritical && !isWarning && "bg-linear-to-br from-blue-500/6 via-blue-500/1 to-card border-blue-500/20 text-blue-700 dark:text-blue-400 hover:border-blue-500/35"
                      )}
                    >
                      {/* Thanh chỉ thị màu sắc bên trái dày hơn, bo góc tròn */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md",
                        isCritical && "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
                        isWarning && "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
                        !isCritical && !isWarning && "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      )} />

                      {/* Icon lớn chìm nhẹ ở background phía bên phải */}
                      <div className="absolute -right-6 -bottom-6 opacity-[0.03] select-none pointer-events-none transition-transform duration-500 group-hover:scale-110">
                        {isCritical && <AlertCircleIcon className="size-24 text-rose-500" />}
                        {isWarning && <AlertTriangleIcon className="size-24 text-amber-500" />}
                        {!isCritical && !isWarning && <InfoIcon className="size-24 text-blue-500" />}
                      </div>

                      {/* Icon đại diện góc trái */}
                      <div className={cn(
                        "shrink-0 mt-0.5 rounded-xl p-2 border shadow-xs relative overflow-hidden",
                        isCritical && "bg-rose-500/10 border-rose-500/20 text-rose-500",
                        isWarning && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                        !isCritical && !isWarning && "bg-blue-500/10 border-blue-500/20 text-blue-500"
                      )}>
                        {isCritical && <AlertCircleIcon className="size-4.5 text-rose-500 animate-pulse" />}
                        {isWarning && <AlertTriangleIcon className="size-4.5 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />}
                        {!isCritical && !isWarning && <InfoIcon className="size-4.5 text-blue-500" />}
                      </div>

                      {/* Phần nội dung */}
                      <div className="space-y-2 flex-1 min-w-0 relative z-10">
                        <div className="text-xs font-extrabold flex items-center justify-between gap-2.5">
                          <span className="text-foreground tracking-tight">{alert.category}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-inner",
                            isCritical && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                            isWarning && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                            !isCritical && !isWarning && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          )}>
                            {alert.type}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-foreground font-bold leading-relaxed">
                          {alert.message}
                        </p>

                        {/* Impact Widget kính mờ cao cấp */}
                        {alert.impact && (
                          <div className={cn(
                            "flex gap-2 items-start mt-2.5 p-3 rounded-xl border backdrop-blur-xs text-[11px] font-medium shadow-inner",
                            isCritical && "bg-rose-500/5 border-rose-500/10 text-rose-600/90 dark:text-rose-400/90",
                            isWarning && "bg-amber-500/5 border-amber-500/10 text-amber-600/90 dark:text-amber-400/90",
                            !isCritical && !isWarning && "bg-blue-500/5 border-blue-500/10 text-blue-600/90 dark:text-blue-400/90"
                          )}>
                            <Zap className="size-3.5 shrink-0 mt-0.5 animate-pulse text-amber-500" />
                            <div className="leading-relaxed">
                              <span className="font-extrabold uppercase tracking-wide mr-1 select-none text-foreground/90">Ảnh hưởng:</span>
                              {alert.impact}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* PANEL CHATBOT TƯƠNG TÁC - CHATBOX CAO CẤP NHƯ GEMINI */}
      {insights && (
        <div className="rounded-3xl border border-primary/10 bg-card/45 backdrop-blur-xl shadow-md overflow-hidden flex flex-col min-h-[500px] transition-all duration-300 hover:border-primary/15">
          {/* Header Chat */}
          <div className="border-b border-border/60 px-6 py-4.5 flex items-center justify-between bg-muted/15 select-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-primary/2 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner relative">
                {/* Pulsing indicator */}
                <div className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 border border-card animate-ping" />
                <div className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 border border-card" />
                <MessageSquareIcon className="size-4.5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  Trò chuyện với AI Tài chính
                </h3>
                <p className="text-[10px] text-muted-foreground/80">Đặt câu hỏi chuyên sâu về thói quen chi tiêu của bạn</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMessages([])}
                className="text-[10px] font-extrabold text-muted-foreground/80 hover:text-rose-500 rounded-lg px-2.5 h-7.5 hover:bg-rose-500/5 transition-all"
              >
                Xóa lịch sử chat
              </Button>
            )}
          </div>

          {/* Chat Messages Panel - Premium scrolling & Bubbles */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[350px] min-h-[250px] bg-linear-to-b from-card/10 via-background/20 to-card/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="size-14 rounded-full bg-muted/50 border flex items-center justify-center text-muted-foreground/35 shadow-inner">
                  <BotIcon className="size-7" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-xs font-bold text-foreground">Bạn có câu hỏi nào không?</p>
                  <p className="text-[11px] text-muted-foreground/75 leading-relaxed">
                    Hãy lựa chọn một câu hỏi gợi ý nhanh dưới đây hoặc tự nhập thắc mắc về tình hình chi tiêu của bạn để tôi trả lời.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3.5 max-w-[85%] sm:max-w-[78%] animate-in fade-in duration-300 slide-in-from-bottom-2",
                      isAI ? "self-start" : "ml-auto flex-row-reverse"
                    )}
                  >
                    {/* Avatar icon */}
                    <div className={cn(
                      "size-8.5 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-all",
                      isAI
                        ? "bg-primary/10 text-primary border-primary/20 animate-pulse-slow"
                        : "bg-muted text-muted-foreground border-border/60"
                    )}>
                      {isAI ? <BrainIcon className="size-4.5" /> : <span className="text-[10px] font-black uppercase">Me</span>}
                    </div>

                    {/* Bong bóng chat kính mờ */}
                    <div className={cn(
                      "rounded-2xl px-4.5 py-3 text-xs sm:text-sm shadow-xs border transition-all",
                      isAI
                        ? "bg-card/90 text-foreground border-border/80 rounded-tl-xs leading-relaxed"
                        : "bg-primary text-primary-foreground border-primary/20 rounded-tr-xs leading-relaxed font-semibold shadow-inner"
                    )}>
                      {isAI ? (
                        <div className="space-y-1.5">{renderMarkdown(msg.content)}</div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {chatMutation.isPending && (
              <div className="flex gap-3.5 max-w-[78%] self-start">
                <div className="size-8.5 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                  <BrainIcon className="size-4.5 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-xs px-4.5 py-3 bg-card/90 border border-border/80 text-xs sm:text-sm text-muted-foreground flex items-center gap-2 shadow-xs">
                  <div className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Trợ lý AI đang tính toán dữ liệu...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts List - Rounded Chip Pills */}
          {messages.length === 0 && (
            <div className="px-6 py-3.5 bg-muted/10 border-t border-border/40 select-none">
              <div className="flex flex-wrap gap-2.5">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[10.5px] text-muted-foreground/90 hover:text-primary bg-card/60 hover:bg-primary/5 border border-border/60 hover:border-primary/25 rounded-full px-3.5 py-1.5 transition-all duration-300 font-semibold cursor-pointer active:scale-97 hover:shadow-xs shadow-inner"
                    disabled={chatMutation.isPending}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Field - Elegant Bar */}
          <div className="p-4 border-t border-border/50 bg-muted/20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2.5"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Đặt câu hỏi (e.g. Tháng này tôi đã chi bao nhiêu cho di chuyển?)"
                className="flex-1 rounded-xl border border-border/60 bg-card/85 px-4.5 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/25 transition-all"
                disabled={chatMutation.isPending}
              />
              <Button
                type="submit"
                className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10 shrink-0 flex items-center justify-center p-3 size-10 transition-all hover:scale-103 active:scale-97 cursor-pointer"
                disabled={chatMutation.isPending || !inputMessage.trim()}
              >
                <SendIcon className="size-4.5" />
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
