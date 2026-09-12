export type Building = {
  id: string;
  href: string;
  name: string;
  sub: string;
  src: string;
  glow: string;
  /** position & size as % of the 1920x1080 stage, matching the source art */
  style: {
    left?: string;
    right?: string;
    bottom: string;
    width: string;
  };
};

export const buildings: Building[] = [
  {
    id: "tang-kinh-cac",
    href: "/tang-kinh-cac",
    name: "Tàng Kinh Các",
    sub: "Lưu trữ & tri thức",
    src: "/assets/tang-kinh-cac.webp",
    glow: "var(--color-yugen-500)",
    style: { left: "11%", bottom: "32%", width: "25%" },
  },
  {
    id: "nghi-su-duong",
    href: "/nghi-su-duong",
    name: "Nghị Sự Đường",
    sub: "Việc chính & thông báo",
    src: "/assets/nghi-su-duong.webp",
    glow: "var(--color-shuiro-500)",
    style: { left: "52%", bottom: "22%", width: "38%" },
  },
  {
    id: "kieu-lau",
    href: "/kieu-lau",
    name: "Kiều Lâu",
    sub: "Thông báo & tin tức",
    src: "/assets/kieu-lau.webp",
    glow: "var(--color-yugen-500)",
    style: { left: "29%", bottom: "-8%", width: "44%" },
  },
  {
    id: "tra-dinh",
    href: "/tra-dinh",
    name: "Trà Đình",
    sub: "Trò chuyện & luyện tập",
    src: "/assets/tra-dinh.webp",
    glow: "var(--color-kincha-400)",
    style: { right: "-4%", bottom: "-11%", width: "34%" },
  },
];
