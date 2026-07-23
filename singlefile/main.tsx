import { createRoot } from "react-dom/client";
import "../src/app/globals.css";
import "../src/app/page.css";
import MdModalProvider from "@/components/MdModalProvider";
import PageBody from "@/components/PageBody";

// Single-file entry: renders the same tree as the Next app (layout wraps the page
// body in MdModalProvider) into #root. vite-plugin-singlefile inlines this bundle,
// all CSS, and the dynamic mdFiles.json import into one self-contained HTML.
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <MdModalProvider>
      <PageBody />
    </MdModalProvider>,
  );
}
