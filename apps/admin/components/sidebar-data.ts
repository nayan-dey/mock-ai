import {
  LayoutDashboard,
  UserCog,
  Users,
  IndianRupee,
  FileQuestion,
  Sparkles,
  FileText,
  BookOpen,
  Video,
  Shield,
  UserPlus,
  Database,
  BotMessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const sidebarData: NavGroup[] = [
  {
    title: "General",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Users", url: "/users", icon: UserCog },
      { title: "Batches", url: "/batches", icon: Users },
      { title: "Fees", url: "/fees", icon: IndianRupee },
      { title: "Ask Nindo AI", url: "/ask-ai", icon: BotMessageSquare },
    ],
  },
  {
    title: "Content",
    items: [
      {
        title: "Questions",
        url: "/questions",
        icon: FileQuestion,
        items: [
          { title: "Question Bank", url: "/questions", icon: FileQuestion },
          { title: "AI Extract", url: "/questions/extract", icon: Sparkles },
        ],
      },
      { title: "Tests", url: "/tests", icon: FileText },
      { title: "Notes", url: "/notes", icon: BookOpen },
      { title: "Classes", url: "/classes", icon: Video },
    ],
  },
  {
    title: "System",
    items: [
      { title: "Admins", url: "/admins", icon: Shield },
      { title: "Join Requests", url: "/requests", icon: UserPlus },
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Seed Data", url: "/seed", icon: Database },
    ],
  },
];
