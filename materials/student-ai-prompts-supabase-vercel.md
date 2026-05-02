# 학생용 AI 프롬프트: HTML/CSS/JS에서 Supabase 백엔드 + Vercel 배포까지

이 문서는 HTML/CSS/JS만 있는 정적 웹페이지를 Supabase 백엔드와 Vercel 배포까지 연결할 때, 각 단계에서 AI에게 어떤 프롬프트를 입력하면 되는지 정리한 자료입니다.

## 수업 전제

처음 프로젝트에는 아래 파일만 있다고 가정합니다.

```text
index.html
style.css
script.js
```

최종 목표는 아래 구조입니다.

```text
브라우저
  -> fetch('/api/...')
  -> Vercel API 또는 로컬 Node 서버
  -> Supabase
  -> 데이터 조회/저장
```

## 절대 하지 말아야 할 것

학생들에게 먼저 강조하세요.

```text
Supabase service_role key, secret key는 절대 프론트엔드 코드에 넣지 않는다.
GitHub에 .env.local을 올리지 않는다.
AI에게 secret key 값을 그대로 붙여넣지 않는다.
```

사용해도 되는 키:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

구버전 Supabase 화면이면:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

## 0단계: AI에게 전체 목표 알려주기

처음 AI에게 현재 상황과 목표를 알려줍니다.

```text
나는 HTML, CSS, JavaScript만 있는 정적 웹페이지를 만들었어.
이 페이지를 Supabase 백엔드와 연결하고, Vercel에 무료로 배포하고 싶어.

조건:
- React, Next.js, Vite 같은 프레임워크는 쓰지 마.
- 기존 디자인은 최대한 유지해줘.
- 프론트는 /api/... 주소만 호출하게 해줘.
- Supabase service_role key나 secret key는 절대 사용하지 마.
- Supabase URL과 publishable key는 .env.local과 Vercel 환경 변수로 관리하게 해줘.
- 학생용 수업 자료라서 코드와 설명을 쉽게 작성해줘.

먼저 현재 파일 구조를 읽고, 어떤 데이터를 Supabase로 옮기면 좋을지 분석해줘.
```

## 1단계: 프론트에 있던 데이터 분석시키기

JS 파일 안에 배열 데이터가 있거나 카드 정보가 들어 있으면 Supabase로 옮길 후보입니다.

```text
현재 index.html, style.css, script.js를 기준으로 백엔드로 옮길 데이터와 프론트에 남길 로직을 구분해줘.

출력 형식:
1. Supabase 테이블로 옮길 데이터
2. 프론트엔드에 남길 UI 로직
3. 추가하면 좋은 저장 기능 1개
4. 필요한 API 주소 목록

주의:
- 화면 디자인 변경은 최소화해줘.
- 사용자가 입력해서 저장할 수 있는 기능은 아주 간단한 것으로 제안해줘.
```

예상 결과:

```text
Supabase로 이동:
- 카드 제목
- 설명
- 이미지 URL
- 카테고리
- 상세 정보

프론트에 남김:
- 버튼 클릭
- 카드 렌더링
- 필터
- fetch 호출

추가 저장 기능:
- 방명록
- 댓글
- 좋아요
```

## 2단계: Supabase 프로젝트 만들기

이 단계는 학생이 직접 해야 합니다. AI가 대신 로그인할 수 없습니다.

학생 작업:

```text
1. https://supabase.com 접속
2. 로그인
3. New Project 생성
4. Project URL 확인
5. API Keys에서 publishable key 확인
```

이때 AI에게 물어볼 프롬프트:

```text
Supabase에서 새 프로젝트를 만들었어.
내가 이제 Project URL과 publishable key를 찾아야 해.
Supabase 화면에서 어디로 들어가야 하는지 단계별로 알려줘.

주의:
- service_role key는 사용하지 않는다고 다시 강조해줘.
- 내가 .env.local에 어떤 이름으로 저장해야 하는지도 알려줘.
```

## 3단계: Supabase SQL 만들기

AI에게 데이터베이스 테이블과 RLS 정책을 만들게 합니다.

```text
내 정적 웹페이지 데이터를 Supabase에 저장하려고 해.
Supabase SQL Editor에 붙여넣을 setup.sql을 만들어줘.

요구사항:
1. 기존 JS 배열 데이터를 저장할 메인 테이블을 만들어줘.
2. 사용자가 입력해서 저장할 수 있는 테이블도 하나 만들어줘. 예: messages, comments, likes.
3. create table if not exists를 사용해줘.
4. 샘플 데이터를 insert 해줘.
5. on conflict update를 넣어서 다시 실행해도 깨지지 않게 해줘.
6. Row Level Security를 켜줘.
7. 누구나 읽을 수 있는 select policy를 만들어줘.
8. 사용자가 입력하는 테이블에는 insert policy를 만들어줘.
9. 입력값 길이 제한 check constraint를 넣어줘.
10. 필요한 grant 문도 포함해줘.

주의:
- service_role key를 전제로 하지 마.
- anon, authenticated role 기준으로 작성해줘.
- SQL 파일을 supabase/setup.sql로 저장해줘.
```

