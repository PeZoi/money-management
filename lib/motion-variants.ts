import type { Variants, Transition } from 'framer-motion';

// ─── Transition presets ──────────────────────────────────────────────────────

/** Spring mềm dùng cho hầu hết hiệu ứng xuất hiện */
export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
  mass: 0.8,
};

/** Spring nhanh cho micro-interactions (tap, hover) */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 22,
};

/** Tween mượt cho fade-in/out */
export const easeFade: Transition = {
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94],
};

// ─── Container variants (stagger children) ──────────────────────────────────

/** Container phân phối animation tuần tự cho children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/** Container với stagger chậm hơn cho các section lớn */
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// ─── Child item variants ─────────────────────────────────────────────────────

/** Hiệu ứng trượt lên + fade-in cho từng item trong stagger */
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: easeFade,
  },
};

/** Hiệu ứng trượt xuống + fade-in */
export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth,
  },
};

/** Hiệu ứng scale-in nhẹ + fade (cho cards, popups) */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/** Hiệu ứng fade đơn giản (cho biểu đồ, nội dung nặng) */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

/** Hiệu ứng trượt từ trái vào */
export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSmooth,
  },
};

/** Hiệu ứng trượt từ phải vào */
export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSmooth,
  },
};

// ─── Hover / Tap interactions ────────────────────────────────────────────────

/** Hover nổi nhẹ cho card interactable */
export const hoverLift = {
  scale: 1.02,
  y: -2,
  transition: springSnappy,
};

/** Tap co nhẹ cho feedback nhấn */
export const tapShrink = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

/** Hover nhẹ chỉ scale (cho icon, avatar) */
export const hoverScale = {
  scale: 1.05,
  transition: springSnappy,
};

// ─── Page-level animation ────────────────────────────────────────────────────

/** Animation wrapper cho toàn bộ nội dung một trang */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};
