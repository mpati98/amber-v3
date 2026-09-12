"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
import { AddFeedSourceModal } from "@/components/kieu-lau/AddFeedSourceModal";

type Alert = {
  id: string;
  kind: "TASK_DUE" | "BUDGET_EXCEEDED" | "FINANCE_MONTH_MISSING" | "LEARN_INACTIVE";
  title: string;
  detail?: string;
  href: string;
};

type ActivityRow = {
  id: string;
  source: "DU_AN" | "FINANCE" | "LEARN" | "TRA_DINH" | "KIEU_LAU";
  action: string;
  title: string;
  createdAt: string;
};

type FeedSource = { id: string; name: string; url: string };
type FeedArticle = { id: string; title: string; url: string; publishedAt: string | null; sourceName: string };

const SOURCE_ICON: Record<ActivityRow["source"], string> = {
  DU_AN: "📋",
  FINANCE: "💰",
  LEARN: "🎓",
  TRA_DINH: "💬",
  KIEU_LAU: "📰",
};

const WARN_BORDER: Record<Alert["kind"], string> = {
  TASK_DUE: "hover:border-shuiro-500/50",
  BUDGET_EXCEEDED: "hover:border-shuiro-500/50",
  FINANCE_MONTH_MISSING: "hover:border-kincha-400/50",
  LEARN_INACTIVE: "hover:border-kincha-400/50",
};

export default function KieuLauPage() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityRow[] | null>(null);
  const [sources, setSources] = useState<FeedSource[] | null>(null);
  const [articles, setArticles] = useState<FeedArticle[] | null>(null);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    const res = await fetch("/api/kieu-lau/notifications");
    const data = await res.json();
    setAlerts(data.alerts);
    setRecentActivity(data.recentActivity);
  }, []);

  const loadSources = useCallback(async () => {
    const res = await fetch("/api/kieu-lau/feed-sources");
    setSources(await res.json());
  }, []);

  const loadArticles = useCallback(async () => {
    const res = await fetch("/api/kieu-lau/feed-articles");
    setArticles(await res.json());
  }, []);

  useEffect(() => {
    loadNotifications();
    loadSources();
    loadArticles();
  }, [loadNotifications, loadSources, loadArticles]);

  const deleteSource = async (id: string) => {
    await fetch(`/api/kieu-lau/feed-sources/${id}`, { method: "DELETE" });
    setSources((prev) => prev?.filter((s) => s.id !== id) ?? prev);
    setArticles((prev) => prev ?? null);
    loadArticles();
  };

  const refreshFeeds = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/kieu-lau/feeds/refresh", { method: "POST" });
      if (!res.ok) throw new Error("refresh failed");
      const { failed } = await res.json();
      if (failed?.length) setRefreshError(`Không làm mới được: ${failed.join(", ")}`);
      await loadArticles();
    } catch {
      setRefreshError("Không làm mới được tin tức, thử lại nhé.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink-950 p-4 pb-24 text-white sm:p-6 lg:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-serif-display text-sm italic tracking-wide text-kincha-400">âm dương giới</div>
          <h1 className="mt-1 font-serif-display text-xl font-semibold sm:text-2xl">Kiều Lâu</h1>
        </div>
        <Link
          href="/"
          className="rounded-sm border border-white/15 px-4 py-2 font-sans text-sm text-white/70 transition hover:border-kincha-400/50 hover:text-kincha-200"
        >
          ← Âm Dương Giới
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Cần chú ý */}
        <ScrollCard glow="shuiro" className="lg:col-span-1">
          <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Cần chú ý</h2>
          {!alerts ? (
            <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
          ) : alerts.length === 0 ? (
            <p className="font-sans text-[12px] text-white/40">Không có gì cần chú ý — mọi thứ ổn.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className={`rounded-sm border border-white/10 bg-white/5 p-2.5 transition-colors ${WARN_BORDER[a.kind]}`}
                >
                  <p className="font-sans text-[12px] text-white">{a.title}</p>
                  {a.detail && <p className="mt-0.5 font-sans text-[11px] text-white/40">{a.detail}</p>}
                </Link>
              ))}
            </div>
          )}
        </ScrollCard>

        {/* Nhật ký gần đây */}
        <ScrollCard glow="yugen" className="lg:col-span-1">
          <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">Nhật ký gần đây</h2>
          {!recentActivity ? (
            <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
          ) : recentActivity.length === 0 ? (
            <p className="font-sans text-[12px] text-white/40">Chưa có hoạt động nào.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentActivity.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <span className="shrink-0">{SOURCE_ICON[r.source]}</span>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[12px] text-white/80">{r.title}</p>
                    <p className="font-sans text-[10px] text-white/30">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollCard>

        {/* Tin tức */}
        <ScrollCard glow="kincha" className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">Tin tức</h2>
            <button
              onClick={refreshFeeds}
              disabled={refreshing || !sources?.length}
              className="font-sans text-[11px] text-kincha-400 hover:underline disabled:opacity-40"
            >
              {refreshing ? "Đang làm mới..." : "Làm mới"}
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {sources?.map((s) => (
              <span
                key={s.id}
                className="flex items-center gap-1 rounded-sm border border-white/15 px-2 py-1 font-sans text-[11px] text-white/70"
              >
                {s.name}
                <button onClick={() => deleteSource(s.id)} className="text-white/40 hover:text-shuiro-500">
                  ✕
                </button>
              </span>
            ))}
            <button
              onClick={() => setAddSourceOpen(true)}
              className="rounded-sm border border-dashed border-white/20 px-2 py-1 font-sans text-[11px] text-white/50 hover:border-kincha-400/50 hover:text-kincha-200"
            >
              + Nguồn
            </button>
          </div>

          {refreshError && <p className="mb-2 font-sans text-[11px] text-shuiro-500">{refreshError}</p>}

          {!articles ? (
            <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
          ) : articles.length === 0 ? (
            <p className="font-sans text-[12px] text-white/40">
              Chưa có tin nào — thêm nguồn rồi bấm &quot;Làm mới&quot;.
            </p>
          ) : (
            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {articles.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-sm border border-white/10 bg-white/5 p-2 transition-colors hover:border-kincha-400/40"
                >
                  <p className="line-clamp-2 font-sans text-[12px] text-white/90">{a.title}</p>
                  <p className="mt-0.5 font-sans text-[10px] text-white/40">
                    {a.sourceName}
                    {a.publishedAt ? ` · ${new Date(a.publishedAt).toLocaleDateString("vi-VN")}` : ""}
                  </p>
                </a>
              ))}
            </div>
          )}
        </ScrollCard>
      </div>

      <AddFeedSourceModal
        open={addSourceOpen}
        onClose={() => setAddSourceOpen(false)}
        onCreated={(created) => {
          setSources((prev) => [created, ...(prev ?? [])]);
        }}
      />
    </main>
  );
}
