/**
 * RandomCodeSpace Design System
 * ─────────────────────────────
 * Public entry. Re-exports every component (runtime) + every type.
 *
 * Usage:
 *   import { Button, Card, Table, ThemeProvider, toast } from "@ossrandom/design-system";
 *   import "@ossrandom/design-system/styles.css";
 */

// ─── Token + component types (no runtime) ─────────────────────────────
export type * from "./tokens";
export type * from "./components";

// ─── Runtime components ───────────────────────────────────────────────
export { Button, IconButton, ButtonGroup } from "./components/buttons";
export { Input, NumberInput, PinInput, Textarea } from "./components/inputs";
export { Select, Combobox } from "./components/selects";
export {
  Checkbox, RadioGroup, Switch, Slider,
  DatePicker, DateRangePicker, FileUpload, FormField,
} from "./components/form-controls";
export { Badge, StatusDot } from "./components/badges";
export { Card, Space, ScrollDiv, Divider, Grid } from "./components/layout";
export { Tabs, Menu, Breadcrumb, Pagination, Steps } from "./components/navigation";
export {
  Alert, Modal, Drawer, Progress, Skeleton, Spin, Tooltip,
  toast, ToastRegion,
} from "./components/feedback";
export { Table, Stat, Avatar, Timeline } from "./components/data-display";
export { Chat } from "./components/chat";
export { CodeBlock, Markdown, Terminal, RichTextEditor } from "./components/code";
export { PageHeader, AppShell } from "./components/page";
export { ThemeProvider, useTheme } from "./components/theme";
