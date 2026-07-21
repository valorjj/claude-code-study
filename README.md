# Claude Code 하네스 — 사용 패턴 (claude-code-study)

프로젝트에 무관하게 재사용하는 **Claude Code harness 패턴**을 정리한 단일 페이지 문서를
**Next.js(App Router) + TypeScript**로 포팅한 것. 팀·미래 프로젝트용 레퍼런스.
(원본은 `process-governance`의 자립형 HTML 문서였고, 이 저장소는 그것을 컴포넌트로 분해한 것.)

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 (정적 프리렌더)
npm run lint
```

## 구조

```
src/
├─ app/            layout.tsx · page.tsx (섹션 조립) · globals.css (디자인 토큰 + 스타일)
├─ components/
│  ├─ Sidebar · ProgressBar · MdModalProvider (Monokai 뷰어 + 복사) · FileChip
│  ├─ diagrams/   Walkthrough · ArchDiagram · SizeFlow  (SVG 엣지 계산 + 재생)
│  └─ sections/   Intro · Example · DocsTree · Architecture · Harness · Sizing ·
│                 Quality · Pain · Stuck · Questioning · Adopt
├─ hooks/         useScrollspy · useStepper
└─ lib/           mdHighlight.ts · mdFiles.(ts|json) · data/*.ts
```

- **인터랙션**: 사이드바 스크롤스파이, 결정-흐름 워크스루(재생/속도/단계), 애니메이션
  레이어드 아키텍처(전체화면·루프), 요청-크기 플로우, 파일칩/트리 → 실제 마크다운을
  Monokai Pro 모달로 열람(+복사).
- **콘텐츠**: `src/lib/mdFiles.json`에 참조 파일 원문이 내장(자립형).

## 배포 (Vercel)

Vercel에서 이 저장소를 Import → 프레임워크 프리셋 **Next.js** 자동 감지 → Deploy.
별도 환경변수 없음.
