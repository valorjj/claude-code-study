import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { TOC } from "@/lib/data/toc";

describe("page ↔ TOC coverage", () => {
  it("renders a section element for every TOC id", () => {
    render(<Home />);
    for (const { id } of TOC) {
      expect(document.getElementById(id), `no <section id="${id}"> rendered`).toBeTruthy();
    }
  });

  it("has unique TOC ids", () => {
    const ids = TOC.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
