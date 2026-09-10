"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { labelForPath } from "@/lib/routeLabels";

const STORAGE_KEY = "amber-nav-stack";

type NavigationHistoryContextValue = {
  previousLabel: string;
  goBack: () => void;
};

const NavigationHistoryContext = createContext<NavigationHistoryContextValue>({
  previousLabel: "Âm Dương Giới",
  goBack: () => {},
});

export function useNavigationHistory() {
  return useContext(NavigationHistoryContext);
}

function readStack(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {
    // sessionStorage unavailable — navigation still works, just no memory across reloads
  }
}

export default function NavigationHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const stackRef = useRef<string[]>([]);
  const [previousLabel, setPreviousLabel] = useState("Âm Dương Giới");
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      stackRef.current = readStack();
      initialized.current = true;
    }

    const stack = stackRef.current;
    const last = stack[stack.length - 1];

    if (last !== pathname) {
      stack.push(pathname);
      stackRef.current = stack;
      writeStack(stack);
    }

    const prevPath = stack[stack.length - 2];
    setPreviousLabel(prevPath ? labelForPath(prevPath) : "Âm Dương Giới");
  }, [pathname]);

  function goBack() {
    const stack = stackRef.current;
    if (stack.length > 1) {
      stack.pop(); // bỏ trang hiện tại
      const target = stack[stack.length - 1];
      stackRef.current = stack;
      writeStack(stack);
      router.push(target);
    } else {
      router.push("/");
    }
  }

  return (
    <NavigationHistoryContext.Provider value={{ previousLabel, goBack }}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}
