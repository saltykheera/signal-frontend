"use client";
/* eslint-disable @next/next/no-img-element -- attachment URLs can be local previews or backend uploads */

import { FileArchiveIcon, FileIcon, FileTextIcon, ImageIcon, VideoIcon, XIcon } from "lucide-react";
import { API_BASE } from "@/lib/api";
import type { ApiAttachment } from "@/types/messenger";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";

type MessageAttachmentProps = {
  attachment?: ApiAttachment;
  file?: File;
  previewUrl?: string | null;
  messageType?: "text" | "image" | "file" | "video";
  state?: "idle" | "uploading" | "processing" | "error" | "done";
  onRemove?: () => void;
};

function formatFileSize(size: number | null | undefined) {
  if (size === null || size === undefined) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(name: string, mime: string | null | undefined) {
  if (mime?.startsWith("image/")) return "Image";
  if (mime?.startsWith("video/")) return "Video";
  const extension = name.split(".").pop();
  return extension && extension !== name ? extension.toUpperCase() : "File";
}

function FileTypeIcon({ name, mime, messageType }: { name: string; mime?: string | null; messageType?: MessageAttachmentProps["messageType"] }) {
  if (messageType === "image" || mime?.startsWith("image/")) return <ImageIcon />;
  if (messageType === "video" || mime?.startsWith("video/")) return <VideoIcon />;
  if (mime?.includes("zip") || mime?.includes("archive")) return <FileArchiveIcon />;
  if (mime?.startsWith("text/") || /\.(pdf|docx?|txt|md)$/i.test(name)) return <FileTextIcon />;
  return <FileIcon />;
}

export function MessageAttachment({ attachment, file, previewUrl, messageType, state = "done", onRemove }: MessageAttachmentProps) {
  const name = file?.name || attachment?.file_name || "Attachment";
  const mime = file?.type || attachment?.mime_type;
  const size = file?.size ?? attachment?.file_size;
  const isImage = messageType === "image" || mime?.startsWith("image/");
  const remoteUrl = attachment?.file_url
    ? (/^https?:\/\//i.test(attachment.file_url) ? attachment.file_url : `${API_BASE}${attachment.file_url}`)
    : null;
  const url = previewUrl || remoteUrl;
  const status = state === "uploading" ? "Uploading…" : state === "processing" ? "Processing…" : state === "error" ? "Upload failed" : fileKind(name, mime);
  const description = [status, formatFileSize(size)].filter(Boolean).join(" · ");
  const showDetails = !isImage;

  return <Attachment className="message-attachment-card" state={state} size="sm" orientation={isImage ? "vertical" : "horizontal"}>
    <AttachmentMedia variant={isImage && url ? "image" : "icon"}>
      {isImage && url ? <img src={url} alt={name} /> : <FileTypeIcon name={name} mime={mime} messageType={messageType} />}
    </AttachmentMedia>
    {showDetails && <AttachmentContent>
      <AttachmentTitle>{name}</AttachmentTitle>
      <AttachmentDescription>{description}</AttachmentDescription>
    </AttachmentContent>}
    {onRemove && <AttachmentActions><AttachmentAction onClick={onRemove} aria-label={`Remove ${name}`}><XIcon /></AttachmentAction></AttachmentActions>}
    {remoteUrl && <AttachmentTrigger asChild><a href={remoteUrl} target="_blank" rel="noreferrer" aria-label={`Open ${name}`} /></AttachmentTrigger>}
  </Attachment>;
}
