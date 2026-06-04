export const OLD_ICON_MAP: Record<string, string> = {
  'Heart': '❤️',
  'Camera': '📸',
  'Plane': '✈️',
  'Gift': '🎁',
  'Coffee': '☕',
  'Utensils': '🍜',
  'MapPin': '📍',
  'Sparkles': '✨'
};

export const MILESTONE_ICONS = [
  { name: '❤️', label: 'Tình yêu' },
  { name: '📸', label: 'Chụp ảnh' },
  { name: '✈️', label: 'Du lịch' },
  { name: '🎁', label: 'Quà tặng' },
  { name: '☕', label: 'Hẹn hò' },
  { name: '🍜', label: 'Ăn uống' },
  { name: '📍', label: 'Địa điểm' },
  { name: '✨', label: 'Đặc biệt' },
];

export interface LoveTheme {
  name: string;
  primary: string;
  text: string;
  textHover: string;
  textMuted: string;
  bg: string;
  bgHover: string;
  bgLight: string;
  border: string;
  borderTimeline: string;
  pulseColor: string;
  pulseBorder: string;
  timelineIconBg: string;
  ringFocus: string;
  ringFocusCalendar: string;
  avatarBg: string;
  avatarBorder: string;
  borderHover: string;
  textRoseColor: string;
  fillColor: string;
  progressStroke: string;
  progressBg: string;
  dayGradient: string;
  cardBg: string;
  pulseLine: string;
  textOnBg: string;
  pulseColorOnBg: string;
  pulseLineOnBg: string;
  timelineLineGradient: string;
  timelineIconBgGradient: string;
}

export interface LoveConnection {
  connection_id: string;
  anniversary_date: string;
  background_url: string | null;
  theme: string | null;
  partner_name: string;
  partner_avatar_url: string | null;
  partner_birthdate: string | null;
  is_user_1?: boolean;
  user_1_avatar_url: string | null;
  user_2_avatar_url: string | null;
  user_1_nickname: string | null;
  user_2_nickname: string | null;
  user_1_birthdate: string | null;
  user_2_birthdate: string | null;
}

