'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

// Format: { [key in string]: { label?: React.ReactNode; icon?: React.ComponentType; color?: string; theme?: Record<string, string> } }
export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ReactElement<any>;
  }
>(({ id, className, config, children, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-grid-horizontal_line]:stroke-border/50 [&_.recharts-cartesian-grid-vertical_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot]:stroke-background [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid-angle_line]:stroke-border [&_.recharts-polar-grid-concentric-polygon]:stroke-border [&_.recharts-polar-grid-concentric-value_circle]:stroke-border [&_.recharts-radar-g_path]:fill-foreground/10 [&_.recharts-radar-g_path]:stroke-foreground [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-sector.recharts-tooltip-cursor]:fill-muted [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:overflow-visible",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {React.cloneElement(children, { id: chartId })}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'ChartContainer';

// ChartStyle để render CSS variables cho các màu sắc
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.color || config.theme
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        #${id} {
          ${colorConfig
            .map(([key, item]) => {
              const color = item.color;
              return color ? `--color-${key}: ${color};` : null;
            })
            .filter(Boolean)
            .join('\n')}
        }
      `,
      }}
    />
  );
};

export type ChartPayloadItem = {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
  color?: string;
  payload?: {
    fill?: string;
    [key: string]: unknown;
  };
};

function sanitizeDivProps(props: Record<string, unknown>) {
  const cleanProps: Record<string, unknown> = {};
  const validKeys = ['className', 'style', 'id', 'role', 'tabIndex'];
  
  Object.keys(props).forEach((key) => {
    if (
      validKeys.includes(key) ||
      key.startsWith('on') ||
      key.startsWith('aria-') ||
      key.startsWith('data-')
    ) {
      cleanProps[key] = props[key];
    }
  });
  
  return cleanProps;
}

// ChartTooltip và ChartTooltipContent
export const ChartTooltip = RechartsPrimitive.Tooltip;

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    active?: boolean;
    payload?: ChartPayloadItem[];
    label?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      active,
      payload,
      label,
      hideLabel = false,
      hideIndicator = false,
      indicator = 'dot',
      nameKey,
      labelKey,
      className,
      ...props
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || 'value'}`;
      const itemConfig = config[key];
      const value =
        itemConfig?.label || (typeof label === 'string' ? label : '');

      return (
        <div className="font-semibold text-xs text-foreground/80 mb-1">{value}</div>
      );
    }, [label, labelKey, payload, hideLabel, config]);

    if (!active || !payload?.length) {
      return null;
    }

    // Lọc sạch các props tự động inject của Recharts để tránh cảnh báo React DOM element
    const divProps = sanitizeDivProps(props);

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border/50 bg-background/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1.5 min-w-[9rem] animate-in fade-in zoom-in-95 duration-100",
          className
        )}
        {...divProps}
      >
        {tooltipLabel}
        <div className="space-y-1.5">
          {payload.map((item) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`;
            const itemConfig = config[key];
            const indicatorColor = item.payload?.fill || item.color;

            return (
              <div
                key={item.dataKey}
                className="flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  {!hideIndicator && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full",
                        indicator === 'dot' && 'size-2',
                        indicator === 'line' && 'h-0.5 w-3.5',
                        indicator === 'dashed' && 'h-0.5 w-3.5 border-t border-dashed'
                      )}
                      style={{ backgroundColor: indicatorColor }}
                    />
                  )}
                  <span>{itemConfig?.label || item.name}</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {Number(item.value).toLocaleString('vi-VN')}₫
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

// ChartLegend và ChartLegendContent
export const ChartLegend = RechartsPrimitive.Legend;

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    payload?: ChartPayloadItem[];
    verticalAlign?: 'top' | 'bottom';
    nameKey?: string;
  }
>(({ payload, nameKey, className, ...props }, ref) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  // Lọc sạch các props tự động inject của Recharts để tránh cảnh báo React DOM element
  const divProps = sanitizeDivProps(props);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground pt-4",
        className
      )}
      {...divProps}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.value || item.dataKey || 'value'}`;
        const itemConfig = config[key];
        const color = itemConfig?.color || item.color;

        return (
          <div key={key} className="flex items-center gap-1.5 transition-opacity hover:opacity-80 cursor-pointer">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-foreground/80">{itemConfig?.label || item.value}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = 'ChartLegendContent';
