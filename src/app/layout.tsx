import type { Metadata } from "next";
import "./globals.css";
import MdModalProvider from "@/components/MdModalProvider";

export const metadata: Metadata = {
  title: "Claude Code 하네스 — 사용 패턴 요약",
  description: "프로젝트 무관 · 재사용 가능한 Claude Code harness 패턴 요약 (팀·미래 프로젝트용)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Set the theme before first paint to avoid a flash: saved choice wins,
            else fall back to the OS preference. Kept inline + tiny on purpose. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('pap-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <MdModalProvider>{children}</MdModalProvider>
      </body>
    </html>
  );
}
