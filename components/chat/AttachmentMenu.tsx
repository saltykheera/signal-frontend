"use client";

import { Icon } from "@/components/ui/Icon";

type AttachmentMenuProps = {
  onPhotos: () => void;
  onFile: () => void;
};

export function AttachmentMenu({ onPhotos, onFile }: AttachmentMenuProps) {
  return <div className="attachment-menu" role="menu" aria-label="Add attachment">
    <button type="button" role="menuitem" onClick={onPhotos}><Icon name="photo" size={18} /><span>Photos &amp; videos</span></button>
    <button type="button" role="menuitem" onClick={onFile}><Icon name="file" size={18} /><span>File</span></button>
  </div>;
}
