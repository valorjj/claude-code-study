"use client";
import { Fragment, useState } from "react";
import { HARNESS_ROWS } from "@/lib/data/harnessRows";
import FileChip from "./FileChip";
import "./HarnessTable.css";

/**
 * Harness element table with accordion rows. Clicking a row expands a detail
 * panel (what it is / why it matters + real-code FileChips that open the Monokai
 * viewer). One row open at a time. Rows/cells stay a real <table> so it reads as
 * data; the detail is a full-width row beneath the clicked one.
 */
export default function HarnessTable() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <table className="harness-table">
      <thead>
        <tr>
          <th>요소</th>
          <th>역할</th>
          <th>저장 위치</th>
          <th>로드 시점</th>
          <th>스코프</th>
        </tr>
      </thead>
      <tbody>
        {HARNESS_ROWS.map((r) => {
          const open = openId === r.id;
          const detailId = `harness-detail-${r.id}`;
          return (
            <Fragment key={r.id}>
              <tr
                className={`harness-row${open ? " open" : ""}`}
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-controls={detailId}
                onClick={() => setOpenId(open ? null : r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(open ? null : r.id);
                  }
                }}
              >
                <td>
                  <span className="harness-caret" aria-hidden="true" />
                  {r.code ? <code>{r.code}</code> : null}
                  {r.code ? ` ${r.label}` : r.label}
                </td>
                <td>{r.role}</td>
                <td>{r.locCode ? <code>{r.loc}</code> : r.loc}</td>
                <td>{r.when}</td>
                <td>{r.scope}</td>
              </tr>
              {open && (
                <tr className="harness-detail-row">
                  <td colSpan={5}>
                    <div className="harness-detail" id={detailId}>
                      <p className="harness-what">{r.what}</p>
                      <p className="harness-why">{r.why}</p>
                      {r.files.length > 0 && (
                        <div className="harness-examples">
                          <span className="harness-examples-label">실제 예시</span>
                          {r.files.map((f) => (
                            <FileChip key={f} fileKey={f} />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
