"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { DayGrid } from "@/components/calendar/DayGrid";
import { WeekGrid } from "@/components/calendar/WeekGrid";
import { MonthGantt } from "@/components/calendar/MonthGantt";
import { SupportingTasksGroup } from "@/components/calendar/SupportingTasksGroup";
import { DailySummaryCharts } from "@/components/calendar/DailySummaryCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
import {
  mockHourlyEffectiveness,
  mockTasksToday,
  mockSupportingTasksCount,
  mockWeekDays,
} from "@/lib/mock-data";

type ViewMode = "overview" | "today";

export default function StandardProjectsPage() {
  const [view, setView] = useState<ViewMode>("overview");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { data: session } = useSession();

  const selectedDayData = mockWeekDays.find((d) => d.date === selectedDay) ?? null;

  return (
    <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between font-sans text-[11px] text-white/40">
        <Link href="/nghi-su-duong" className="text-kincha-400 hover:text-kincha-200">
          ← Nghị Sự Đường
        </Link>
        <div className="flex items-center gap-3">
          <span>{session?.user?.name || session?.user?.email}</span>
          <Link href="/settings" className="text-kincha-400 hover:text-kincha-200">
            Cài đặt
          </Link>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-serif-display text-xl font-semibold tracking-wide text-white">
            {view === "today" ? "Thứ 4, 26 thg 8" : "Tổng quan"}
          </h1>
          <TabsList className="bg-white/5">
            <TabsTrigger
              value="overview"
              className="text-white/50 data-active:bg-white/10 data-active:text-kincha-400"
            >
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="today"
              className="text-white/50 data-active:bg-white/10 data-active:text-kincha-400"
            >
              Việc hôm nay
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="flex flex-col gap-6">
            <ScrollCard glow="yugen">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">
                  Tuần này
                </h2>
                {selectedDay && (
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-[11px] text-kincha-400 hover:underline"
                  >
                    Thu gọn
                  </button>
                )}
              </div>
              <WeekGrid
                days={mockWeekDays}
                selectedDate={selectedDay}
                onSelectDate={(d) => setSelectedDay((cur) => (cur === d ? null : d))}
              />
            </ScrollCard>

            <AnimatePresence>
              {selectedDayData && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <ScrollCard glow="shuiro">
                    <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">
                      Chi tiết {selectedDayData.weekday} {selectedDayData.date}
                    </h2>
                    <DailySummaryCharts
                      tasks={selectedDayData.tasks}
                      effectiveness={mockHourlyEffectiveness}
                    />
                    <div className="mb-3">
                      <SupportingTasksGroup count={selectedDayData.supportingCount} />
                    </div>
                    <DayGrid effectiveness={mockHourlyEffectiveness} tasks={selectedDayData.tasks} />
                  </ScrollCard>
                </motion.section>
              )}
            </AnimatePresence>

            <ScrollCard glow="kincha">
              <h2 className="mb-3 font-sans text-[12px] font-medium tracking-wide text-kincha-400">
                Tháng này
              </h2>
              <MonthGantt todayDay={26} />
              <div className="mt-3 flex items-center gap-4 font-sans text-[11px] text-white/40">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-shuiro-500" />
                  Quan trọng cao
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-kincha-400" />
                  Trung bình
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-yugen-500" />
                  Thấp
                </div>
              </div>
            </ScrollCard>
          </div>
        </TabsContent>

        <TabsContent value="today">
          <ScrollCard glow="shuiro">
            <DailySummaryCharts tasks={mockTasksToday} effectiveness={mockHourlyEffectiveness} />

            <div className="mb-3">
              <SupportingTasksGroup count={mockSupportingTasksCount} />
            </div>
            <DayGrid effectiveness={mockHourlyEffectiveness} tasks={mockTasksToday} />
            <div className="mt-3 flex items-center gap-4 font-sans text-[11px] text-white/40">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm bg-shuiro-500" />
                Khung giờ hiệu suất cao
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-sm bg-white/10" />
                Bình thường
              </div>
            </div>
          </ScrollCard>
        </TabsContent>
      </Tabs>
    </main>
  );
}
