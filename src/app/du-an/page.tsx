"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DayGrid } from "@/components/calendar/DayGrid";
import { WeekGrid } from "@/components/calendar/WeekGrid";
import { MonthGantt } from "@/components/calendar/MonthGantt";
import { SupportingTasksGroup } from "@/components/calendar/SupportingTasksGroup";
import { DailySummaryCharts } from "@/components/calendar/DailySummaryCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mockHourlyEffectiveness,
  mockTasksToday,
  mockSupportingTasksCount,
  mockWeekDays,
} from "@/lib/mock-data";

type ViewMode = "overview" | "today";

export default function StandardProjectsPage() {
  const [view, setView] = useState<ViewMode>("overview");
  const { data: session } = useSession();

  return (
    <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen">
      <div className="flex items-center justify-between mb-1 text-[11px] text-text-secondary">
        <Link href="/nghi-su-duong" className="text-primary-500">
          ← Nghị Sự Đường
        </Link>
        <div className="flex items-center gap-3">
          <span>{session?.user?.name || session?.user?.email}</span>
          <Link href="/settings" className="text-primary-500">
            Cài đặt
          </Link>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-primary-900 tracking-wide">
            {view === "today" ? "Thứ 4, 26 thg 8" : "Tổng quan"}
          </h1>
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="today">Việc hôm nay</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="text-[12px] font-medium text-primary-700 mb-2">Tuần này</h2>
              <WeekGrid days={mockWeekDays} />
            </section>

            <section>
              <h2 className="text-[12px] font-medium text-primary-700 mb-2">Tháng này</h2>
              <MonthGantt todayDay={26} />
              <div className="flex items-center gap-4 mt-3 text-[11px] text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-500 inline-block" />
                  Quan trọng cao
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary-500 inline-block" />
                  Trung bình
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-300 inline-block" />
                  Thấp
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="today">
          <DailySummaryCharts tasks={mockTasksToday} effectiveness={mockHourlyEffectiveness} />

          <div className="mb-3">
            <SupportingTasksGroup count={mockSupportingTasksCount} />
          </div>
          <DayGrid effectiveness={mockHourlyEffectiveness} tasks={mockTasksToday} />
          <div className="flex items-center gap-4 mt-3 text-[11px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-accent-500 inline-block" />
              Khung giờ hiệu suất cao
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-primary-100 inline-block" />
              Bình thường
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
