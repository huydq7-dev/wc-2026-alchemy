import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-grid w-fit grid-flow-col auto-cols-fr items-center rounded-xl p-1 text-muted-foreground group-data-[orientation=horizontal]/tabs:h-10 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:grid-flow-row group-data-[orientation=vertical]/tabs:auto-rows-fr data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#141929] border border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        line: "gap-2 bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex min-h-8 w-full cursor-pointer select-none items-center justify-center self-stretch gap-1.5 rounded-lg border border-transparent px-3 text-sm font-medium whitespace-nowrap text-white/65 transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 group-data-[orientation=vertical]/tabs:justify-start focus-visible:border-white/20 focus-visible:ring-[3px] focus-visible:ring-white/15 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "hover:bg-white/6 hover:text-white hover:border-white/8 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
        "data-[state=active]:bg-white data-[state=active]:text-[#0A0E1A] data-[state=active]:border-white data-[state=active]:shadow-[0_10px_30px_rgba(0,0,0,0.28)]",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:py-2 group-data-[variant=line]/tabs-list:hover:bg-transparent group-data-[variant=line]/tabs-list:hover:border-transparent group-data-[variant=line]/tabs-list:hover:shadow-none group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent group-data-[variant=line]/tabs-list:data-[state=active]:text-white group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none",
        "after:absolute after:rounded-full after:bg-[#C8102E] after:opacity-0 after:transition-all after:duration-200 group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-2px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:hover:after:opacity-50 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
