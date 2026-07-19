"use client";

type DeleteMessageDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteMessageDialog({ onCancel, onConfirm }: DeleteMessageDialogProps) {
  return <div className="delete-message-backdrop" role="presentation">
    <section className="delete-message-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-message-title">
      <h2 id="delete-message-title">Delete selected message?</h2>
      <p>This message will be deleted from all your devices.</p>
      <div><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="delete-message-confirm" onClick={onConfirm}>Delete</button></div>
    </section>
  </div>;
}
