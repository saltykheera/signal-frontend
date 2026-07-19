"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

type BubbleVariant = "default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive";
type BubbleAlign = "start" | "end";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="bubble-group" className={classes("shadcn-bubble-group", className)} {...props} />;
}

function Bubble({ variant = "default", align = "start", className, ...props }: React.ComponentProps<"div"> & { variant?: BubbleVariant; align?: BubbleAlign }) {
  return <div data-slot="bubble" data-variant={variant} data-align={align} className={classes("shadcn-bubble", className)} {...props} />;
}

function BubbleContent({ asChild = false, className, ...props }: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "div";
  return <Component data-slot="bubble-content" className={classes("shadcn-bubble-content", className)} {...props} />;
}

function BubbleReactions({ side = "bottom", align = "end", className, ...props }: React.ComponentProps<"div"> & { side?: "top" | "bottom"; align?: BubbleAlign }) {
  return <div data-slot="bubble-reactions" data-side={side} data-align={align} className={classes("shadcn-bubble-reactions", className)} {...props} />;
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
