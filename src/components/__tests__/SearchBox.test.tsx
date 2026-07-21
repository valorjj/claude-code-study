import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SearchBox from "@/components/SearchBox";
import MdModalProvider from "@/components/MdModalProvider";

beforeEach(() => {
  window.location.hash = "";
});

describe("SearchBox", () => {
  it("shows a section result when typing a section title (no file load)", () => {
    render(<SearchBox />);
    fireEvent.change(screen.getByLabelText("검색"), { target: { value: "질문" } });
    expect(screen.getByText("질문 설계 · 3가지 케이스")).toBeTruthy();
  });

  it("renders results as options", () => {
    render(<SearchBox />);
    fireEvent.change(screen.getByLabelText("검색"), { target: { value: "관리" } });
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("Enter on a section result sets the location hash", () => {
    render(<SearchBox />);
    const input = screen.getByLabelText("검색");
    fireEvent.change(input, { target: { value: "질문" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(window.location.hash).toBe("#questioning");
  });

  it("Enter on a file result opens the Monokai viewer", async () => {
    render(
      <MdModalProvider>
        <SearchBox />
      </MdModalProvider>,
    );
    const input = screen.getByLabelText("검색");
    fireEvent.focus(input); // triggers lazy file-index load
    fireEvent.change(input, { target: { value: "CLAUDE.md" } });
    // Scoped to the label: several docs' content also contains "CLAUDE.md",
    // producing <mark>CLAUDE.md</mark> excerpt highlights that would otherwise
    // also match an unscoped findByText and make this query ambiguous.
    await screen.findByText("CLAUDE.md", { selector: ".search-label" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(document.querySelector(".md-path")?.textContent).toBe("CLAUDE.md");
    });
  });

  it("dismisses the results list after the input blurs", async () => {
    render(<SearchBox />);
    const input = screen.getByLabelText("검색");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "질문" } });
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });
});
