# Supabase + Vercel 바이브코딩 프롬프트 모음

이 문서는 학생들이 HTML/CSS/JS만 있는 정적 페이지에서 출발해 Supabase 백엔드와 Vercel 배포까지 연결하도록 AI에게 요청할 때 쓰는 프롬프트입니다.

## 수업 전제

학생 프로젝트는 처음에 아래 파일만 있다고 가정합니다.

```text
index.html
style.css
script.js
```

목표 구조는 다음과 같습니다.

```text
브라우저
  -> /api/... 요청
  -> Vercel API Function
  -> Supabase REST API
  -> Supabase Postgres 테이블
```

이 구조의 장점은 학생 프론트엔드 코드가 Supabase 키를 직접 들고 있지 않고, Vercel 환경 변수를 통해 백엔드 함수가 Supabase와 통신한다는 점입니다.

## 가장 중요한 주의사항

AI에게 반드시 지시해야 하는 내용입니다.

```text
service_role key 또는 secret key를 브라우저 JS에 넣지 마.
Supabase URL과 publishable key 또는 anon key는 Vercel 환경 변수로 읽어.
Supabase 테이블은 RLS를 켜고 필요한 select/insert policy만 작성해.
```

Supabase의 publishable key 또는 anon key는 공개 클라이언트에서 쓸 수 있는 낮은 권한 키입니다. 그래도 데이터 접근 권한은 RLS 정책으로 제한해야 합니다.

## 한 번에 요청하는 프롬프트

수업 시간이 짧으면 이 프롬프트 하나로 시작하면 됩니다.

```text
나는 HTML, CSS, JavaScript만 있는 정적 웹페이지를 Supabase 백엔드와 Vercel 배포까지 연결하고 싶어.

현재 파일은 index.html, style.css, script.js야. 기존 디자인과 화면 구조는 최대한 유지해줘.

요구사항:
1. Supabase에 저장할 데이터 모델을 설계해줘.
   - 기존 JS 안에 배열 데이터가 있으면 Supabase 테이블로 옮겨.
   - 사용자가 입력해서 저장할 수 있는 간단한 테이블도 하나 추가해. 예: 방명록, 좋아요, 댓글, 문의 메시지.
2. Supabase SQL Editor에 붙여넣을 수 있는 setup.sql을 만들어줘.
   - create table
   - seed data
   - alter table enable row level security
   - public select policy
   - 필요한 경우 public insert policy
   - service_role key 없이도 동작하도록 anon/authenticated role 기준으로 작성
3. Vercel 배포용 /api 폴더를 만들어줘.
   - 프론트는 /api/...만 호출하게 해줘.
   - API 함수는 process.env.SUPABASE_URL과 process.env.SUPABASE_PUBLISHABLE_KEY를 읽어 Supabase REST API를 호출하게 해줘.
   - 구버전 프로젝트를 위해 process.env.SUPABASE_ANON_KEY도 fallback으로 지원해줘.
   - service_role key는 사용하지 마.
4. 프론트 script.js를 fetch 기반으로 바꿔줘.
   - 페이지 로딩 시 Supabase 데이터 조회
   - 폼 제출 시 POST 요청으로 데이터 저장
   - 로딩 상태와 에러 메시지 표시
   - innerHTML로 사용자 입력을 넣지 말고 textContent나 DOM API를 사용해줘.
5. Vercel 배포 설정을 추가해줘.
   - vercel.json이 필요하면 작성해줘.
   - Build Command와 Output Directory가 필요 없는 정적 사이트 기준으로 설명해줘.
6. .env.example을 만들어줘.
7. 마지막에 내가 따라할 실행 순서를 한국어로 자세히 설명해줘.

제약:
- 프레임워크는 쓰지 마. React, Next.js, Vite 없이 순수 HTML/CSS/JS로 유지해줘.
- npm 패키지 설치가 꼭 필요하지 않다면 Node.js 기본 fetch로 구현해줘.
- 코드는 수업용으로 단순하게 작성해줘.
```

## 단계별 프롬프트

