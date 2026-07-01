# 브레인시티 메디스파크 분양 랜딩 페이지

아파트 분양 랜딩 페이지 프로젝트입니다.  
관심고객 등록, 전화상담 유도, Google Sheets 연동, Vercel 배포까지 포함한 구조로 구성되어 있습니다.

## 주요 기능

- 분양 랜딩 페이지 UI
- 상담문의 CTA 및 전화상담 유도
- 관심고객 등록 폼
- Google Apps Script를 통한 Google Sheets 연동
- 로컬 개발 서버 지원
- Vercel 배포 지원

## 기술 구성

- HTML
- CSS
- Vanilla JavaScript
- Node.js 로컬 서버
- Vercel Serverless Functions
- Google Apps Script

## 폴더 구조

```text
apt/
├─ api/
│  ├─ health.js
│  └─ lead.js
├─ data/
│  └─ leads.jsonl
├─ google-apps-script/
│  └─ Code.gs
├─ index.html
├─ styles.css
├─ script.js
├─ server.js
├─ local-server.js
├─ vercel.json
└─ README.md
```

## 로컬 실행

### 1. 서버 실행

```bash
node local-server.js
```

### 2. 접속 주소

```bash
http://127.0.0.1:3000
```

## 환경변수

Google Sheets 연동용 Apps Script URL은 아래 환경변수로 설정할 수 있습니다.

```bash
GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

PowerShell 예시:

```powershell
$env:GOOGLE_APPS_SCRIPT_WEB_APP_URL="https://script.google.com/macros/s/배포아이디/exec"
node local-server.js
```

설정하지 않아도 현재 코드에는 기본 Apps Script URL이 들어가 있지만, 운영 환경에서는 Vercel 환경변수에 동일하게 등록하는 방식을 권장합니다.

## 문의 데이터 저장 방식

### 로컬 개발 환경

관심고객 등록 데이터는 아래 파일에 저장됩니다.

```text
data/leads.jsonl
```

### 운영 배포 환경

- 랜딩 페이지: 정적 파일 제공
- 문의 API: `/api/lead`
- 헬스체크 API: `/api/health`
- Google Sheets 전송: Apps Script Web App으로 전달

## Vercel 배포

이 프로젝트는 Vercel에 배포할 수 있도록 설정되어 있습니다.

### 배포 시 확인할 항목

- GitHub 저장소 연결
- Vercel 프로젝트 생성
- 환경변수 `GOOGLE_APPS_SCRIPT_WEB_APP_URL` 등록
- 배포 후 `/api/health` 정상 응답 확인

예시:

```text
https://your-project.vercel.app/api/health
```

정상 응답 예시:

```json
{"ok":true,"runtime":"vercel"}
```

## Google Sheets 연동

문의 등록 시 데이터는 Google Apps Script Web App으로 전달되며, 연결된 Google Spreadsheet에 기록됩니다.

관련 파일:

- `google-apps-script/Code.gs`
- `구글시트_앱스크립트_연동_설정가이드.md`

## 주요 파일 설명

- `index.html`: 랜딩 페이지 마크업
- `styles.css`: 전체 스타일 및 반응형 UI
- `script.js`: 폼 제출, 전화상담 모달, 인터랙션 처리
- `local-server.js`: 로컬 개발용 서버
- `server.js`: Vercel/Node 엔트리 서버
- `api/lead.js`: 문의 등록 API
- `api/health.js`: 상태 확인 API
- `vercel.json`: Vercel 배포 설정

## 상담 대표 번호

```text
010-6689-2348
```

## 참고 문서

- `분양_랜딩_홈페이지_분석보고서.md`
- `아파트_분양_랜딩페이지_퍼널마케팅_기획서.md`
- `구글시트_앱스크립트_연동_설정가이드.md`

## 메모

운영 배포 시에는 아래 항목을 최종 점검하는 것을 권장합니다.

- 푸터 정보 노출 확인
- 폼 제출 후 Google Sheets 적재 확인
- 모바일 CTA 동작 확인
- 전화상담 버튼 동작 확인
- 개인정보 동의 체크 플로우 확인
