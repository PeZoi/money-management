"use client"

import { Toaster as Sonner } from "sonner"
import { CheckCircle2Icon, AlertTriangleIcon, XCircleIcon, InfoIcon, Loader2Icon } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-center"
      icons={{
        success: <CheckCircle2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        error: <XCircleIcon className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />,
        warning: <AlertTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
        info: <InfoIcon className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />,
        loading: <Loader2Icon className="h-5 w-5 animate-spin text-zinc-500 dark:text-zinc-400 shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:border group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-3 group-[.toaster]:w-full group-[.toaster]:backdrop-blur-md",
          title: "group-[.toast]:font-semibold group-[.toast]:text-[14px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[13px] group-[.toast]:mt-0.5",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:!bg-emerald-50/95 dark:group-[.toaster]:!bg-emerald-950/20 group-[.toaster]:!text-emerald-900 dark:group-[.toaster]:!text-emerald-50 group-[.toaster]:!border-emerald-200/80 dark:group-[.toaster]:!border-emerald-900/30 group-[.toaster]:!shadow-[0_8px_30px_rgba(16,185,129,0.12)] dark:group-[.toaster]:!shadow-[0_8px_30px_rgba(16,185,129,0.06)]",
          error:
            "group-[.toaster]:!bg-rose-50/95 dark:group-[.toaster]:!bg-rose-950/20 group-[.toaster]:!text-rose-900 dark:group-[.toaster]:!text-rose-50 group-[.toaster]:!border-rose-200/80 dark:group-[.toaster]:!border-rose-900/30 group-[.toaster]:!shadow-[0_8px_30px_rgba(244,63,94,0.12)] dark:group-[.toaster]:!shadow-[0_8px_30px_rgba(244,63,94,0.06)]",
          warning:
            "group-[.toaster]:!bg-amber-50/95 dark:group-[.toaster]:!bg-amber-950/20 group-[.toaster]:!text-amber-900 dark:group-[.toaster]:!text-amber-50 group-[.toaster]:!border-amber-200/80 dark:group-[.toaster]:!border-amber-900/30 group-[.toaster]:!shadow-[0_8px_30px_rgba(245,158,11,0.12)] dark:group-[.toaster]:!shadow-[0_8px_30px_rgba(245,158,11,0.06)]",
          info:
            "group-[.toaster]:!bg-sky-50/95 dark:group-[.toaster]:!bg-sky-950/20 group-[.toaster]:!text-sky-900 dark:group-[.toaster]:!text-sky-50 group-[.toaster]:!border-sky-200/80 dark:group-[.toaster]:!border-sky-900/30 group-[.toaster]:!shadow-[0_8px_30px_rgba(14,165,233,0.12)] dark:group-[.toaster]:!shadow-[0_8px_30px_rgba(14,165,233,0.06)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