export const THEMES: Record<string, LoveTheme> = {
  rose: {
    name: 'Hồng Rose',
    primary: '#f43f5e',
    text: 'text-rose-600 dark:text-rose-400',
    textHover: 'hover:text-rose-500',
    textMuted: 'text-rose-800 dark:text-rose-200',
    bg: 'bg-rose-500 text-white',
    bgHover: 'hover:bg-rose-600',
    bgLight: 'bg-rose-50/70 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900/30',
    borderTimeline: 'border-rose-200 dark:border-rose-900/50',
    pulseColor: 'text-rose-500 fill-rose-500 bg-rose-100 dark:bg-rose-950/60',
    pulseBorder: 'border-rose-200/50 dark:border-rose-900/50',
    timelineIconBg: 'bg-rose-50 dark:bg-rose-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-rose-500/20',
    avatarBg: 'bg-rose-100 dark:bg-rose-950',
    avatarBorder: 'border-rose-400 hover:border-rose-500',
    borderHover: 'hover:border-rose-200/80 dark:hover:border-rose-900/60',
    textRoseColor: 'text-rose-500',
    fillColor: 'fill-rose-500',
    progressStroke: 'stroke-rose-500',
    progressBg: 'stroke-rose-100 dark:stroke-rose-950/20',
    dayGradient: 'from-rose-500 via-pink-500 to-rose-600',
    cardBg: 'from-rose-500/10 via-rose-500/5 to-background border-rose-200/50 dark:border-rose-900/30',
    pulseLine: 'from-rose-400 via-rose-300 to-rose-400',
    textOnBg: 'text-rose-400',
    pulseColorOnBg: 'text-rose-400 fill-rose-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-rose-400/40 via-rose-400/10 to-rose-400/40',
    timelineLineGradient: 'from-rose-500/80 via-pink-400/40 to-rose-300/10',
    timelineIconBgGradient: 'from-rose-500 via-pink-500 to-rose-600 shadow-md shadow-rose-500/35 dark:shadow-rose-950/50',
  },
  primary: {
    name: 'Xanh Lá Primary',
    primary: '#16a34a',
    text: 'text-primary',
    textHover: 'hover:text-primary',
    textMuted: 'text-primary/80 dark:text-primary/70',
    bg: 'bg-primary text-primary-foreground font-semibold',
    bgHover: 'hover:bg-primary/95',
    bgLight: 'bg-primary/10 dark:bg-primary/5',
    border: 'border-primary/20',
    borderTimeline: 'border-primary/30',
    pulseColor: 'text-primary fill-primary bg-primary/10 dark:bg-primary/20',
    pulseBorder: 'border-primary/25',
    timelineIconBg: 'bg-primary/10 dark:bg-primary/5',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
    ringFocusCalendar: 'focus:ring-2 focus:ring-primary/20',
    avatarBg: 'bg-primary/20 dark:bg-primary/30',
    avatarBorder: 'border-primary/60 hover:border-primary',
    borderHover: 'hover:border-primary/50',
    textRoseColor: 'text-primary',
    fillColor: 'fill-primary',
    progressStroke: 'stroke-primary',
    progressBg: 'stroke-primary/10 dark:stroke-primary/5',
    dayGradient: 'from-emerald-500 to-green-600',
    cardBg: 'from-primary/10 via-primary/5 to-background border-primary/20',
    pulseLine: 'from-primary/70 via-primary/40 to-primary/70',
    textOnBg: 'text-emerald-400 dark:text-emerald-400',
    pulseColorOnBg: 'text-emerald-400 fill-emerald-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-emerald-400/40 via-emerald-400/10 to-emerald-400/40',
    timelineLineGradient: 'from-primary/80 via-emerald-500/40 to-emerald-300/10',
    timelineIconBgGradient: 'from-emerald-500 via-green-500 to-emerald-600 shadow-md shadow-emerald-500/35 dark:shadow-emerald-950/50',
  },
  ocean: {
    name: 'Xanh Dương Ocean',
    primary: '#0ea5e9',
    text: 'text-sky-600 dark:text-sky-400',
    textHover: 'hover:text-sky-500',
    textMuted: 'text-sky-800 dark:text-sky-200',
    bg: 'bg-sky-500 text-white',
    bgHover: 'hover:bg-sky-600',
    bgLight: 'bg-sky-50/70 dark:bg-sky-950/30',
    border: 'border-sky-100 dark:border-sky-900/30',
    borderTimeline: 'border-sky-200 dark:border-sky-900/50',
    pulseColor: 'text-sky-500 fill-sky-500 bg-sky-100 dark:bg-sky-950/60',
    pulseBorder: 'border-sky-200/50 dark:border-sky-900/50',
    timelineIconBg: 'bg-sky-50 dark:bg-sky-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:border-sky-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-sky-500/20',
    avatarBg: 'bg-sky-100 dark:bg-sky-950',
    avatarBorder: 'border-sky-400 hover:border-sky-500',
    borderHover: 'hover:border-sky-200/80 dark:hover:border-sky-900/60',
    textRoseColor: 'text-sky-500',
    fillColor: 'fill-sky-500',
    progressStroke: 'stroke-sky-500',
    progressBg: 'stroke-sky-100 dark:stroke-sky-950/20',
    dayGradient: 'from-sky-500 via-blue-500 to-indigo-500',
    cardBg: 'from-sky-500/10 via-sky-500/5 to-background border-sky-200/50 dark:border-sky-900/30',
    pulseLine: 'from-sky-400 via-sky-300 to-sky-400',
    textOnBg: 'text-sky-400',
    pulseColorOnBg: 'text-sky-400 fill-sky-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-sky-400/40 via-sky-400/10 to-sky-400/40',
    timelineLineGradient: 'from-sky-500/80 via-blue-400/40 to-indigo-300/10',
    timelineIconBgGradient: 'from-sky-500 via-blue-500 to-sky-600 shadow-md shadow-sky-500/35 dark:shadow-sky-950/50',
  },
  lavender: {
    name: 'Tím Lavender',
    primary: '#a855f7',
    text: 'text-purple-600 dark:text-purple-400',
    textHover: 'hover:text-purple-500',
    textMuted: 'text-purple-800 dark:text-purple-200',
    bg: 'bg-purple-500 text-white',
    bgHover: 'hover:bg-purple-600',
    bgLight: 'bg-purple-50/70 dark:bg-purple-950/30',
    border: 'border-purple-100 dark:border-purple-900/30',
    borderTimeline: 'border-purple-200 dark:border-purple-900/50',
    pulseColor: 'text-purple-500 fill-purple-500 bg-purple-100 dark:bg-purple-950/60',
    pulseBorder: 'border-purple-200/50 dark:border-purple-900/50',
    timelineIconBg: 'bg-purple-50 dark:bg-purple-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-purple-500/20',
    avatarBg: 'bg-purple-100 dark:bg-purple-950',
    avatarBorder: 'border-purple-400 hover:border-purple-500',
    borderHover: 'hover:border-purple-200/80 dark:hover:border-purple-900/60',
    textRoseColor: 'text-purple-500',
    fillColor: 'fill-purple-500',
    progressStroke: 'stroke-purple-500',
    progressBg: 'stroke-purple-100 dark:stroke-purple-950/20',
    dayGradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    cardBg: 'from-purple-500/10 via-purple-500/5 to-background border-purple-200/50 dark:border-purple-900/30',
    pulseLine: 'from-purple-400 via-purple-300 to-purple-400',
    textOnBg: 'text-purple-400',
    pulseColorOnBg: 'text-purple-400 fill-purple-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-purple-400/40 via-purple-400/10 to-rose-400/40',
    timelineLineGradient: 'from-purple-500/80 via-fuchsia-400/40 to-pink-300/10',
    timelineIconBgGradient: 'from-purple-500 via-fuchsia-500 to-purple-600 shadow-md shadow-purple-500/35 dark:shadow-purple-950/50',
  },
  sunset: {
    name: 'Cam Sunset',
    primary: '#f97316',
    text: 'text-orange-600 dark:text-orange-400',
    textHover: 'hover:text-orange-500',
    textMuted: 'text-orange-800 dark:text-orange-200',
    bg: 'bg-orange-500 text-white',
    bgHover: 'hover:bg-orange-600',
    bgLight: 'bg-orange-50/70 dark:bg-orange-950/30',
    border: 'border-orange-100 dark:border-orange-900/30',
    borderTimeline: 'border-orange-200 dark:border-orange-900/50',
    pulseColor: 'text-orange-500 fill-orange-500 bg-orange-100 dark:bg-orange-950/60',
    pulseBorder: 'border-orange-200/50 dark:border-orange-900/50',
    timelineIconBg: 'bg-orange-50 dark:bg-orange-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-orange-500/20',
    avatarBg: 'bg-orange-100 dark:bg-orange-950',
    avatarBorder: 'border-orange-400 hover:border-orange-500',
    borderHover: 'hover:border-orange-200/80 dark:hover:border-rose-900/60',
    textRoseColor: 'text-orange-500',
    fillColor: 'fill-orange-500',
    progressStroke: 'stroke-orange-500',
    progressBg: 'stroke-orange-100 dark:stroke-orange-950/20',
    dayGradient: 'from-orange-500 via-amber-500 to-yellow-500',
    cardBg: 'from-orange-500/10 via-orange-500/5 to-background border-orange-200/50 dark:border-orange-900/30',
    pulseLine: 'from-orange-400 via-orange-300 to-orange-400',
    textOnBg: 'text-orange-400',
    pulseColorOnBg: 'text-orange-400 fill-orange-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-orange-400/40 via-orange-400/10 to-orange-400/40',
    timelineLineGradient: 'from-orange-500/80 via-amber-400/40 to-yellow-300/10',
    timelineIconBgGradient: 'from-orange-500 via-amber-500 to-orange-600 shadow-md shadow-orange-500/35 dark:shadow-orange-950/50',
  }
};

export type LoveThemeType = 'rose' | 'primary' | 'ocean' | 'lavender' | 'sunset';