학생 작업:

```text
1. AI가 만든 supabase/setup.sql 열기
2. 전체 복사
3. Supabase SQL Editor에 붙여넣기
4. Run 실행
5. Table Editor에서 테이블 생성 확인
```

## 4단계: 환경 변수 파일 만들기

AI에게 `.env.example`을 만들게 하고, 학생은 `.env.local`을 직접 만듭니다.

```text
Supabase 연결에 필요한 환경 변수 예시 파일을 만들어줘.

요구사항:
- .env.example 파일 생성
- SUPABASE_URL 포함
- SUPABASE_PUBLISHABLE_KEY 포함
- 구버전 Supabase를 위해 SUPABASE_ANON_KEY 예시도 주석으로 포함
- .env.local은 GitHub에 올리면 안 된다고 설명해줘
- .gitignore에 .env.local이 무시되는지 확인해줘
```

학생이 직접 만드는 `.env.local`:

```text
SUPABASE_URL=https://프로젝트-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

구버전 키 사용 시:

```text
SUPABASE_URL=https://프로젝트-ref.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

## 5단계: 로컬 백엔드 만들기

Vercel 배포 전에도 로컬에서 `/api/...`를 테스트할 수 있게 Node 서버를 만듭니다.

```text
로컬에서 실행할 Node.js 백엔드 서버를 만들어줘.

요구사항:
1. backend/server.js 생성
2. Node.js 기본 http 모듈 사용
3. Express 설치 없이 작성
4. .env.local을 읽어서 SUPABASE_URL과 SUPABASE_PUBLISHABLE_KEY를 사용
5. SUPABASE_PUBLISHABLE_KEY가 없으면 SUPABASE_ANON_KEY fallback
6. GET /api/health 만들기
7. GET /api/items 또는 /api/seasons 만들기
8. GET /api/messages 만들기
9. POST /api/messages 만들기
10. 사용자 입력값은 서버에서도 검증
11. index.html, style.css, script.js도 같은 서버에서 열리게 정적 파일 서빙
12. 환경 변수가 없을 때 학생이 이해할 수 있는 에러 메시지를 반환

추가:
- package.json에 "start": "node backend/server.js" 스크립트도 넣어줘.
```

학생 실행:

```bash
npm start
```

또는:

```bash
node backend/server.js
```

확인:

```text
http://localhost:3000
http://localhost:3000/api/health
http://localhost:3000/api/seasons
```

## 6단계: Vercel API 함수 만들기

Vercel 배포 후에는 `backend/server.js`가 아니라 `api/` 폴더의 함수가 백엔드 역할을 합니다.

```text
Vercel 배포용 API 함수를 만들어줘.

요구사항:
1. api/ 폴더 생성
2. api/health.mjs 생성
3. api/seasons.mjs 또는 api/items.mjs 생성
4. api/messages.mjs 생성
5. 필요한 경우 api/season.mjs, api/season-random.mjs 같은 세부 API 생성
6. 공통 Supabase 연결 코드는 lib/supabase.mjs로 분리
7. 각 API 파일은 export async function GET 또는 POST 형태로 작성
8. Response.json으로 응답
9. CORS와 OPTIONS 처리
10. Vercel 환경 변수 process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY 사용
11. SUPABASE_ANON_KEY fallback 지원
12. service_role key는 사용하지 마
```

설명용 구조:

```text
api/*.mjs = API 주소별 입구
lib/supabase.mjs = Supabase와 통신하는 공통 도구
```

## 7단계: 프론트엔드 fetch 연결

기존 JS 배열을 제거하고 API에서 데이터를 받아오게 합니다.

```text
기존 script.js를 백엔드 API와 연결해줘.

요구사항:
1. JS 안에 있던 하드코딩 배열 데이터를 제거
2. 페이지 로딩 시 fetch('/api/seasons') 또는 fetch('/api/items') 호출
3. 받은 JSON 데이터로 카드 렌더링
4. 사용자가 폼을 제출하면 fetch('/api/messages', { method: 'POST' }) 호출
5. 저장 성공 후 메시지 목록 다시 불러오기
6. 로딩 상태 표시
7. 에러 상태 표시
8. 사용자 입력값은 innerHTML로 넣지 말고 textContent 또는 createElement 사용
9. 기존 디자인과 CSS는 최대한 유지
10. 로컬 Live Server와 node backend/server.js 환경 둘 다 고려해서 API_BASE_URL 처리
```

