'use client';

import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { List } from 'react-window';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Các export đặc biệt của lucide-react, không render như một icon đơn. */
const NON_ICON_KEYS = new Set(['Icon', 'createLucideIcon', 'LucideProvider']);

/** Khớp `grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7` (breakpoint Tailwind). */
function columnCountForWidth(containerWidth: number): number {
  if (containerWidth >= 1024) return 7;
  if (containerWidth >= 768) return 6;
  if (containerWidth >= 640) return 5;
  return 4;
}

/**
 * Lucide icon là `forwardRef` → runtime thường là object `{ $$typeof, render }`, không phải `function`.
 * Chỉ dùng `typeof === 'function'` sẽ loại hết icon → search luôn rỗng.
 */
function isLucideRenderableIcon(iconName: string, exported: unknown): exported is LucideIcon {
  if (NON_ICON_KEYS.has(iconName)) return false;
  if (!/^[A-Z]/.test(iconName)) return false;
  if (typeof exported === 'function') return true;
  if (
    exported !== null &&
    typeof exported === 'object' &&
    'render' in exported &&
    typeof (exported as { render: unknown }).render === 'function'
  ) {
    return true;
  }
  return false;
}

/** Dùng cho nút trigger (preview icon đã chọn). */
export function getLucideIconComponent(iconName: string | undefined): LucideIcon | null {
  if (!iconName) return null;
  const Cmp = Icons[iconName as keyof typeof Icons];
  return isLucideRenderableIcon(iconName, Cmp) ? (Cmp as LucideIcon) : null;
}

function dedupeIconNames(names: string[]) {
  const set = new Set(names);
  return names.filter((n) => {
    if (!n.endsWith('Icon')) return true;
    const base = n.slice(0, -4);
    return !(base.length > 0 && set.has(base));
  });
}

/** Lucide đặt tên icon bằng tiếng Anh — map không dấu (sau vnFold) → chuỗi con trong tên PascalCase của icon khi lowercase. */
const QUERY_SYNONYMS: Record<string, readonly string[]> = {
  tivi: ['tv', 'television', 'monitor', 'screen', 'display'],
  tv: ['tv', 'monitor', 'display', 'screen'],
  tien: ['wallet', 'cash', 'dollar', 'coin', 'banknote', 'bank', 'credit', 'coins', 'piggy', 'yen', 'euro'],
  tienmat: ['wallet', 'banknote', 'coins', 'bank'],
  vitien: ['wallet', 'coins', 'piggy', 'credit'],
  vidientu: ['qr', 'scan', 'contactless', 'wallet'],
  dienthoai: ['smartphone', 'phone', 'phonecall', 'voicemail', 'tablet'],
  laptop: ['laptop', 'computer', 'notebook', 'keyboard'],
  maytinh: ['laptop', 'computer', 'pc', 'monitor', 'keyboard', 'mouse'],
  xe: ['car', 'truck', 'bike', 'bus', 'fuel', 'parking'],
  xehoi: ['car', 'truck'],
  xemay: ['bike'],
  nha: ['home', 'house', 'building'],
  baocao: ['chart', 'pie', 'bar', 'trending', 'analytics'],
  giaodich: ['credit', 'receipt', 'swap', 'arrow', 'shuffle'],
  danhmuc: ['tag', 'folder', 'layers', 'bookmark'],
};

function vnFold(s: string): string {
  try {
    return s
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .trim();
  } catch {
    return s.toLowerCase().trim();
  }
}

/** Gom các chuỗi để khớp tên icon (latin + từ đồng nghĩa). */
function searchNeedlesForQuery(rawQuery: string): readonly string[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const out = new Set<string>();
  const qLower = trimmed.toLowerCase();
  const folded = vnFold(trimmed).replace(/\s+/g, ' ');
  const compact = folded.replace(/\s+/g, '');

  const addSynonyms = (key: string) => {
    const list = QUERY_SYNONYMS[key];
    if (!list?.length) return;
    list.forEach((x) => {
      const t = x.trim().toLowerCase();
      const norm = t.replace(/-/g, '');
      out.add(t);
      if (norm !== t && norm.length) out.add(norm);
    });
  };

  ;[folded, compact].forEach(addSynonyms);
  folded.split(/\s+/).forEach((token) => {
    addSynonyms(token);
  });

  if (QUERY_SYNONYMS[qLower]?.length) addSynonyms(qLower);

  out.add(qLower);
  if (compact !== qLower && compact.length) out.add(compact);

  return [...out];
}

