"use client";
import { hasMdFile } from "@/lib/mdFiles";
import { useMd } from "./MdModalProvider";

type Props = {
  /** file key (path) used to look up embedded content */
  fileKey: string;
  /** visible label; defaults to the key */
  label?: string;
  /** chip = <code> (walkthrough), tree = <span> (file tree) */
  variant?: "chip" | "tree";
};

/**
 * A file reference. When its key has embedded content it becomes clickable and
 * opens the Monokai viewer; otherwise it renders as plain (non-clickable) text.
 */
export default function FileChip({ fileKey, label, variant = "chip" }: Props) {
  const { open } = useMd();
  const text = label ?? fileKey;
  const clickable = hasMdFile(fileKey);

  const handlers = clickable
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          open(fileKey);
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            open(fileKey);
          }
        },
      }
    : {};

  if (variant === "tree") {
    return (
      <span className={clickable ? "tree-file" : undefined} {...handlers}>
        {text}
      </span>
    );
  }
  return (
    <code className={clickable ? "md-clickable" : undefined} {...handlers}>
      {text}
    </code>
  );
}
