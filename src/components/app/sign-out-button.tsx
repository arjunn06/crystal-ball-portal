import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SignOutButton() {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  return (
    <button
      onClick={signOut}
      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-hover/60 hover:text-foreground transition-colors"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}