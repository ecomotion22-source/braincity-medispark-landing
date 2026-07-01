# 브레인시티 메디스파크 분양 랜딩 페이지

## 로컬 실행

```bash
node local-server.js
```

기본 주소:

```bash
http://127.0.0.1:3000
```

## Vercel 배포 구조

- 정적 파일: `index.html`, `styles.css`, `script.js`, 이미지 자산
- 문의 API: `api/lead.js`
- 헬스체크 API: `api/health.js`

문의 등록은 브라우저에서 `/api/lead`로 전송되며, Vercel에서는 서버리스 함수로 처리됩니다.

## 환경변수

```bash
GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

현재 코드에는 기본 Apps Script URL이 포함되어 있지만, 운영 환경에서는 Vercel 프로젝트 환경변수에도 동일한 값을 넣는 것을 권장합니다.

## 로컬 리드 저장

로컬 개발 서버에서는 문의 데이터를 아래 파일에 JSON Lines 형식으로 저장합니다.

```bash
data/leads.jsonl
```

## 구글시트 연동 예시

```powershell
$env:GOOGLE_APPS_SCRIPT_WEB_APP_URL="https://script.google.com/macros/s/배포아이디/exec"
node local-server.js
```

## 포함 기능

- 분양 랜딩 페이지
- 전화상담 사전 접수 후 전화 연결
- 상담문의 폼 등록
- Google Apps Script / Google Sheets 연동
- Vercel 서버리스 API 배포
