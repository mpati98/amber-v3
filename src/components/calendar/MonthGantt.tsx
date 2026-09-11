"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GANTT_MONTH, dayOfMonthToIso, isoToDayOfMonth } from "../../lib/gantt-date";
import { NewProjectModal } from "./NewProjectModal";
import { NewTaskModal } from "./NewTaskModal";

const DAY_COL_WIDTH = 22;
const LABEL_WIDTH = 132;
const daysInMonth = new Date(2026, GANTT_MONTH, 0).getDate();

const barStyles: Record<1 | 2 | 3, string> = {
  3: "bg-shuiro-500",
  2: "bg-kincha-400",
  1: "bg-yugen-500",
};

type LocalTask = {
  id: string;
  title: string;
  importance: 1 | 2 | 3;
  startDay: number;
  endDay: number;
};
type LocalProject = { id: string; name: string; tasks: LocalTask[] };

function clampDay(day: number): number {
  return Math.min(daysInMonth, Math.max(1, day));
}

function DayGridLines() {
  return (
    <>
      {Array.from({ length: daysInMonth + 1 }, (_, i) => i).map((d) => (
        <div
          key={d}
          className="absolute top-0 bottom-0 border-l border-dotted border-white/10"
          style={{ left: d * DAY_COL_WIDTH }}
        />
      ))}
    </>
  );
}

type DragState =
  | {
      kind: "move";
      projectId: string;
      taskId: string;
      startX: number;
      origStart: number;
      origEnd: number;
    }
  | {
      kind: "resize-start";
      projectId: string;
      taskId: string;
      startX: number;
      origStart: number;
      origEnd: number;
    }
  | {
      kind: "resize-end";
      projectId: string;
      taskId: string;
      startX: number;
      origStart: number;
      origEnd: number;
    }
  | { kind: "create"; projectId: string; trackLeft: number; anchorDay: number; currentDay: number }
  | null;

async function patchTaskDates(taskId: string, startDay: number, endDay: number) {
  await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startDate: dayOfMonthToIso(startDay),
      dueDate: dayOfMonthToIso(endDay),
    }),
  }).catch(() => {
    // Bản MVP: lỗi mạng chỉ log, chưa rollback UI — cân nhắc thêm khi có toast/error state thật.
    console.error("Không lưu được thay đổi task", taskId);
  });
}

