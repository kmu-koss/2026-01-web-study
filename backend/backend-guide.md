# week1 하츄핑 도감 Supabase 백엔드 연결 가이드

이 예제의 목표는 HTML/CSS/JS만 있던 하츄핑 도감을 Supabase 백엔드와 Vercel 배포 구조로 연결하는 것입니다.

```text
브라우저 화면
  -> fetch('/api/...')
  -> Vercel API Function 또는 로컬 Node 서버
  -> Supabase REST API
  -> Supabase Postgres 테이블
```

## 1. 왜 Supabase를 쓰는가

기존 페이지는 도감 데이터가 `script.js` 안에 배열로 들어 있었습니다.

```text
script.js
  seasonEntries = [...]
```

이 방식은 기초 실습에는 좋지만 실제 서비스처럼 설명하기 어렵습니다.

- 데이터를 바꾸려면 프론트엔드 코드를 수정해야 합니다.
- 여러 사용자가 같은 데이터를 공유한다는 느낌이 약합니다.
- 방명록, 댓글, 좋아요처럼 저장되는 기능을 만들기 어렵습니다.
- 배포 후 데이터를 수정하려면 다시 코드를 배포해야 합니다.

이번 버전에서는 시즌 데이터와 응원 메시지를 Supabase 테이블에 저장합니다.

## 2. 폴더 구조

```text
starter_files/
  week1/
    index.html              화면 구조
    style.css               화면 디자인
    script.js               /api를 호출해서 화면 갱신
    backend-guide.md        이 설명 문서

  api/
    health.mjs              GET /api/health
    seasons.mjs             GET /api/seasons
    season-random.mjs       GET /api/season-random
    season.mjs              GET /api/season?id=s1
    messages.mjs            GET, POST /api/messages

  lib/
    supabase.mjs            Vercel API 함수에서 Supabase REST API 호출

  backend/
    server.js               로컬 수업용 Node 서버
    data/seasons.json       Supabase 환경 변수가 없을 때 쓰는 fallback 데이터

  supabase/
    setup.sql               Supabase SQL Editor에서 실행할 테이블/RLS/seed SQL

  .env.example              필요한 환경 변수 예시
  vercel.json               Vercel 라우팅 설정
```

## 3. Supabase 환경 세팅

1. Supabase에서 새 프로젝트를 만듭니다.
2. Supabase Dashboard의 SQL Editor를 엽니다.
3. `supabase/setup.sql` 내용을 전체 복사해서 실행합니다.
4. Project Settings 또는 Connect 화면에서 Project URL을 확인합니다.
5. API Keys에서 publishable key를 확인합니다.
   구버전 프로젝트라 publishable key가 안 보이면 anon key를 사용해도 됩니다.

로컬에서는 프로젝트 루트에 `.env.local`을 만들고 아래처럼 입력합니다.

```text
SUPABASE_URL=https://프로젝트-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

구버전 키를 쓸 경우:

```text
SUPABASE_URL=https://프로젝트-ref.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

