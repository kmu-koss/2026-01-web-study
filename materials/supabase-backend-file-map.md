# Supabase 백엔드 파일 구조 설명

이 문서는 이번 실습에서 새로 추가한 백엔드/Supabase 관련 파일이 각각 무슨 역할을 하는지 설명합니다.

전체 흐름은 아래와 같습니다.

```text
브라우저 week1 화면
  -> fetch('/api/...')
  -> api/ 폴더의 Vercel API 함수
  -> lib/supabase.mjs
  -> Supabase 데이터베이스
```

로컬에서 연습할 때는 Vercel 대신 `backend/server.js`가 같은 역할을 흉내냅니다.

```text
브라우저 week1 화면
  -> http://localhost:3000/api/...
  -> backend/server.js
  -> Supabase 데이터베이스
```

## 1. supabase 폴더

```text
supabase/
  setup.sql
```

`supabase/` 폴더는 Supabase 대시보드에서 실행할 데이터베이스 준비 파일을 넣어둔 곳입니다.

### supabase/setup.sql

Supabase SQL Editor에 그대로 붙여넣어 실행하는 파일입니다.

이 파일이 하는 일:

- `hachuping_seasons` 테이블 생성
- 시즌 1~6 하츄핑 데이터 넣기
- `hachuping_messages` 테이블 생성
- 사용자가 남긴 응원 메시지를 저장할 구조 만들기
- Row Level Security, RLS 켜기
- 누구나 시즌 데이터를 읽을 수 있게 `select` 정책 만들기
- 누구나 응원 메시지를 저장할 수 있게 `insert` 정책 만들기
- 메시지 닉네임과 내용 길이 제한 걸기

수업에서 이렇게 설명하면 됩니다.

```text
supabase/setup.sql은 데이터베이스를 처음 세팅하는 설계도다.
테이블을 만들고, 기본 데이터를 넣고, 누가 읽고 쓸 수 있는지 규칙까지 정한다.
```

중요한 점:

- 이 파일은 브라우저에서 실행하는 파일이 아닙니다.
- Node.js로 실행하는 파일도 아닙니다.
- Supabase Dashboard의 SQL Editor에서 실행합니다.

## 2. backend 폴더

```text
backend/
  server.js
  package.json
  data/
    seasons.json
```

`backend/` 폴더는 로컬 수업용 Node.js 서버입니다.

Vercel에 배포하면 실제로는 `api/` 폴더의 함수들이 백엔드 역할을 합니다. 하지만 수업 중에는 배포하기 전에도 브라우저에서 바로 테스트해야 하므로, 로컬용 서버를 따로 둔 것입니다.

### backend/server.js

로컬에서 실행하는 백엔드 서버입니다.

실행 명령:

```bash
node backend/server.js
```

이 파일이 하는 일:

- `http://localhost:3000` 주소로 week1 화면 열기
- `GET /api/health` 처리
- `GET /api/seasons` 처리
- `GET /api/seasons/random` 처리
- `GET /api/seasons/s1` 같은 특정 시즌 조회 처리
- `GET /api/messages` 처리
- `POST /api/messages` 처리
- `.env.local`에서 Supabase 환경 변수 읽기
- Supabase 환경 변수가 있으면 Supabase에서 데이터 가져오기
- Supabase 환경 변수가 없으면 `backend/data/seasons.json`을 임시 데이터로 사용하기

수업에서 이렇게 설명하면 됩니다.

```text
backend/server.js는 내 컴퓨터에서만 켜는 연습용 백엔드다.
배포 전에 /api 요청이 어떻게 동작하는지 확인하게 해준다.
```

### backend/package.json

`backend` 폴더 안에서 `npm start`를 쓸 수 있게 해주는 작은 설정 파일입니다.

```bash
cd backend
npm start
```

위 명령은 내부적으로 아래 명령과 같습니다.

```bash
node server.js
```

### backend/data/seasons.json

Supabase 환경 변수가 없을 때 화면이 완전히 깨지지 않도록 넣어둔 예비 데이터입니다.