export function MonthGantt({ todayDay }: { todayDay: number }) {
  const [projects, setProjects] = useState<LocalProject[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [drag, setDrag] = useState<DragState>(null);
  const dragRef = useRef<DragState>(null);
  dragRef.current = drag;
  const pendingPatchRef = useRef<{ taskId: string; startDay: number; endDay: number } | null>(null);

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newTaskFor, setNewTaskFor] = useState<{
    projectId: string;
    projectName: string;
    startDay: number;
    endDay: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          fetch(`/api/projects?type=STANDARD`),
          fetch(`/api/tasks?kind=gantt`),
        ]);
        if (!projectsRes.ok || !tasksRes.ok) throw new Error("load failed");
        const projectRows: { id: string; name: string }[] = await projectsRes.json();
        const taskRows: {
          id: string;
          title: string;
          importance: 1 | 2 | 3;
          projectId: string | null;
          startDate: string;
          dueDate: string;
        }[] = await tasksRes.json();

        const byProject: LocalProject[] = projectRows.map((p) => ({
          id: p.id,
          name: p.name,
          tasks: [],
        }));
        for (const t of taskRows) {
          const start = isoToDayOfMonth(t.startDate);
          const end = isoToDayOfMonth(t.dueDate);
          if (start === null || end === null || !t.projectId) continue; // ngoài tháng đang xem, hoặc chưa gắn project
          const project = byProject.find((p) => p.id === t.projectId);
          project?.tasks.push({
            id: t.id,
            title: t.title,
            importance: t.importance,
            startDay: start,
            endDay: end,
          });
        }
        setProjects(byProject);
      } catch {
        setLoadError(true);
      }
    }
    load();
  }, []);

  const gridWidth = daysInMonth * DAY_COL_WIDTH;

  const updateTaskLocal = useCallback(
    (projectId: string, taskId: string, patch: Partial<LocalTask>) => {
      setProjects((prev) =>
        prev
          ? prev.map((p) =>
              p.id !== projectId
                ? p
                : { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
            )
          : prev
      );
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;

      if (d.kind === "move") {
        const deltaDays = Math.round((e.clientX - d.startX) / DAY_COL_WIDTH);
        const startDay = clampDay(d.origStart + deltaDays);
        const endDay = clampDay(d.origEnd + deltaDays);
        updateTaskLocal(d.projectId, d.taskId, { startDay, endDay });
        pendingPatchRef.current = { taskId: d.taskId, startDay, endDay };
      } else if (d.kind === "resize-start") {
        const deltaDays = Math.round((e.clientX - d.startX) / DAY_COL_WIDTH);
        const startDay = Math.min(clampDay(d.origStart + deltaDays), d.origEnd);
        updateTaskLocal(d.projectId, d.taskId, { startDay });
        pendingPatchRef.current = { taskId: d.taskId, startDay, endDay: d.origEnd };
      } else if (d.kind === "resize-end") {
        const deltaDays = Math.round((e.clientX - d.startX) / DAY_COL_WIDTH);
        const endDay = Math.max(clampDay(d.origEnd + deltaDays), d.origStart);
        updateTaskLocal(d.projectId, d.taskId, { endDay });
        pendingPatchRef.current = { taskId: d.taskId, startDay: d.origStart, endDay };
      } else if (d.kind === "create") {
        const day = clampDay(Math.ceil((e.clientX - d.trackLeft) / DAY_COL_WIDTH));
        setDrag({ ...d, currentDay: day });
      }
    },
    [updateTaskLocal]
  );

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    if (d?.kind === "create") {
      const start = Math.min(d.anchorDay, d.currentDay);
      const end = Math.max(d.anchorDay, d.currentDay);
      const project = projects?.find((p) => p.id === d.projectId);
      if (project) {
        setNewTaskFor({
          projectId: project.id,
          projectName: project.name,
          startDay: start,
          endDay: end,
        });
      }
    } else if (pendingPatchRef.current) {
      const { taskId, startDay, endDay } = pendingPatchRef.current;
      patchTaskDates(taskId, startDay, endDay);
      pendingPatchRef.current = null;
    }
    setDrag(null);
    // projects đọc trong closure trên chỉ dùng cho nhánh "create", không cần trong deps
    // vì tại thời điểm mouseup luôn lấy state mới nhất qua setProjects functional update ở nơi khác.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMouseMove, projects]);

  const startDrag = (next: DragState) => {
    setDrag(next);
    dragRef.current = next;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const onBarMouseDown = (e: React.MouseEvent, projectId: string, task: LocalTask) => {
    e.stopPropagation();
    startDrag({
      kind: "move",
      projectId,
      taskId: task.id,
      startX: e.clientX,
      origStart: task.startDay,
      origEnd: task.endDay,
    });
  };

  const onResizeStartHandle = (e: React.MouseEvent, projectId: string, task: LocalTask) => {
    e.stopPropagation();
    startDrag({
      kind: "resize-start",
      projectId,
      taskId: task.id,
      startX: e.clientX,
      origStart: task.startDay,
      origEnd: task.endDay,
    });
  };

  const onResizeEndHandle = (e: React.MouseEvent, projectId: string, task: LocalTask) => {
    e.stopPropagation();
    startDrag({
      kind: "resize-end",
      projectId,
      taskId: task.id,
      startX: e.clientX,
      origStart: task.startDay,
      origEnd: task.endDay,
    });
  };

  const onCreateTrackMouseDown = (e: React.MouseEvent, projectId: string) => {
    const trackLeft = e.currentTarget.getBoundingClientRect().left;
    const day = clampDay(Math.ceil((e.clientX - trackLeft) / DAY_COL_WIDTH));
    startDrag({ kind: "create", projectId, trackLeft, anchorDay: day, currentDay: day });
  };

  if (loadError) {
    return (
      <div className="text-[13px] text-shuiro-500 p-3">
        Không tải được dữ liệu Gantt — kiểm tra API `/api/projects` và `/api/tasks` đã chạy chưa.
      </div>
    );
  }
  if (!projects) {
    return <div className="text-[13px] text-white/40 p-3">Đang tải...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3">
        <p className="text-[12px] text-white/40">
          Chưa có project nào — bấm &quot;+ Thêm project&quot; bên dưới để bắt đầu.
        </p>
        <button
          onClick={() => setNewProjectOpen(true)}
          className="mt-2 text-[11px] text-kincha-400 hover:underline"
        >
          + Thêm project
        </button>
        <NewProjectModal
          open={newProjectOpen}
          onClose={() => setNewProjectOpen(false)}
          onCreated={(p) => setProjects((prev) => [...(prev ?? []), { id: p.id, name: p.name, tasks: [] }])}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-ink-900/40 select-none">
      <div style={{ width: LABEL_WIDTH + gridWidth }}>
        <div className="flex sticky top-0 bg-ink-900 border-b border-white/10">
          <div style={{ width: LABEL_WIDTH }} className="shrink-0" />
          <div className="relative" style={{ width: gridWidth, height: 24 }}>
            <DayGridLines />
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <div
                key={d}
                className="absolute top-0 text-[10px] text-white/40 text-center"
                style={{ left: (d - 1) * DAY_COL_WIDTH, width: DAY_COL_WIDTH }}
              >
                {d}
              </div>
            ))}
            <div
              className="absolute top-0 bottom-0 w-px bg-shuiro-500"
              style={{ left: (todayDay - 1) * DAY_COL_WIDTH + DAY_COL_WIDTH / 2 }}
            />
          </div>
        </div>

        {projects.map((project) => (
          <div key={project.id}>
            <div className="flex bg-white/5">
              <div
                style={{ width: LABEL_WIDTH + gridWidth }}
                className="text-[11px] font-medium text-kincha-400 px-2 py-1"
              >
                {project.name}
              </div>
            </div>

            {project.tasks.map((task) => (
              <div key={task.id} className="flex items-center border-b border-white/5">
                <div
                  style={{ width: LABEL_WIDTH }}
                  className="shrink-0 text-[11px] text-white truncate px-2 py-1.5"
                >
                  {task.title}
                </div>
                <div className="relative" style={{ width: gridWidth, height: 26 }}>
                  <DayGridLines />
                  <div
                    onMouseDown={(e) => onBarMouseDown(e, project.id, task)}
                    className={`absolute top-1 h-4 rounded-full cursor-grab active:cursor-grabbing ${barStyles[task.importance]}`}
                    style={{
                      left: (task.startDay - 1) * DAY_COL_WIDTH,
                      width: (task.endDay - task.startDay + 1) * DAY_COL_WIDTH - 2,
                    }}
                  >
                    <div
                      onMouseDown={(e) => onResizeStartHandle(e, project.id, task)}
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize"
                    />
                    <div
                      onMouseDown={(e) => onResizeEndHandle(e, project.id, task)}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center border-b border-white/5">
              <div
                style={{ width: LABEL_WIDTH }}
                className="shrink-0 text-[10px] text-white/30 px-2 py-1.5"
              >
                + Kéo để thêm task
              </div>
              <div
                className="relative cursor-crosshair"
                style={{ width: gridWidth, height: 26 }}
                onMouseDown={(e) => onCreateTrackMouseDown(e, project.id)}
              >
                <DayGridLines />
                {drag?.kind === "create" && drag.projectId === project.id && (
                  <div
                    className="absolute top-1 h-4 rounded-full bg-yugen-500/40 border border-dashed border-kincha-400"
                    style={{
                      left: (Math.min(drag.anchorDay, drag.currentDay) - 1) * DAY_COL_WIDTH,
                      width: (Math.abs(drag.currentDay - drag.anchorDay) + 1) * DAY_COL_WIDTH - 2,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setNewProjectOpen(true)}
          className="w-full text-left text-[11px] text-kincha-400 px-2 py-2 hover:bg-white/5"
        >
          + Thêm project
        </button>
      </div>

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={(p) =>
          setProjects((prev) => [...(prev ?? []), { id: p.id, name: p.name, tasks: [] }])
        }
      />

      {newTaskFor && (
        <NewTaskModal
          open={!!newTaskFor}
          onClose={() => setNewTaskFor(null)}
          projectId={newTaskFor.projectId}
          projectName={newTaskFor.projectName}
          startDay={newTaskFor.startDay}
          endDay={newTaskFor.endDay}
          onCreated={(t) => {
            const startDay = isoToDayOfMonth(t.startDate) ?? newTaskFor.startDay;
            const endDay = isoToDayOfMonth(t.dueDate) ?? newTaskFor.endDay;
            setProjects((prev) =>
              prev
                ? prev.map((p) =>
                    p.id !== newTaskFor.projectId
                      ? p
                      : {
                          ...p,
                          tasks: [
                            ...p.tasks,
                            {
                              id: t.id,
                              title: t.title,
                              importance: t.importance,
                              startDay,
                              endDay,
                            },
                          ],
                        }
                  )
                : prev
            );
          }}
        />
      )}
    </div>
  );
}
