import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PromptOptions = {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type Ctx = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
};

const ConfirmContext = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);
  const [promptState, setPromptState] = useState<
    (PromptOptions & { resolve: (v: string | null) => void; value: string }) | null
  >(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setConfirmState({ ...opts, resolve })),
    [],
  );
  const prompt = useCallback(
    (opts: PromptOptions) =>
      new Promise<string | null>((resolve) =>
        setPromptState({ ...opts, value: opts.defaultValue ?? "", resolve }),
      ),
    [],
  );

  const closeConfirm = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };
  const closePrompt = (v: string | null) => {
    promptState?.resolve(v);
    setPromptState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}

      <AlertDialog
        open={!!confirmState}
        onOpenChange={(o) => { if (!o) closeConfirm(false); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            {confirmState?.description && (
              <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeConfirm(false)}>
              {confirmState?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => closeConfirm(true)}
              className={
                confirmState?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {confirmState?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!promptState}
        onOpenChange={(o) => { if (!o) closePrompt(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promptState?.title}</DialogTitle>
            {promptState?.description && (
              <DialogDescription>{promptState.description}</DialogDescription>
            )}
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              closePrompt(promptState?.value.trim() ? promptState.value : null);
            }}
          >
            <Input
              autoFocus
              value={promptState?.value ?? ""}
              placeholder={promptState?.placeholder}
              onChange={(e) =>
                setPromptState((s) => (s ? { ...s, value: e.target.value } : s))
              }
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => closePrompt(null)}>
                {promptState?.cancelLabel ?? "Cancel"}
              </Button>
              <Button type="submit">
                {promptState?.confirmLabel ?? "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}