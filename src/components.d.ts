/**
 * RandomCodeSpace Design System — Component Type Definitions
 * ──────────────────────────────────────────────────────────
 * Strongly-typed prop interfaces for every component card in the system.
 * Pure types — no runtime. Import alongside your implementations.
 *
 * Conventions
 *  • All components extend a base `BaseProps` (className, style, id, data-*)
 *  • Discriminated unions for variants where shape differs ("status: 'error'")
 *  • Strict event signatures — never `(value: any) => void`
 *  • `readonly` on arrays passed in as props (immutability hint)
 */

import type {
  BrandColor, SemanticColor, ThemeMode,
  SpaceSize, Radius, Shadow,
  FontFamily, FontWeight, TypeScale,
  Size, Density,
  Direction, Axis, Align, Justify,
} from "./tokens";

import type { ReactNode, CSSProperties, MouseEvent, ChangeEvent, KeyboardEvent, FocusEvent } from "react";

// ─── Base ──────────────────────────────────────────────────────────────
export interface BaseProps {
  readonly id?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly "data-testid"?: string;
}

// ═══════════════════════════════════════════════════════════════════════
//  BUTTONS
// ═══════════════════════════════════════════════════════════════════════
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonShape   = "rect" | "pill" | "square" | "circle";

export interface ButtonProps extends BaseProps {
  readonly variant?: ButtonVariant;
  readonly size?: Size;
  readonly shape?: ButtonShape;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly block?: boolean;
  readonly iconLeft?: ReactNode;
  readonly iconRight?: ReactNode;
  readonly type?: "button" | "submit" | "reset";
  readonly children?: ReactNode;
  readonly onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export interface IconButtonProps extends Omit<ButtonProps, "iconLeft" | "iconRight" | "block" | "children"> {
  readonly icon: ReactNode;
  readonly "aria-label": string;       // required for a11y
  readonly round?: boolean;
}

export interface ButtonGroupProps extends BaseProps {
  readonly children: ReactNode;
  readonly size?: Size;
  readonly direction?: Direction;
  readonly attached?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
//  INPUTS · FORM
// ═══════════════════════════════════════════════════════════════════════
export type InputStatus = "default" | "error" | "warning" | "success";

export interface InputProps extends BaseProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly size?: Size;
  readonly status?: InputStatus;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly invalid?: boolean;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
  readonly clearable?: boolean;
  readonly type?: "text" | "email" | "password" | "url" | "search" | "tel";
  readonly autoFocus?: boolean;
  readonly onChange?: (value: string, e: ChangeEvent<HTMLInputElement>) => void;
  readonly onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  readonly onBlur?:  (e: FocusEvent<HTMLInputElement>) => void;
  readonly onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export interface NumberInputProps extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "type"> {
  readonly value?: number;
  readonly defaultValue?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly precision?: number;
  readonly onChange?: (value: number) => void;
}

export interface PinInputProps extends BaseProps {
  readonly length: 4 | 6 | 8;
  readonly value?: string;
  readonly mask?: boolean;
  readonly autoFocus?: boolean;
  readonly placeholder?: string;
  readonly onChange?: (value: string) => void;
  readonly onComplete?: (value: string) => void;
}

export interface TextareaProps extends Omit<InputProps, "type" | "prefix" | "suffix" | "clearable"> {
  readonly rows?: number;
  readonly autoResize?: boolean;
  readonly maxLength?: number;
  readonly showCount?: boolean;
}

export interface SelectOption<V extends string | number = string> {
  readonly label: string;
  readonly value: V;
  readonly disabled?: boolean;
  readonly description?: string;
  readonly icon?: ReactNode;
}

export interface SelectProps<V extends string | number = string> extends BaseProps {
  readonly options: readonly SelectOption<V>[];
  readonly value?: V;
  readonly defaultValue?: V;
  readonly placeholder?: string;
  readonly searchable?: boolean;
  readonly clearable?: boolean;
  readonly disabled?: boolean;
  readonly status?: InputStatus;
  readonly size?: Size;
  readonly onChange?: (value: V, option: SelectOption<V>) => void;
}

export interface ComboboxProps<V extends string | number = string>
  extends Omit<SelectProps<V>, "value" | "defaultValue" | "onChange"> {
  readonly value?: readonly V[];
  readonly defaultValue?: readonly V[];
  readonly multi?: true;
  readonly maxItems?: number;
  readonly creatable?: boolean;
  readonly onChange?: (values: readonly V[]) => void;
}

export interface CheckboxProps extends BaseProps {
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly indeterminate?: boolean;
  readonly disabled?: boolean;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly onChange?: (checked: boolean) => void;
}

export interface RadioOption<V extends string | number = string> {
  readonly value: V;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly disabled?: boolean;
}

export interface RadioGroupProps<V extends string | number = string> extends BaseProps {
  readonly name: string;
  readonly options: readonly RadioOption<V>[];
  readonly value?: V;
  readonly defaultValue?: V;
  readonly direction?: Direction;
  readonly disabled?: boolean;
  readonly onChange?: (value: V) => void;
}

export interface SwitchProps extends BaseProps {
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly size?: Size;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly label?: ReactNode;
  readonly onChange?: (checked: boolean) => void;
}

export interface SliderProps extends BaseProps {
  readonly value?: number | readonly [number, number];
  readonly defaultValue?: number | readonly [number, number];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly marks?: Readonly<Record<number, ReactNode>>;
  readonly range?: boolean;
  readonly disabled?: boolean;
  readonly tooltip?: "always" | "hover" | "never";
  readonly onChange?: (value: number | readonly [number, number]) => void;
}

export interface DateRange { readonly from: Date; readonly to: Date; }
export interface DatePickerProps extends BaseProps {
  readonly value?: Date;
  readonly defaultValue?: Date;
  readonly min?: Date;
  readonly max?: Date;
  readonly format?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly disabledDates?: (date: Date) => boolean;
  readonly onChange?: (date: Date | null) => void;
}
export interface DateRangePickerProps extends Omit<DatePickerProps, "value" | "defaultValue" | "onChange"> {
  readonly value?: DateRange;
  readonly defaultValue?: DateRange;
  readonly onChange?: (range: DateRange | null) => void;
}

export interface FileUploadProps extends BaseProps {
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxSize?: number;          // bytes
  readonly maxFiles?: number;
  readonly disabled?: boolean;
  readonly variant?: "drop-zone" | "button" | "picture-card";
  readonly onUpload?: (files: readonly File[]) => void | Promise<void>;
  readonly onError?: (error: { code: "size" | "type" | "count"; message: string }) => void;
}

// ─── Form scaffolding ──────────────────────────────────────────────────
export interface FormFieldProps extends BaseProps {
  readonly label?: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly optional?: boolean;
  readonly htmlFor?: string;
  readonly children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════
//  BADGES · TAGS · STATUS
// ═══════════════════════════════════════════════════════════════════════
export type BadgeTone = "neutral" | "danger" | "warning" | "info" | "subtle" | "solid";

export interface BadgeProps extends BaseProps {
  readonly tone?: BadgeTone;
  readonly size?: Size;
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly closable?: boolean;
  readonly onClose?: () => void;
}

export interface StatusDotProps extends BaseProps {
  readonly status: "running" | "degraded" | "failed" | "idle" | "live" | "stopped";
  readonly label?: ReactNode;
  readonly pulse?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
//  CARDS · LAYOUT · SPACE
// ═══════════════════════════════════════════════════════════════════════
export interface CardProps extends BaseProps {
  readonly title?: ReactNode;
  readonly subtitle?: ReactNode;
  readonly extra?: ReactNode;
  readonly footer?: ReactNode;
  readonly bordered?: boolean;
  readonly hoverable?: boolean;
  readonly padding?: SpaceSize;
  readonly radius?: Radius;
  readonly shadow?: Shadow;
  readonly children?: ReactNode;
}

export interface SpaceProps extends BaseProps {
  readonly direction?: Direction;
  readonly size?: SpaceSize;
  readonly align?: Align;
  readonly justify?: Justify;
  readonly wrap?: boolean;
  readonly split?: ReactNode;             // divider element rendered between children
  readonly children: ReactNode;
}

export interface ScrollDivProps extends BaseProps {
  readonly direction?: Axis;              // x | y | both
  readonly height?: number | string;
  readonly maxHeight?: number | string;
  readonly width?: number | string;
  readonly shadow?: boolean;              // fade gradients at edges
  readonly contain?: boolean;             // overscroll-behavior: contain (default true)
  readonly thin?: boolean;                // thin scrollbar
  readonly children: ReactNode;
  readonly onScroll?: (state: { scrollTop: number; scrollLeft: number; atTop: boolean; atBottom: boolean }) => void;
}

export interface DividerProps extends BaseProps {
  readonly direction?: Direction;
  readonly children?: ReactNode;          // text divider
  readonly variant?: "solid" | "dashed";
}

export interface GridProps extends BaseProps {
  readonly columns?: number;              // 1–12
  readonly gap?: SpaceSize;
  readonly children: ReactNode;
}
export interface GridColProps extends BaseProps {
  readonly span: number;                  // 1–12
  readonly offset?: number;
  readonly children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════
//  TABS · MENU · NAVIGATION
// ═══════════════════════════════════════════════════════════════════════
export interface TabItem<K extends string = string> {
  readonly key: K;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly badge?: ReactNode;
  readonly disabled?: boolean;
  readonly content?: ReactNode;
}

export interface TabsProps<K extends string = string> extends BaseProps {
  readonly items: readonly TabItem<K>[];
  readonly value?: K;
  readonly defaultValue?: K;
  readonly variant?: "line" | "card" | "segment" | "pill";
  readonly size?: Size;
  readonly onChange?: (key: K) => void;
}

export interface MenuItem<K extends string = string> {
  readonly key: K;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly shortcut?: string;
  readonly badge?: ReactNode;
  readonly disabled?: boolean;
  readonly destructive?: boolean;
  readonly children?: readonly MenuItem<K>[];   // submenu
}

export interface MenuProps<K extends string = string> extends BaseProps {
  readonly items: readonly (MenuItem<K> | { readonly type: "separator" } | { readonly type: "label"; readonly label: ReactNode })[];
  readonly selectedKeys?: readonly K[];
  readonly defaultSelectedKeys?: readonly K[];
  readonly mode?: "horizontal" | "vertical" | "inline";
  readonly onSelect?: (key: K) => void;
}

export interface BreadcrumbItem {
  readonly label: ReactNode;
  readonly href?: string;
  readonly icon?: ReactNode;
  readonly onClick?: () => void;
}
export interface BreadcrumbProps extends BaseProps {
  readonly items: readonly BreadcrumbItem[];
  readonly separator?: ReactNode;
  readonly maxItems?: number;
}

export interface PaginationProps extends BaseProps {
  readonly total: number;
  readonly pageSize: number;
  readonly current: number;
  readonly siblings?: number;
  readonly showJumper?: boolean;
  readonly showSizeChanger?: boolean;
  readonly pageSizeOptions?: readonly number[];
  readonly onChange?: (page: number, pageSize: number) => void;
}

export interface StepItem {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly status?: "wait" | "process" | "finish" | "error";
}
export interface StepsProps extends BaseProps {
  readonly items: readonly StepItem[];
  readonly current: number;
  readonly direction?: Direction;
  readonly size?: Size;
  readonly onChange?: (index: number) => void;
}

// ═══════════════════════════════════════════════════════════════════════
//  FEEDBACK
// ═══════════════════════════════════════════════════════════════════════
export interface AlertProps extends BaseProps {
  readonly severity: "info" | "success" | "warning" | "danger";
  readonly title?: ReactNode;
  readonly children?: ReactNode;
  readonly closable?: boolean;
  readonly icon?: ReactNode | false;
  readonly action?: ReactNode;
  readonly onClose?: () => void;
}

export interface ToastOptions {
  readonly id?: string;
  readonly severity?: "info" | "success" | "warning" | "danger";
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly duration?: number;             // ms; 0 = sticky
  readonly action?: { readonly label: string; readonly onClick: () => void };
  readonly onDismiss?: () => void;
}
export interface ToastApi {
  show(opts: ToastOptions): string;
  dismiss(id: string): void;
  promise<T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }): Promise<T>;
}

export interface ModalProps extends BaseProps {
  readonly open: boolean;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly size?: Size | "fullscreen";
  readonly closeOnEsc?: boolean;
  readonly closeOnBackdrop?: boolean;
  readonly footer?: ReactNode;
  readonly children?: ReactNode;
  readonly onClose: () => void;
}

export interface DrawerProps extends Omit<ModalProps, "size"> {
  readonly placement?: "left" | "right" | "top" | "bottom";
  readonly width?: number | string;
}

export interface ProgressProps extends BaseProps {
  readonly value: number;                 // 0–100
  readonly indeterminate?: boolean;
  readonly variant?: "linear" | "circular";
  readonly size?: Size;
  readonly tone?: "neutral" | "danger" | "warning";
  readonly showValue?: boolean;
}

export interface SkeletonProps extends BaseProps {
  readonly variant?: "text" | "rect" | "circle";
  readonly width?: number | string;
  readonly height?: number | string;
  readonly lines?: number;
  readonly animated?: boolean;
}

export interface SpinProps extends BaseProps {
  readonly size?: Size;
  readonly tone?: "neutral" | "danger";
  readonly label?: ReactNode;
}

export interface TooltipProps extends BaseProps {
  readonly content: ReactNode;
  readonly placement?: "top" | "right" | "bottom" | "left" | "auto";
  readonly delay?: number;
  readonly children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════
//  DATA DISPLAY
// ═══════════════════════════════════════════════════════════════════════
export interface TableColumn<T extends object, K extends keyof T = keyof T> {
  readonly key: string;
  readonly title: ReactNode;
  readonly dataKey?: K;
  readonly width?: number | string;
  readonly align?: "left" | "center" | "right";
  readonly sortable?: boolean;
  readonly sticky?: "left" | "right";
  readonly render?: (value: K extends keyof T ? T[K] : unknown, row: T, index: number) => ReactNode;
}

export interface TableProps<T extends object> extends BaseProps {
  readonly columns: readonly TableColumn<T>[];
  readonly data: readonly T[];
  readonly rowKey: keyof T | ((row: T) => string | number);
  readonly density?: Density;
  readonly bordered?: boolean;
  readonly striped?: boolean;
  readonly stickyHeader?: boolean;
  readonly loading?: boolean;
  readonly empty?: ReactNode;
  readonly selection?: "none" | "single" | "multi";
  readonly selectedKeys?: readonly (string | number)[];
  readonly onSelectionChange?: (keys: readonly (string | number)[]) => void;
  readonly onSort?: (key: string, dir: "asc" | "desc") => void;
  readonly onRowClick?: (row: T, index: number) => void;
}

export interface StatProps extends BaseProps {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly unit?: ReactNode;
  readonly delta?: { readonly value: number; readonly direction: "up" | "down"; readonly tone?: "good" | "bad" | "neutral" };
  readonly sparkline?: readonly number[];
}

export interface AvatarProps extends BaseProps {
  readonly src?: string;
  readonly alt?: string;
  readonly initials?: string;
  readonly size?: Size | number;
  readonly shape?: "circle" | "square";
  readonly status?: StatusDotProps["status"];
}

export interface TimelineItem {
  readonly key: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly time?: ReactNode;
  readonly icon?: ReactNode;
  readonly tone?: "neutral" | "success" | "warning" | "danger";
}
export interface TimelineProps extends BaseProps {
  readonly items: readonly TimelineItem[];
  readonly mode?: "left" | "right" | "alternate";
}

// ═══════════════════════════════════════════════════════════════════════
//  CHAT
// ═══════════════════════════════════════════════════════════════════════
export type ChatRole = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: ReactNode;
  readonly timestamp?: Date;
  readonly status?: "sending" | "sent" | "error" | "streaming";
  readonly attachments?: readonly { name: string; size: number; url?: string }[];
}

export interface ChatProps extends BaseProps {
  readonly messages: readonly ChatMessage[];
  readonly streaming?: boolean;
  readonly placeholder?: string;
  readonly onSend?: (text: string, attachments: readonly File[]) => void | Promise<void>;
  readonly onStop?: () => void;
  readonly suggestions?: readonly string[];
}

// ═══════════════════════════════════════════════════════════════════════
//  CODE · MARKDOWN · TERMINAL · RTE
// ═══════════════════════════════════════════════════════════════════════
export type CodeLanguage =
  | "ts" | "tsx" | "js" | "jsx"
  | "json" | "yaml" | "toml"
  | "bash" | "sh" | "zsh"
  | "py" | "go" | "rust"
  | "html" | "css" | "sql"
  | "diff" | "plain";

export interface CodeBlockProps extends BaseProps {
  readonly code: string;
  readonly language?: CodeLanguage;
  readonly filename?: string;
  readonly showLineNumbers?: boolean;
  readonly highlightLines?: readonly number[];
  readonly copyable?: boolean;
  readonly wrap?: boolean;
  readonly onCopy?: () => void;
}

export interface MarkdownProps extends BaseProps {
  readonly source: string;
  readonly variant?: "default" | "compact";
  readonly allowHtml?: boolean;
  readonly components?: Readonly<Partial<Record<"h1" | "h2" | "h3" | "p" | "code" | "a" | "blockquote", (props: { children: ReactNode }) => ReactNode>>>;
  readonly onLinkClick?: (href: string) => void;
}

export interface TerminalLine {
  readonly type: "stdout" | "stderr" | "info" | "warn" | "error" | "debug" | "prompt";
  readonly text: string;                  // ANSI sequences allowed
  readonly timestamp?: Date;
}

export interface TerminalProps extends BaseProps {
  readonly title?: string;
  readonly lines: readonly TerminalLine[];
  readonly streaming?: boolean;
  readonly height?: number | string;
  readonly searchable?: boolean;
  readonly tabs?: readonly { readonly key: string; readonly label: string; readonly active?: boolean }[];
  readonly onInput?: (cmd: string) => void;
  readonly onTabChange?: (key: string) => void;
}

export interface RichTextEditorProps extends BaseProps {
  readonly value?: string;                // gfm markdown
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly toolbar?: "full" | "compact" | "inline" | "none";
  readonly slashMenu?: boolean;
  readonly bubbleMenu?: boolean;
  readonly mentionsSource?: (query: string) => Promise<readonly { id: string; label: string }[]>;
  readonly collab?: { readonly room: string; readonly user: { id: string; name: string; color?: string } };
  readonly minHeight?: number | string;
  readonly maxLength?: number;
  readonly readOnly?: boolean;
  readonly onChange?: (markdown: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════
//  PAGE-LEVEL
// ═══════════════════════════════════════════════════════════════════════
export interface PageHeaderProps extends BaseProps {
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly breadcrumbs?: BreadcrumbProps["items"];
  readonly tabs?: TabsProps["items"];
  readonly actions?: ReactNode;
  readonly badge?: ReactNode;
  readonly avatar?: ReactNode;
  readonly back?: { readonly label?: string; readonly onClick: () => void };
}

export interface AppShellProps extends BaseProps {
  readonly header?: ReactNode;
  readonly sidebar?: ReactNode;
  readonly footer?: ReactNode;
  readonly sidebarWidth?: number;
  readonly sidebarCollapsible?: boolean;
  readonly children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════
//  THEME PROVIDER
// ═══════════════════════════════════════════════════════════════════════
export interface ThemeProviderProps {
  readonly mode?: ThemeMode;
  readonly accent?: BrandColor;
  readonly fontFamily?: { readonly sans: string; readonly mono: string };
  readonly children: ReactNode;
}

export interface UseTheme {
  readonly mode: ThemeMode;
  readonly setMode: (m: ThemeMode) => void;
  readonly toggle: () => void;
}
