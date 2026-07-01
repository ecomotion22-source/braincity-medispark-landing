# 브레인시티 메디스파크 랜딩페이지

## 실행 방법

```bash
node server.js
```

기본 주소:

```bash
http://127.0.0.1:3000
```

## Vercel 배포

Vercel 배포 시에는 정적 파일은 루트에서 서빙되고, 문의 API는 아래 서버리스 엔드포인트를 사용합니다.

```bash
/api/lead
```

환경변수:

```bash
GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

현재 코드에는 기본 Apps Script URL이 들어 있으나, 운영 환경에서는 Vercel 프로젝트 환경변수에도 동일한 값을 넣어두는 것을 권장합니다.

## 리드 저장 위치

관심고객 등록 데이터는 아래 파일에 JSON Lines 형식으로 저장됩니다.

```bash
data/leads.jsonl
```

## 구글시트 동기화

Apps Script 웹앱 URL을 환경변수로 넣으면 등록 데이터가 구글시트에도 함께 전송됩니다.

PowerShell 예시:

```powershell
$env:GOOGLE_APPS_SCRIPT_WEB_APP_URL="https://script.google.com/macros/s/배포아이디/exec"
node server.js
```

## 포함 기능

- 정적 랜딩페이지
- 모바일 고정 CTA
- 관심고객 등록 폼
- 전화상담 사전 입력 후 전화 연결 모달
- 클라이언트 검증
- 로컬 파일 저장형 간단 API
- Google Apps Script 웹앱 연동 지원
