// Utils
export { cn, formatDuration, formatDate, formatDateTime } from "./lib/utils";

// shadcn/ui components
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/card";
export { Input } from "./components/input";
export { Label } from "./components/label";
export { Textarea } from "./components/textarea";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./components/select";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/dialog";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export { Progress } from "./components/progress";
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "./components/tabs";
export { Checkbox } from "./components/checkbox";
export { RadioGroup, RadioGroupItem } from "./components/radio-group";
export { Skeleton } from "./components/skeleton";
export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "./components/avatar";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./components/dropdown-menu";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/table";
export { Separator } from "./components/separator";
export { Switch } from "./components/switch";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip";
export { ScrollArea, ScrollBar } from "./components/scroll-area";
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/accordion";
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "./components/toast";
export { Toaster } from "./components/toaster";
export { SonnerToaster } from "./components/sonner";

// Confetti
export { Confetti, ConfettiButton, fireConfetti, type ConfettiRef, type ConfettiProps } from "./components/confetti";

// Hooks
export { useToast, toast } from "./hooks/use-toast";

// Re-export sonner toast for convenience
export { toast as sonnerToast } from "sonner";

// Custom test platform components
export { QuestionCard } from "./components/question-card";
export { TestTimer } from "./components/test-timer";
export { TestNavigation, type QuestionStatus } from "./components/test-navigation";
export { VideoPlayer } from "./components/video-player";
export { TestResult } from "./components/test-result";

// Reusable UI components
export { PageHeader } from "./components/page-header";
export { StatCard } from "./components/stat-card";

// Settings components
export {
  PrivacyToggles,
  type PrivacySettings,
  ChartTypeSelector,
  type ChartType,
} from "./components/settings";

// Charts
export {
  ChartContainer,
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  ActivityHeatmap,
} from "./components/charts";

// Data Table
export {
  DataTable,
  SortableHeader,
  type ColumnDef,
} from "./components/data-table";

// Leaderboard
export {
  RankBadge,
  LeaderboardTable,
  type LeaderboardEntry,
  TierBadge,
  type Tier,
  AchievementBadge,
  AchievementList,
  type Achievement,
  TopPerformers,
  type TopPerformer,
} from "./components/leaderboard";
