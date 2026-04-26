/**
 * Code · Markdown · Terminal · RichTextEditor
 * ───────────────────────────────────────────
 * Lightweight implementations — for production-grade syntax highlighting,
 * mention sources, or collab cursors, swap in shiki/prism/tiptap and keep
 * the same prop surface.
 */
import * as React from "react";
import type {
  CodeBlockProps, MarkdownProps, TerminalProps, RichTextEditorProps,
} from "../components";
import { cx } from "../internal/cx";

// ─── CodeBlock ────────────────────────────────────────────────────────
export function CodeBlock(props: CodeBlockProps): React.ReactElement {
  const {
    code, language = "plain", filename, showLineNumbers = false,
    highlightLines, copyable = true, wrap = false, onCopy,
    className, style, id,
  } = props;

  const lines = code.split("\n");
  const hl = new Set(highlightLines ?? []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      onCopy?.();
    } catch { /* ignore */ }
  };

  return (
    <div id={id} className={cx("rcs-codeblock", className)} style={style}>
      {(filename || language || copyable) && (
        <div className="rcs-codeblock-header">
          <span>{filename ?? language}</span>
          {copyable && <button className="rcs-codeblock-copy" onClick={copy}>Copy</button>}
        </div>
      )}
      <pre className="rcs-codeblock-pre" data-wrap={wrap || undefined}>
        <code data-language={language}>
          {showLineNumbers || hl.size > 0 ? lines.map((line, i) => (
            <span key={i} className="rcs-codeblock-line" data-highlight={hl.has(i + 1) || undefined}>
              {showLineNumbers && <span className="rcs-codeblock-lineno">{i + 1}</span>}
              <span>{line}{"\n"}</span>
            </span>
          )) : code}
        </code>
      </pre>
    </div>
  );
}

// ─── Markdown ─────────────────────────────────────────────────────────
/** Tiny markdown renderer. Handles headings, lists, paragraphs, links, code,
 *  blockquotes, bold/italic/inline-code. Not GFM-complete — bring your own
 *  (markdown-it / remark) for production. */
function renderMarkdownToHTML(src: string, allowHtml: boolean): string {
  const escape = (s: string) =>
    allowHtml ? s : s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    s.replace(/`([^`]+)`/g, (_, c) => `<code>${escape(c)}</code>`)
     .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
     .replace(/\*([^*]+)\*/g, "<em>$1</em>")
     .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = src.split("\n");
  let out = ""; let inList = false; let inCode = false; let codeLang = "";
  for (const raw of lines) {
    const line = raw;
    if (line.startsWith("```")) {
      if (inCode) { out += "</code></pre>"; inCode = false; }
      else { codeLang = line.slice(3).trim(); out += `<pre><code data-language="${codeLang}">`; inCode = true; }
      continue;
    }
    if (inCode) { out += escape(line) + "\n"; continue; }
    if (/^#{1,3} /.test(line)) {
      if (inList) { out += "</ul>"; inList = false; }
      const level = (line.match(/^#+/)?.[0].length ?? 1);
      out += `<h${level}>${inline(escape(line.replace(/^#+ /, "")))}</h${level}>`;
      continue;
    }
    if (/^[-*] /.test(line)) {
      if (!inList) { out += "<ul>"; inList = true; }
      out += `<li>${inline(escape(line.slice(2)))}</li>`;
      continue;
    }
    if (/^> /.test(line)) {
      if (inList) { out += "</ul>"; inList = false; }
      out += `<blockquote>${inline(escape(line.slice(2)))}</blockquote>`;
      continue;
    }
    if (line.trim() === "") {
      if (inList) { out += "</ul>"; inList = false; }
      continue;
    }
    if (inList) { out += "</ul>"; inList = false; }
    out += `<p>${inline(escape(line))}</p>`;
  }
  if (inList) out += "</ul>";
  if (inCode) out += "</code></pre>";
  return out;
}

