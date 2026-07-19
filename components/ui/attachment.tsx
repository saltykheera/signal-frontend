"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done";
type AttachmentSize = "default" | "sm" | "xs";
type AttachmentOrientation = "horizontal" | "vertical";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function Attachment({ className, state = "done", size = "default", orientation = "horizontal", ...props }: React.ComponentProps<"div"> & { state?: AttachmentState; size?: AttachmentSize; orientation?: AttachmentOrientation }) {
  return <div data-slot="attachment" data-state={state} data-size={size} data-orientation={orientation} className={classes("shadcn-attachment", className)} {...props} />;
}

function AttachmentMedia({ className, variant = "icon", ...props }: React.ComponentProps<"div"> & { variant?: "icon" | "image" }) {
  return <div data-slot="attachment-media" data-variant={variant} className={classes("shadcn-attachment-media", className)} {...props} />;
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="attachment-content" className={classes("shadcn-attachment-content", className)} {...props} />;
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="attachment-title" className={classes("shadcn-attachment-title", className)} {...props} />;
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="attachment-description" className={classes("shadcn-attachment-description", className)} {...props} />;
}

function AttachmentActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="attachment-actions" className={classes("shadcn-attachment-actions", className)} {...props} />;
}

function AttachmentAction({ className, type = "button", ...props }: React.ComponentProps<"button">) {
  return <button data-slot="attachment-action" type={type} className={classes("shadcn-attachment-action", className)} {...props} />;
}

function AttachmentTrigger({ className, asChild = false, type, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component data-slot="attachment-trigger" type={asChild ? undefined : (type ?? "button")} className={classes("shadcn-attachment-trigger", className)} {...props} />;
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="attachment-group" className={classes("shadcn-attachment-group", className)} {...props} />;
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};
