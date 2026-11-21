"use client";

import React from "react";

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renderiza Markdown básico (títulos, negrito, itálico, código inline, listas e tabelas)
 * usando apenas elementos React — zero dangerouslySetInnerHTML (100% seguro contra XSS).
 */
export function SafeMarkdown({ content, className = "" }: SafeMarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-2 break-words ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const headingClass =
            block.level === 1
              ? "text-[13.5px] font-bold text-[#101828]"
              : "text-[12.5px] font-bold text-[#101828]";
          return (
            <p key={idx} className={`${headingClass} pt-0.5`}>
              {renderInline(block.text, `h-${idx}`)}
            </p>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={idx} className="list-disc space-y-1 pl-4">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInline(item, `ul-${idx}-${itemIdx}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={idx} className="list-decimal space-y-1 pl-4">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInline(item, `ol-${idx}-${itemIdx}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={idx}
              className="overflow-x-auto rounded-xl border border-[#EAE3DB] bg-[#FBF9F6]"
            >
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#EAE3DB] bg-[#F4F0EA]">
                    {block.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-2.5 py-1.5 font-semibold text-[#101828]"
                      >
                        {renderInline(header, `th-${idx}-${hIdx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE2]">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-2.5 py-1.5 text-[#344054]"
                        >
                          {renderInline(cell, `td-${idx}-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {block.lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInline(line, `p-${idx}-${lIdx}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "paragraph"; lines: string[] };

function isTableDivider(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const stripped = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  const cells = stripped.split("|").map((c) => c.trim());
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Linha horizontal --- ou ***
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      i += 1;
      continue;
    }

    // Cabeçalho (#, ##, ###)
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    // Tabela Markdown
    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isTableDivider(lines[i + 1])
    ) {
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Lista com marcadores (- ou * ou •)
    if (/^(?:[-*•])\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^(?:[-*•])\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^(?:[-*•])\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Lista numerada (1. item)
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Parágrafo normal (agrupa linhas consecutivas até linha vazia ou novo bloco)
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const curr = lines[i].trim();
      if (
        !curr ||
        /^(#{1,4})\s+/.test(curr) ||
        /^(?:[-*•])\s+/.test(curr) ||
        /^\d+[.)]\s+/.test(curr) ||
        /^(?:-{3,}|\*{3,}|_{3,})$/.test(curr) ||
        (curr.includes("|") &&
          i + 1 < lines.length &&
          isTableDivider(lines[i + 1]))
      ) {
        break;
      }
      paragraphLines.push(lines[i]);
      i += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraphLines });
    }
  }

  return blocks;
}

const INLINE_TOKEN_REGEX =
  /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|`[^`\n]+?`|\*[^*\n]+?\*)/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_REGEX)) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const key = `${keyPrefix}-${matchIndex++}`;
    if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      nodes.push(
        <strong key={key} className="font-semibold text-[#101828]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-[#F5F2EC] px-1 py-0.5 font-mono text-[11px] text-[#C84A00]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      nodes.push(token);
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Remove marcações Markdown antes de enviar texto para leitura em voz alta (TTS).
 */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\|/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
