import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  icon?: ReactNode;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  icon,
  description,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {/* {icon ? (
            <div className="app-panel-muted flex size-12 items-center justify-center rounded-2xl">
              {icon}
            </div>
          ) : null} */}
          <div>
            <p className="app-kicker">Tournament View</p>
            <h1 className="font-display text-3xl tracking-[0.16em] text-white sm:text-4xl">
              {title}
            </h1>
          </div>
        </div>
        {/* {description && (
          <p className="max-w-2xl text-sm leading-6 text-white/52">
            {description}
          </p>
        )} */}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