function iconMatchesQuery(iconName: string, rawQuery: string): boolean {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;
  const nameLower = iconName.toLowerCase().replace(/-/g, '');
  const qLower = trimmed.toLowerCase().replace(/-/g, '');
  if (nameLower.includes(qLower)) return true;

  const needles = searchNeedlesForQuery(trimmed).filter(Boolean);
  return needles.some((n) => {
    const nn = n.replace(/-/g, '').toLowerCase();
    return nn.length >= 2 && nameLower.includes(nn);
  });
}

type IconRowProps = {
  iconNames: string[];
  columnCount: number;
  selected: string | null;
  onPick: (iconName: string) => void;
};

function IconPickerFlexRow({
  ariaAttributes,
  index,
  style,
  iconNames,
  columnCount,
  selected,
  onPick,
}: {
  ariaAttributes: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' };
  index: number;
  style: CSSProperties;
} & IconRowProps) {
  const start = index * columnCount;
  const rowIconNames: string[] = [];
  for (let c = 0; c < columnCount; c += 1) {
    const i = start + c;
    if (i >= iconNames.length) break;
    rowIconNames.push(iconNames[i]!);
  }

  const isFullRow = rowIconNames.length === columnCount;

  return (
    <div
      {...ariaAttributes}
      style={style}
      className={cn(
        'box-border flex w-full min-w-0 flex-row gap-2 px-0.5',
        isFullRow ? 'justify-between' : 'justify-start',
      )}
    >
      {rowIconNames.map((iconName) => {
        const Cmp = Icons[iconName as keyof typeof Icons];
        if (!isLucideRenderableIcon(iconName, Cmp)) return null;
        const active = selected === iconName;
        return (
          <div
            key={iconName}
            className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch justify-center"
          >
            <button
              type="button"
              onClick={() => onPick(iconName)}
              className={cn(
                'box-border flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 pt-1 pb-0.5 transition-all hover:bg-muted active:scale-[0.98]',
                active
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-border',
              )}
            >
              <Cmp className="pointer-events-none size-[18px] shrink-0" aria-hidden />
              <span className="line-clamp-1 w-full max-w-full text-center text-[8px] leading-none opacity-80 sm:text-[9px]">
                {iconName}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function useViewportHeight() {
  const [h, setH] = useState(600);

  useLayoutEffect(() => {
    const update = () => setH(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return h;
}

/** Chiều ngang thực cho con (trừ padding), tránh lưới rộng hơn khung → scroll ngang. */
function contentBoxInnerWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  return Math.max(0, Math.floor(el.clientWidth - padX));
}

function IconVirtualGrid({
  iconNames,
  selected,
  onPick,
  listKey,
}: {
  iconNames: string[];
  selected?: string | null;
  onPick: (iconName: string) => void;
  listKey: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [innerWidth, setInnerWidth] = useState(0);
  const viewportH = useViewportHeight();

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const read = () => setInnerWidth(contentBoxInnerWidth(el));
    read();
    const ro = new ResizeObserver(() => read());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columnCount = useMemo(() => columnCountForWidth(innerWidth), [innerWidth]);
  const usableW = Math.max(0, innerWidth);

  /** Chiều cao mỗi hàng flex (icon + nhãn), gắn với độ rộng cột ước lượng. */
  const rowHeightPx = useMemo(() => {
    if (columnCount <= 0 || usableW <= 0) return 72;
    const q = Math.floor(usableW / columnCount);
    return Math.min(96, Math.max(56, q + 16));
  }, [columnCount, usableW]);

  const rowCount =
    columnCount > 0 ? Math.max(1, Math.ceil(iconNames.length / columnCount)) : 1;

  /** Mobile: thấp hơn một chút; desktop: cao hơn — cùng công thức theo viewport. */
  const gridHeight = Math.min(520, Math.max(260, Math.round(viewportH * (innerWidth < 640 ? 0.42 : 0.5))));

  const rowProps: IconRowProps = useMemo(
    () => ({
      iconNames,
      columnCount,
      selected: selected ?? null,
      onPick,
    }),
    [iconNames, columnCount, selected, onPick],
  );

  return (
    <div
      ref={hostRef}
      className="min-w-0 w-full max-w-full overflow-x-hidden rounded-xl border border-border/60 bg-muted/5 p-1.5 sm:p-2"
      aria-label="Danh sách icon"
    >
      {innerWidth > 0 ? (
        <div className="min-w-0 w-full max-w-full overflow-x-hidden">
          <List
            key={listKey}
            className="min-w-0 w-full max-w-full overflow-x-hidden rounded-lg"
            rowCount={rowCount}
            rowHeight={rowHeightPx}
            rowComponent={IconPickerFlexRow}
            rowProps={rowProps}
            overscanCount={innerWidth < 640 ? 2 : 4}
            defaultHeight={gridHeight}
            style={{
              height: gridHeight,
              width: '100%',
              maxWidth: '100%',
              overflowX: 'hidden',
            }}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-sm text-muted-foreground"
          style={{ minHeight: Math.min(400, gridHeight) }}
        >
          Đang chuẩn bị danh sách…
        </div>
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Tổng <span className="font-medium">{iconNames.length}</span> icon — cuộn trong khung để xem
      </p>
    </div>
  );
}

type Props = {
  value?: string;
  onChange?: (iconName: string) => void;
};

export default function IconPicker(props: Props) {
  const { onChange } = props;
  const controlledByParent = Object.prototype.hasOwnProperty.call(props, 'value');
  const valueFromParent = controlledByParent ? props.value : undefined;

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [picked, setPicked] = useState<string>();

  const selected = controlledByParent ? (valueFromParent ?? picked) : picked;

  const iconNames = useMemo(() => {
    const keys = Object.keys(Icons) as Array<keyof typeof Icons>;
    const rawSearch = deferredSearch.trim();

    const renderableKeys = keys
      .filter((key) => isLucideRenderableIcon(String(key), Icons[key]))
      .map(String)
      .sort((a, b) => a.localeCompare(b));

    const filtered = rawSearch
      ? renderableKeys.filter((name) => iconMatchesQuery(name, rawSearch))
      : renderableKeys;

    return dedupeIconNames(filtered);
  }, [deferredSearch]);

  const SelectedIcon =
    selected != null &&
    selected !== '' &&
    isLucideRenderableIcon(selected, Icons[selected as keyof typeof Icons])
      ? (Icons[selected as keyof typeof Icons] as LucideIcon)
      : null;

  function handlePick(iconName: string) {
    setPicked(iconName);
    onChange?.(iconName);
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden rounded-2xl border bg-card p-3 text-card-foreground sm:p-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Ví dụ: tivi, tiền, wallet, tv…"
        autoComplete="off"
        aria-label="Tìm icon"
        className="mb-3 min-w-0 max-w-full rounded-xl text-base sm:mb-4 sm:text-sm"
      />

      {selected ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 sm:mb-4">
          {SelectedIcon ? <SelectedIcon className="size-[18px] shrink-0" aria-hidden /> : null}
          <span className="truncate font-mono text-sm">{selected}</span>
        </div>
      ) : null}

      {!iconNames.length ? (
        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <p>Không tìm thấy icon phù hợp.</p>
          <p>
            Icon Lucide đặt tên bằng tiếng Anh. Có thể thử{' '}
            <span className="font-mono font-medium text-foreground">tv</span>,{' '}
            <span className="font-mono font-medium text-foreground">monitor</span>,{' '}
            <span className="font-mono font-medium text-foreground">wallet</span>…
          </p>
        </div>
      ) : (
        <IconVirtualGrid
          listKey={deferredSearch}
          iconNames={iconNames}
          selected={selected}
          onPick={handlePick}
        />
      )}
    </div>
  );
}
