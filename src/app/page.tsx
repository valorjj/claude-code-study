import "./page.css";
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

export default function Home() {
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
