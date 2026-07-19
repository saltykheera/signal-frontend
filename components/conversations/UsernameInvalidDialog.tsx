"use client";

type UsernameInvalidDialogProps = {
  username: string;
  onClose: () => void;
};

export function UsernameInvalidDialog({ username, onClose }: UsernameInvalidDialogProps) {
  return <div className="username-dialog-backdrop" role="presentation">
    <section className="username-dialog" role="dialog" aria-modal="true" aria-labelledby="username-dialog-copy">
      <p id="username-dialog-copy"><strong>{username}</strong> is not a valid username. Make sure you&apos;ve entered the complete username followed by its set of digits.</p>
      <button type="button" className="username-dialog-confirm" onClick={onClose}>OK</button>
    </section>
  </div>;
}
