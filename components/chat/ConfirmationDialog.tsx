"use client";

type ConfirmationDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationDialog({ title, description, confirmLabel, onCancel, onConfirm }: ConfirmationDialogProps) {
  return <div className="confirmation-backdrop" role="presentation">
    <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmation-dialog-title">
      <h2 id="confirmation-dialog-title">{title}</h2>
      <p>{description}</p>
      <div><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="confirmation-dialog-confirm" onClick={onConfirm}>{confirmLabel}</button></div>
    </section>
  </div>;
}