수업에서 학생들에게 과정을 나눠 보여주고 싶으면 아래 순서대로 사용하면 됩니다.

### 1단계: 기존 코드 분석

```text
내 프로젝트에는 index.html, style.css, script.js만 있어.
이 코드에서 백엔드로 옮기면 좋은 데이터와 프론트에 남겨야 하는 UI 로직을 구분해줘.

출력 형식:
- 프론트에 남길 것
- Supabase 테이블로 보낼 것
- 사용자가 입력해서 저장하면 좋은 기능 1개
- 필요한 API 주소 목록
```

### 2단계: Supabase SQL 만들기

```text
방금 분석한 데이터 모델을 기준으로 Supabase SQL Editor에 붙여넣을 setup.sql을 작성해줘.

반드시 포함할 것:
- create table if not exists
- seed data insert
- on conflict update
- alter table enable row level security
- anon, authenticated role용 select policy
- 사용자가 입력하는 테이블에는 insert policy
- 필요한 grant 문

주의:
- service_role key를 전제로 하지 마.
- 공개 읽기와 제한된 공개 쓰기만 허용해.
- 메시지나 댓글 길이 제한 check constraint를 넣어줘.
```

### 3단계: Vercel API 함수 만들기

```text
Supabase 테이블을 호출하는 Vercel API 함수를 만들어줘.

요구사항:
- /api/items 같은 GET API
- /api/messages 같은 GET, POST API
- process.env.SUPABASE_URL 사용
- process.env.SUPABASE_PUBLISHABLE_KEY 사용
- SUPABASE_PUBLISHABLE_KEY가 없으면 SUPABASE_ANON_KEY fallback
- Supabase REST API를 fetch로 호출
- 응답은 Response.json으로 반환
- CORS와 OPTIONS 처리
- 사용자가 입력한 값은 서버에서도 길이 검증

프레임워크 없이 /api/*.mjs 파일로 작성해줘.
```

### 4단계: 프론트 fetch 연결

```text
기존 script.js를 백엔드 API 연동 방식으로 바꿔줘.

요구사항:
- 기존 디자인과 HTML 구조는 최대한 유지
- 기존 JS 배열 데이터는 제거
- 페이지 로딩 시 fetch('/api/items')로 데이터 가져오기
- 폼 제출 시 fetch('/api/messages', { method: 'POST' })로 저장
- 로딩 중, 저장 성공, 저장 실패 메시지 표시
- 사용자 입력값은 innerHTML로 넣지 말고 textContent 또는 createElement 사용
- 백엔드가 꺼져 있거나 환경 변수가 없을 때 학생이 이해할 수 있는 안내 메시지 표시
```

### 5단계: Vercel 배포 안내

```text
이 순수 HTML/CSS/JS + Vercel API + Supabase 프로젝트를 Vercel에 배포하는 방법을 학생용 체크리스트로 작성해줘.

포함할 내용:
- Supabase 프로젝트 생성
- SQL Editor에서 setup.sql 실행
- Supabase URL과 publishable key 확인
- Vercel 환경 변수 등록
- GitHub push
- Vercel Import Project
- Framework Preset, Build Command, Output Directory 설정
- 배포 후 /api/health, /api/items, 실제 화면 확인
- 자주 나는 오류와 해결법
```

## 학생에게 설명할 핵심 문장

```text
Supabase는 데이터베이스와 자동 API를 제공하는 백엔드다.
Vercel은 우리 HTML/CSS/JS 파일과 /api 함수들을 인터넷에 올려주는 배포 플랫폼이다.
프론트엔드는 Supabase를 직접 만지는 대신 /api 주소만 호출한다.
Vercel API 함수가 환경 변수에 저장된 Supabase 키를 사용해서 데이터베이스와 통신한다.
```

## 수업 중 확인할 것

브라우저 개발자 도구 Network 탭에서 아래 요청을 찾게 합니다.

```text
GET /api/seasons
GET /api/messages
POST /api/messages
```

Supabase Dashboard에서는 Table Editor를 열고 `hachuping_messages` 테이블에 새 행이 생기는지 확인합니다.
