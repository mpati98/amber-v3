"use client";

import { useNavigationHistory } from "@/components/NavigationHistoryProvider";

export default function BackLink({ className = "" }: { className?: string }) {
  const { previousLabel, goBack } = useNavigationHistory();

  return (
    <button
      onClick={goBack}
      className={
        className ||
        "rounded-sm border border-white/15 px-4 py-2 font-sans text-sm text-white/70 transition hover:border-kincha-400/50 hover:text-kincha-200"
      }
    >
      ← {previousLabel}
    </button>
  );
}
