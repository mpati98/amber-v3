// Mock cho productivity_profile — hiệu suất theo giờ trong ngày, thang 0-1.
// Khi nối API thật, thay bằng query từ bảng productivity_profile theo day_of_week.
export const mockHourlyEffectiveness: Record<number, number> = {
  6: 0.3,
  7: 0.45,
  8: 0.7,
  9: 0.9,
  10: 0.85,
  11: 0.6,
  12: 0.3,
  13: 0.35,
  14: 0.55,
  15: 0.65,
  16: 0.5,
  17: 0.35,
  18: 0.25,
  19: 0.3,
  20: 0.2,
  21: 0.15,
};

export type MockTask = {
  id: string;
  title: string;
  projectName: string;
  startTime: string;
  endTime: string;
  importance: 1 | 2 | 3;
  urgency: 1 | 2 | 3;
};

export const mockTasksToday: MockTask[] = [
  {
    id: "t1",
    title: "Chuẩn bị: Sự kiện Deakin",
    projectName: "Sự kiện tháng 10",
    startTime: "09:00",
    endTime: "10:15",
    importance: 3,
    urgency: 2,
  },
  {
    id: "t2",
    title: "Duyệt content quảng cáo",
    projectName: "Marketing",
    startTime: "10:30",
    endTime: "11:00",
    importance: 2,
    urgency: 1,
  },
  {
    id: "t3",
    title: "Báo cáo hiệu suất tuần",
    projectName: "Marketing ops",
    startTime: "14:00",
    endTime: "15:00",
    importance: 2,
    urgency: 2,
  },
];

export const mockSupportingTasksCount = 5;

// --- Week view mock ---
export type MockDayColumn = {
  date: string; // "24/08"
  weekday: string; // "T2"
  isToday: boolean;
  peakScore: number; // hiệu suất cao nhất trong ngày đó, 0-1 — tô chấm màu ở header cột
  supportingCount: number;
  tasks: MockTask[];
};

export const mockWeekDays: MockDayColumn[] = [
  {
    date: "24/08",
    weekday: "T2",
    isToday: false,
    peakScore: 0.6,
    supportingCount: 3,
    tasks: [
      {
        id: "w1",
        title: "Họp tuần team",
        projectName: "Marketing ops",
        startTime: "08:30",
        endTime: "09:00",
        importance: 2,
        urgency: 2,
      },
    ],
  },
  {
    date: "25/08",
    weekday: "T3",
    isToday: false,
    peakScore: 0.8,
    supportingCount: 2,
    tasks: [
      {
        id: "w2",
        title: "Gửi báo giá đối tác",
        projectName: "Sự kiện tháng 10",
        startTime: "09:30",
        endTime: "10:00",
        importance: 3,
        urgency: 3,
      },
      {
        id: "w3",
        title: "Review landing page",
        projectName: "Marketing",
        startTime: "14:00",
        endTime: "14:30",
        importance: 2,
        urgency: 1,
      },
    ],
  },
  {
    date: "26/08",
    weekday: "T4",
    isToday: true,
    peakScore: 0.9,
    supportingCount: 5,
    tasks: mockTasksToday,
  },
  {
    date: "27/08",
    weekday: "T5",
    isToday: false,
    peakScore: 0.55,
    supportingCount: 4,
    tasks: [
      {
        id: "w4",
        title: "Gọi tư vấn ứng viên",
        projectName: "Tuyển sinh",
        startTime: "10:00",
        endTime: "10:45",
        importance: 2,
        urgency: 2,
      },
    ],
  },
  {
    date: "28/08",
    weekday: "T6",
    isToday: false,
    peakScore: 0.7,
    supportingCount: 1,
    tasks: [
      {
        id: "w5",
        title: "Chốt checklist sự kiện",
        projectName: "Sự kiện tháng 10",
        startTime: "09:00",
        endTime: "10:00",
        importance: 3,
        urgency: 2,
      },
    ],
  },
  { date: "29/08", weekday: "T7", isToday: false, peakScore: 0.3, supportingCount: 0, tasks: [] },
  { date: "30/08", weekday: "CN", isToday: false, peakScore: 0.2, supportingCount: 0, tasks: [] },
];