예를 들어 아직 `.env.local`을 만들지 않았어도 아래 주소는 동작합니다.

```text
http://localhost:3000/api/seasons
```

하지만 메시지 저장은 Supabase가 있어야 합니다.

```text
POST /api/messages
```

이 요청은 실제 데이터베이스에 저장해야 하므로 Supabase 환경 변수가 없으면 저장되지 않습니다.

## 3. api 폴더

```text
api/
  health.mjs
  seasons.mjs
  season-random.mjs
  season.mjs
  messages.mjs
```

`api/` 폴더는 Vercel 배포용 백엔드 함수입니다.

Vercel에 배포하면 `/api` 폴더의 파일들이 자동으로 API처럼 동작합니다.

### api/health.mjs

서버와 Supabase 설정 상태를 확인합니다.

```text
GET /api/health
```

응답 예시:

```json
{
  "ok": true,
  "supabase": true,
  "message": "하츄핑 Vercel API가 실행 중입니다."
}
```

### api/seasons.mjs

전체 시즌 데이터를 가져옵니다.

```text
GET /api/seasons
```

### api/season-random.mjs

랜덤 시즌 1개를 가져옵니다.

```text
GET /api/seasons/random
```

실제 파일명은 `season-random.mjs`지만, `vercel.json`에서 주소를 연결해뒀기 때문에 사용자는 `/api/seasons/random`으로 접근합니다.

### api/season.mjs

특정 시즌 1개를 가져옵니다.

```text
GET /api/seasons/s3
```

이 주소도 `vercel.json`에서 내부적으로 아래처럼 바꿔 연결합니다.

```text
/api/season?id=s3
```

### api/messages.mjs

응원 메시지를 가져오거나 저장합니다.

```text
GET /api/messages
POST /api/messages
```

`GET`은 최근 메시지를 가져오고, `POST`는 사용자가 입력한 메시지를 Supabase에 저장합니다.

## 4. lib 폴더

```text
lib/
  supabase.mjs
```

`lib/` 폴더는 API 함수들이 같이 쓰는 공통 코드를 넣어둔 곳입니다.

### lib/supabase.mjs

이 파일이 하는 일:

- `SUPABASE_URL` 읽기
- `SUPABASE_PUBLISHABLE_KEY` 또는 `SUPABASE_ANON_KEY` 읽기
- Supabase REST API 호출
- 시즌 데이터 모양을 프론트에서 쓰기 좋게 바꾸기
- 메시지 입력값 검증
- JSON 응답 만들기
- CORS와 OPTIONS 응답 처리

수업에서 이렇게 설명하면 됩니다.

```text
api 폴더의 함수들이 매번 같은 코드를 반복하지 않도록,
Supabase와 통신하는 공통 기능을 lib/supabase.mjs에 모아둔 것이다.
```

## 5. 각 폴더를 한 문장으로 정리

```text
supabase/ = 데이터베이스를 만드는 설계도
backend/  = 내 컴퓨터에서 실행하는 로컬 백엔드
api/      = Vercel에 배포되는 진짜 API 함수
lib/      = API 함수들이 같이 쓰는 Supabase 연결 코드
```

## 6. 학생들에게 보여줄 순서

1. `supabase/setup.sql`을 열어 테이블과 RLS 정책을 보여줍니다.
2. Supabase SQL Editor에서 실행합니다.
3. `.env.local`에 Supabase URL과 key를 넣습니다.
4. `node backend/server.js`로 로컬 백엔드를 켭니다.
5. `http://localhost:3000/api/health`에서 `supabase: true`를 확인합니다.
6. `http://localhost:3000`에서 메시지를 저장합니다.
7. Supabase Table Editor에서 저장된 메시지를 확인합니다.
8. GitHub에 push한 뒤 Vercel에 배포합니다.
9. Vercel 환경 변수에도 Supabase URL과 key를 넣습니다.
10. 배포 주소에서 `/api/health`와 화면을 다시 확인합니다.
