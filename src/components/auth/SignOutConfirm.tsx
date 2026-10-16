"use client";

import { Modal } from "@/components/ui/Modal";
import { useSignOut } from "./useSignOut";

/**
 * The confirmation before signing out.
 *
 * Signing out is a state change the reader cannot undo with the back button, so it
 * asks first: an alertdialog that names the consequence and offers the two answers.
 * The shared hook owns the response-then-navigate contract; this component only
 * decides when to call it.
 */
export function SignOutConfirm({
  open,
  onCancel,
}: {
  open: boolean;
  onCancel: () => void;
}) {
  const { sending, signOut } = useSignOut();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Sign out of your account?"
      confirmLabel={sending ? "Signing out…" : "Sign out"}
      cancelLabel="Stay signed in"
      confirmDisabled={sending}
      onConfirm={() => void signOut()}
    >
      <p className="eyebrow text-faint">Heads up</p>
      <p className="measure mt-2xs text-md leading-relaxed text-muted">
        You will be returned to the sign-in page, and anything you configured but
        did not order is not saved to your account.
      </p>
    </Modal>
  );
}
