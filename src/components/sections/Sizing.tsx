import { SIZE_TABLE } from "@/lib/data/sizeModel";
import SizeFlow from "../diagrams/SizeFlow";

/** 요청 크기별 전술 — size decision flow + table. */
export default function Sizing() {
  return (
    <section id="sizing" className="doc-section">
      <span className="eyebrow">요청 크기별 전술</span>
      <h2>범위에 절차를 맞춘다.</h2>
      <SizeFlow />
      <table>
        <thead>
          <tr>
            <th>크기</th>
            <th>트리거</th>
            <th>절차</th>
            <th>안전망</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_TABLE.map((r, i) => (
            <tr key={i}>
              <td>
                <span className="tag">{r.size}</span>
              </td>
              <td>{r.trigger}</td>
              <td>{r.process}</td>
              <td>{r.safety}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