export function Markdown(props: MarkdownProps): React.ReactElement {
  const { source, variant = "default", allowHtml = false, className, style, id, onLinkClick } = props;
  const html = React.useMemo(() => renderMarkdownToHTML(source, allowHtml), [source, allowHtml]);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!onLinkClick || !ref.current) return;
    const root = ref.current;
    const handler = (e: Event) => {
      const a = (e.target as HTMLElement).closest("a");
      if (a && a.getAttribute("href")) {
        e.preventDefault();
        onLinkClick(a.getAttribute("href")!);
      }
    };
    root.addEventListener("click", handler);
    return () => root.removeEventListener("click", handler);
  }, [onLinkClick, html]);

  return (
    <div
      ref={ref}
      id={id}
      className={cx("rcs-markdown", variant === "compact" && "rcs-markdown--compact", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Terminal ─────────────────────────────────────────────────────────
export function Terminal(props: TerminalProps): React.ReactElement {
  const { title, lines, streaming = false, height = 320, searchable = false, tabs, onInput, onTabChange, className, style, id } = props;
  const [filter, setFilter] = React.useState("");
  const [cmd, setCmd] = React.useState("");
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, streaming]);

  const visible = filter
    ? lines.filter((ln) => ln.text.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  return (
    <div id={id} className={cx("rcs-terminal", className)} style={{ height, ...style }}>
      {(tabs || title || searchable) && (
        <div className="rcs-terminal-tabs">
          {title && <span className="rcs-terminal-tab" data-active>{title}</span>}
          {tabs?.map((t) => (
            <button
              key={t.key}
              className="rcs-terminal-tab"
              data-active={t.active || undefined}
              onClick={() => onTabChange?.(t.key)}
              style={{ background: "transparent", border: 0, cursor: "pointer", color: "inherit" }}
            >
              {t.label}
            </button>
          ))}
          {searchable && (
            <input
              placeholder="filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ marginLeft: "auto", background: "#0F0F0F", color: "#E5E5E5", border: "1px solid #2B2B2B", borderRadius: 3, fontSize: 11, fontFamily: "inherit", padding: "2px 6px", outline: 0 }}
            />
          )}
        </div>
      )}
      <div ref={bodyRef} className="rcs-terminal-body">
        {visible.map((ln, i) => (
          <div key={i} className="rcs-terminal-line" data-type={ln.type}>{ln.text}</div>
        ))}
        {streaming && <span className="rcs-terminal-cursor" />}
      </div>
      {onInput && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (cmd.trim()) { onInput(cmd); setCmd(""); } }}
          style={{ display: "flex", padding: "8px 12px", borderTop: "1px solid #2B2B2B", gap: 8 }}
        >
          <span style={{ color: "#1F9E5C" }}>$</span>
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            style={{ flex: 1, background: "transparent", border: 0, outline: 0, color: "#E5E5E5", fontFamily: "inherit", fontSize: 13 }}
            placeholder="Type a command…"
          />
        </form>
      )}
    </div>
  );
}

// ─── RichTextEditor ───────────────────────────────────────────────────
export function RichTextEditor(props: RichTextEditorProps): React.ReactElement {
  const {
    value, defaultValue, placeholder = "Start writing…",
    toolbar = "compact", minHeight = 120, maxLength,
    readOnly = false, onChange,
    className, style, id,
  } = props;

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const v = isControlled ? value! : internal;
  const ref = React.useRef<HTMLDivElement>(null);
  const lastValRef = React.useRef(v);

  // Sync controlled value into the contenteditable only when it differs
  React.useEffect(() => {
    if (ref.current && ref.current.innerText !== v) {
      ref.current.innerText = v;
    }
    lastValRef.current = v;
  }, [v]);

  const onInput = () => {
    const txt = ref.current?.innerText ?? "";
    if (maxLength && txt.length > maxLength) {
      ref.current!.innerText = lastValRef.current;
      return;
    }
    if (!isControlled) setInternal(txt);
    onChange?.(txt);
    lastValRef.current = txt;
  };

  const wrap = (before: string, after = before) => {
    document.execCommand("insertText", false, before + after);
  };

  return (
    <div id={id} className={cx("rcs-rte", className)} style={style}>
      {toolbar !== "none" && (
        <div className="rcs-rte-toolbar">
          {toolbar !== "inline" && <>
            <button type="button" className="rcs-rte-toolbtn" onClick={() => wrap("**")}><b>B</b></button>
            <button type="button" className="rcs-rte-toolbtn" onClick={() => wrap("*")}><i>I</i></button>
            <button type="button" className="rcs-rte-toolbtn" onClick={() => wrap("`")}>{"</>"}</button>
            <button type="button" className="rcs-rte-toolbtn" onClick={() => wrap("[", "](url)")}>Link</button>
          </>}
        </div>
      )}
      <div
        ref={ref}
        className="rcs-rte-content"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-empty={!v || undefined}
        data-placeholder={placeholder}
        style={{ minHeight }}
        onInput={onInput}
      />
    </div>
  );
}