절대 넣으면 안 되는 키:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET_KEY
```

이 키들은 RLS를 우회할 수 있으므로 브라우저 코드나 학생 과제 레포에 넣으면 안 됩니다.

## 4. 로컬 실행

Node.js 버전을 확인합니다.

```bash
node -v
```

프로젝트 루트에서 실행합니다.

```bash
node backend/server.js
```

브라우저에서 확인합니다.

```text
http://localhost:3000
http://localhost:3000/api/health
http://localhost:3000/api/seasons
http://localhost:3000/api/messages
```

`/api/health` 응답의 `supabase` 값이 `true`면 Supabase 환경 변수가 잡힌 상태입니다.

## 5. Vercel 배포

Vercel은 `backend/server.js`를 그대로 켜두는 방식이 아니라 `/api` 폴더의 파일을 함수로 실행합니다.

배포 전 Vercel Project Settings의 Environment Variables에 아래 값을 등록합니다.

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

구버전 키를 쓰면 `SUPABASE_ANON_KEY`를 등록합니다.

Vercel Import Project 설정:

```text
Framework Preset: Other
Build Command: 비워두기
Output Directory: 비워두기
Root Directory: 이 starter_files 폴더
```

배포 후 확인 주소:

```text
https://프로젝트명.vercel.app/
https://프로젝트명.vercel.app/api/health
https://프로젝트명.vercel.app/api/seasons
https://프로젝트명.vercel.app/api/messages
```

## 6. 만든 API

| 주소 | 역할 |
| --- | --- |
| `GET /api/health` | 서버와 Supabase 설정 확인 |
| `GET /api/seasons` | Supabase에서 전체 시즌 목록 가져오기 |
| `GET /api/seasons/random` | 랜덤 시즌 1개 가져오기 |
| `GET /api/seasons/s1` | 특정 시즌 1개 가져오기 |
| `GET /api/messages` | 최근 응원 메시지 가져오기 |
| `POST /api/messages` | 응원 메시지 저장하기 |

프론트엔드는 Supabase 주소를 직접 호출하지 않고 항상 `/api/...`를 호출합니다.

## 7. 학생에게 설명할 책임 분리

```text
HTML  = 어디에 보여줄지
CSS   = 어떻게 꾸밀지
JS    = 언제 어떤 API를 부르고 화면을 어떻게 바꿀지
Vercel API = 프론트 요청을 받아 Supabase에 전달
Supabase = 실제 데이터를 저장하고 조회
RLS = 누가 어떤 데이터를 읽고 쓸 수 있는지 제한
```

이번 실습에서 프론트에 남긴 것:

- 버튼, 카드, 폼, 메시지 목록
- 클릭 이벤트와 폼 제출 이벤트
- 로딩/성공/실패 상태 표시

Supabase로 보낸 것:

- 시즌별 도감 데이터
- 사용자가 작성한 응원 메시지
- 메시지 생성 시각

## 8. 수업에서 보여주기 좋은 흐름

브라우저 개발자 도구 Network 탭에서 새로고침합니다.

```text
GET /api/seasons
GET /api/messages
```

응원 메시지를 작성하고 저장 버튼을 누릅니다.

```text
POST /api/messages
GET /api/messages
```

그 다음 Supabase Dashboard의 Table Editor에서 `hachuping_messages` 테이블을 열어 새 행이 생겼는지 확인합니다.

설명 문장:

```text
화면에 입력한 메시지가 브라우저 안에만 있는 게 아니라,
Vercel API를 지나 Supabase 데이터베이스에 저장됐다.
그래서 다른 사람 브라우저에서도 같은 메시지를 볼 수 있다.
```

## 9. 자주 나는 오류

`/api/health`에서 `supabase: false`가 나오는 경우:

```text
.env.local 또는 Vercel 환경 변수에 SUPABASE_URL과 키가 없는 상태입니다.
```

`Supabase 요청 실패: 401`이 나오는 경우:

```text
키가 잘못됐거나 SUPABASE_URL이 다른 프로젝트를 가리키고 있습니다.
```

`Supabase 요청 실패: 404`가 나오는 경우:

```text
setup.sql을 실행하지 않았거나 테이블 이름이 다릅니다.
```

메시지 저장이 안 되는 경우:

```text
RLS insert policy가 없거나 메시지 길이가 check constraint를 통과하지 못한 상태입니다.
```

## 10. 학생 실습 아이디어

1. `hachuping_seasons`에 시즌 7 추가하기
2. `hachuping_messages`에서 메시지 최대 길이를 160자에서 80자로 줄여 보기
3. `/api/messages` 응답 개수를 8개에서 20개로 늘려 보기
4. 메시지에 좋아요 컬럼을 추가하고 버튼 만들기
5. Supabase Table Editor에서 데이터를 수정한 뒤 배포된 화면이 바뀌는지 확인하기