## 8단계: 로컬 테스트 시키기

AI에게 테스트 명령과 체크리스트를 만들게 합니다.

```text
지금까지 만든 Supabase 백엔드 연결이 로컬에서 잘 되는지 테스트하는 명령과 체크리스트를 만들어줘.

포함할 것:
1. node --check로 JS 문법 검사
2. npm start 또는 node backend/server.js 실행
3. /api/health 확인
4. /api/seasons 확인
5. /api/messages 확인
6. 브라우저에서 화면 확인
7. 메시지 저장 후 Supabase Table Editor에서 행 생성 확인
8. 자주 나는 오류와 해결 방법
```

학생이 확인할 주소:

```text
http://localhost:3000/api/health
http://localhost:3000/api/seasons
http://localhost:3000/api/messages
```

## 9단계: Vercel 배포 설정 만들기

```text
이 프로젝트를 Vercel에 배포할 수 있게 설정해줘.

요구사항:
1. vercel.json 생성
2. / 주소가 index.html 또는 week1/index.html로 연결되게 rewrite 작성
3. /api/seasons/random 같은 주소가 있다면 필요한 rewrite 작성
4. package.json의 scripts 정리
5. Build Command와 Output Directory를 비워도 되는 구조인지 설명
6. Vercel 환경 변수에 SUPABASE_URL과 SUPABASE_PUBLISHABLE_KEY를 등록해야 한다고 안내
```

Vercel 환경 변수:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

또는:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

## 10단계: Vercel 배포하기

학생이 Vercel 웹사이트로 배포하는 방식입니다.

```text
Vercel에 이 프로젝트를 무료로 배포하는 방법을 학생용으로 단계별 체크리스트로 작성해줘.

포함할 것:
1. Vercel 로그인
2. Add New Project
3. GitHub 레포 선택
4. Framework Preset은 Other
5. Build Command 비우기
6. Output Directory 비우기
7. Environment Variables에 Supabase 값 등록
8. Deploy 클릭
9. 배포 후 확인 주소
10. /api/health에서 supabase: true 확인
```

CLI로 배포할 경우:

```text
Vercel CLI로 배포하는 방법도 알려줘.

포함할 명령:
- vercel.cmd login
- vercel.cmd link --yes
- vercel.cmd env add SUPABASE_URL production
- vercel.cmd env add SUPABASE_PUBLISHABLE_KEY production
- vercel.cmd deploy --prod --yes

PowerShell에서는 vercel 대신 vercel.cmd를 쓰라고 설명해줘.
```

## 11단계: 배포 후 검증

```text
Vercel 배포가 끝난 뒤 확인해야 할 체크리스트를 만들어줘.

확인할 것:
1. 메인 페이지 접속
2. /api/health 접속
3. /api/health에서 supabase: true 확인
4. /api/seasons 데이터 개수 확인
5. 화면에 카드가 정상 렌더링되는지 확인
6. 메시지 저장 테스트
7. Supabase Table Editor에서 새 메시지 행 확인
8. Network 탭에서 GET /api/seasons, POST /api/messages 확인
```

## 12단계: 학생 오류 해결 프롬프트

오류가 났을 때는 학생이 에러 메시지를 AI에게 보여주게 합니다.

```text
아래 에러가 났어. 원인을 단계별로 분석하고 해결 방법을 알려줘.

현재 상황:
- 실행한 명령:
- 현재 폴더 경로:
- 브라우저 주소:
- 에러 메시지:
- .env.local에 들어 있는 변수 이름만:

주의:
- .env.local의 실제 key 값은 출력하지 않을게.
- service_role key는 쓰지 않을 거야.
```

자주 나는 오류:

```text
npm error Missing script: "start"
  -> package.json이 있는 폴더에서 실행하지 않은 것

/api/health에서 supabase: false
  -> .env.local 또는 Vercel 환경 변수가 없는 것

Supabase 요청 실패: 401
  -> 키가 틀렸거나 URL이 다른 프로젝트 것

Supabase 요청 실패: 404
  -> setup.sql을 실행하지 않았거나 테이블 이름이 다름

Vercel GitHub 자동 연결 실패
  -> Vercel GitHub App이 해당 organization/repository 접근 권한을 못 받은 것
```

## 한 줄 요약

학생에게 전체 흐름을 이렇게 설명하면 됩니다.

```text
프론트는 화면을 만들고 /api로 요청한다.
백엔드는 /api 요청을 받아 Supabase와 통신한다.
Supabase는 실제 데이터를 저장한다.
Vercel은 프론트와 API를 인터넷에 배포한다.
```
