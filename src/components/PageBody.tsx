import ProgressBar from "@/components/ProgressBar";
import Sidebar from "@/components/Sidebar";
import Intro from "@/components/sections/Intro";
import Example from "@/components/sections/Example";
import DocsTree from "@/components/sections/DocsTree";
import Architecture from "@/components/sections/Architecture";
import Harness from "@/components/sections/Harness";
import Sizing from "@/components/sections/Sizing";
import Quality from "@/components/sections/Quality";
import Pain from "@/components/sections/Pain";
import Stuck from "@/components/sections/Stuck";
import Questioning from "@/components/sections/Questioning";
import Adopt from "@/components/sections/Adopt";

/**
 * Shared page body — the section order lives here as the single source of truth
 * (keep in lockstep with `src/lib/data/toc.ts`). Rendered by both the Next entry
 * (`app/page.tsx`) and the single-file Vite entry (`singlefile/main.tsx`), so the
 * live site and the exported HTML never diverge. Framework-neutral: no CSS import
 * here — each toolchain root owns its stylesheet imports.
 */
export default function PageBody() {
  return (
    <>
      <ProgressBar />
      <div className="layout">
        <Sidebar />
        <main className="content">
          <Intro />
          <Architecture />
          <Example />
          <DocsTree />
          <Harness />
          <Sizing />
          <Quality />
          <Pain />
          <Stuck />
          <Questioning />
          <Adopt />
        </main>
      </div>
    </>
  );
}
