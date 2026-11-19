# 3POP

---

3개가 같으면 터진다.
솔로 무한모드와 1:1 대전을 지원하는 것을 목표로 한다.
컴투스의 액션 퍼즐 패밀리 중 엄마의 3단정리에서 영감을 받았다.
이 프로젝트는 컴투스와 무관하다.

## 시작하기

필요한 것: Git, Docker (Docker Desktop 등). Windows는 **WSL2 (Ubuntu) 안에서** 진행하고, 저장소도 WSL 홈 디렉터리(`~/`)에 clone한다.

```bash
git clone https://github.com/UGI1621/3POP.git
cd 3POP
cp .env.example .env
docker compose up
```

| 서비스          | 주소                         | 하는 일                            |
| --------------- | ---------------------------- | ---------------------------------- |
| client          | http://localhost:5173        | Vite 개발 서버 (HMR)               |
| server          | http://localhost:3000/health | API 서버. DB와 redis 상태를 응답   |
| engine          | -                            | `tsc --watch`로 engine을 계속 빌드 |
| postgres, redis | 5432, 6379                   | 개발용 DB                          |

코드를 고치면 컨테이너 안에서 자동으로 반영된다 (client는 HMR, server는 재시작).

자주 쓰는 명령:

```bash
docker compose up -d         # 백그라운드로 실행
docker compose logs -f server
docker compose down          # 종료 (DB 데이터는 유지)
docker compose down -v       # 종료 + DB 데이터 삭제
```

의존성(`package.json`, `pnpm-lock.yaml`)이 바뀌었다면 이미지를 다시 만든다.

```bash
docker compose up --build -V
```

## 로컬 개발 도구 (선택)

에디터의 타입 검사·자동완성, `pnpm check` 실행에는 호스트에도 Node와 pnpm이 필요하다.

| 도구    | 버전    | 고정 위치                         |
| ------- | ------- | --------------------------------- |
| Node.js | 26.13.1 | `.node-version`                   |
| pnpm    | 12.18.0 | `package.json`의 `packageManager` |

1. [fnm](https://github.com/Schniz/fnm#installation)을 설치하고 셸 설정에 추가한다.
   - zsh: `~/.zshrc`에 `eval "$(fnm env --use-on-cd --shell zsh)"`
   - bash: `~/.bashrc`에 `eval "$(fnm env --use-on-cd --shell bash)"`
2. 저장소 폴더에서 아래를 실행한다.
   ```bash
   fnm install
   npm i -g corepack
   corepack enable pnpm
   pnpm install
   ```

Node 버전을 올린 뒤에는 `npm i -g corepack`과 `corepack enable pnpm`을 다시 실행해야 한다 (전역 패키지는 Node 버전마다 따로 설치된다).

## 스크립트

루트에서 실행한다.

| 명령                | 하는 일                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| `pnpm build`        | 모든 패키지를 의존성 순서대로 빌드 (engine → 나머지)                        |
| `pnpm typecheck`    | `packages/*`를 빌드한 뒤 전체 타입 검사                                     |
| `pnpm lint`         | ESLint 검사                                                                 |
| `pnpm format`       | Prettier로 전체 포맷 적용                                                   |
| `pnpm format:check` | 포맷 검사만 수행 (파일 수정 없음)                                           |
| `pnpm clean`        | 모든 패키지의 `dist/` 삭제 (`node_modules`는 유지)                          |
| `pnpm check`        | format:check -> lint -> typecheck -> build 순서로 전체 검증. push 전에 실행 |

## 구조

```
apps/
  client/    # 웹 클라이언트 (Vite)
  server/    # API와 실시간 서버 (Fastify).
packages/
  engine/    # 결정적 게임 규칙 엔진. client와 server가 함께 사용
```

## 개발 규칙

### 브랜치

#### 브랜치 전략

`main` 하나만 오래 유지하고, 모든 작업은 짧게 사는 작업 브랜치에서 한다 (GitHub Flow).

| 브랜치      | 수명 | 설명                                                               |
| ----------- | ---- | ------------------------------------------------------------------ |
| `main`      | 영구 | 항상 빌드와 테스트가 통과하는 상태를 유지한다. **PR로만** 변경한다 |
| 작업 브랜치 | 임시 | 기능 하나, 버그 하나 단위로 만들고, merge한 뒤 삭제한다            |

#### 이름 형식

```
<type>/<description>
```

- `type`: 아래 표의 값 중 하나
- `description`: 작업 내용을 영어 **소문자 kebab-case**로 쓴다
  - 사용 가능한 문자: `a-z`, `0-9`, `-`
  - 관련 패키지가 있으면 앞에 붙인다: `engine-`, `client-`, `server-`
  - 3~5단어 정도로 짧게 쓴다
- GitHub 이슈가 있으면 번호를 앞에 붙인다: `<type>/<이슈번호>-<description>`

| 예시                          | 판정 | 이유                     |
| ----------------------------- | ---- | ------------------------ |
| `feat/engine-prng`            | ✅   |                          |
| `fix/12-combo-score-overflow` | ✅   | 이슈 12번                |
| `feat/EnginePRNG`             | ❌   | 대문자, kebab-case 아님  |
| `feat/engine_prng`            | ❌   | `_` 사용                 |
| `engine-prng`                 | ❌   | type 없음                |
| `feat/stuff`                  | ❌   | 무슨 작업인지 알 수 없음 |

#### type 종류

커밋 메시지(Conventional Commits)의 접두어와 같은 값을 쓴다.

| type       | 언제 쓰나                                             | 예시                          |
| ---------- | ----------------------------------------------------- | ----------------------------- |
| `feat`     | 새 기능                                               | `feat/engine-bar-spawn`       |
| `fix`      | 버그 수정                                             | `fix/client-input-lag`        |
| `refactor` | 동작은 그대로 두고 구조만 개선                        | `refactor/engine-split-board` |
| `perf`     | 성능 개선                                             | `perf/client-render-batch`    |
| `test`     | 테스트만 추가하거나 수정                              | `test/engine-determinism`     |
| `docs`     | 문서만 수정                                           | `docs/game-rules`             |
| `build`    | 빌드 시스템, 의존성, Docker                           | `build/dockerfile-dev`        |
| `ci`       | GitHub Actions 등 CI 설정                             | `ci/lint-workflow`            |
| `chore`    | 위 어디에도 속하지 않는 잡무 (저장소 설정, 도구 설정) | `chore/monorepo-setup`        |

여러 type에 걸친다면 **작업을 나눌 수 있는지** 먼저 생각한다. 나눌 수 없으면 주된 목적의 type을 쓴다.

#### 작업 흐름

1. 최신 `main`에서 브랜치를 만든다
   ```bash
   git switch main
   git pull
   git switch -c feat/engine-prng
   ```
2. 작게 나눠서 커밋한다. 커밋 전에 `pnpm format`과 `pnpm lint`를 실행한다
3. push 전에 전체 검증을 통과시킨다
   ```bash
   pnpm check
   ```
4. push하고 `main`으로 PR을 연다
5. 리뷰가 끝나면 merge한다
6. merge한 브랜치는 삭제한다

### 그 밖의 규칙

- 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 따른다
- `.env` 등 비밀값은 커밋하지 않는다
- AI를 적극 활용하되 AI가 직접 코드를 작성하지 못하도록 한다. (최소한 복사 붙여넣기를 하자.)
