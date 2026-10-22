# TwoPlace 웹 · GAS · JSON 저장

## 주소와 저장 위치

- GitHub 소스: https://github.com/SerenLucent/APP/tree/main/TwoPlace
- 웹 배포 주소: https://serenlucent.github.io/APP/TwoPlace/
- 관리자 화면: https://serenlucent.github.io/APP/TwoPlace/admin.html
- GAS 프로젝트: https://script.google.com/home/projects/1iNQywp2xwwsPpaZMVL4mbTp52XYbcUEh8nY35cXIoZ8ycTwIqm5AkzmR/edit

위 웹 주소는 GitHub Pages 배포에 성공한 뒤 사용할 수 있습니다. GAS 연결은 별도 배포 및 `TWOPLACE_GAS_URL` 설정이 필요합니다. `localhost`는 공개 주소가 아닙니다.

소스만 GitHub에 올립니다. 실제 커플의 디데이, 일정, 메모, 펫, 지갑, 가구 데이터와 토큰은 공개 저장소에 올리지 않습니다.

방을 만들면 GAS 소유자의 비공개 Drive에 다음 구조를 자동 생성합니다.

```text
TwoPlace Couples/
  couple_숫자12자리방코드/
    room.json
    backup_수정시각.json  # 관리자 저장 시 생성
```

`room.json`에는 스키마 버전, 방 코드, 생성/수정 시각, 상태 revision, 일정·메모, 펫 상태, 멤버 토큰의 SHA-256 해시가 들어갑니다. 원본 접속 토큰은 각 기기 브라우저에만 저장합니다. Drive 파일 공유 설정은 비공개로 유지하세요.

## GAS 초기 설정

1. 프로젝트의 `Code.gs` 전체를 `gas/Code.gs` 내용으로 설정하고 저장합니다. 이 파일은 `node scripts/build-gas.mjs`로 공용 검증·펫 규칙과 `gas/Router.gs`를 합쳐 생성합니다.
2. 함수 목록에서 `setupTwoPlace`를 선택해 실행합니다. Google 계정의 Drive 접근 권한을 승인해야 합니다. 전용 폴더를 최초 1회 만들고 그 ID를 Script Properties의 `ROOT_FOLDER_ID`에 저장합니다. 재실행해도 새 폴더를 중복 생성하지 않습니다.
3. 배포 → 새 배포 → 웹 앱. 실행 사용자: **나**, 액세스 권한: **모든 사용자**. 익명 방문도 방별 접속 토큰으로 검증되며 Drive 파일 자체는 공개하지 않습니다. Google 계정/조직 정책상 해당 공개 웹 앱 배포를 허용해야 합니다.
4. `/exec`로 끝나는 웹 앱 URL을 복사합니다. Google OAuth 액세스 토큰이나 관리자 토큰을 복사하는 것이 아닙니다.
5. `APP` 저장소 → Settings → Secrets and variables → Actions → Variables에 `TWOPLACE_GAS_URL`을 만들고 웹 앱 URL을 넣습니다. 이 URL은 접속 주소이며 비밀 토큰이 아닙니다.
6. Settings → Pages → Source를 **GitHub Actions**로 설정합니다. Actions의 `Publish APP apps`를 실행합니다.
7. 웹에서 새 방 생성 → 다른 브라우저에서 코드 입장 → 일정/메모 저장과 양방향 갱신 → 새로고침 유지까지 실제 확인합니다.

GAS 수정 후에는 기존 배포 관리 → 편집 → 새 버전으로 업데이트해야 합니다. 새 배포를 만들면 URL도 바뀔 수 있으므로 변수를 함께 수정하세요.

GAS 연결에서는 약 15초 간격으로 갱신합니다. Google의 실행·Drive·Properties 할당량이 적용됩니다. 개인/소규모 커플 사용을 위한 방식이며 무제한 트래픽 서비스용 DB는 아닙니다. 기존 PC의 SQLite 방은 유지되며 새 Drive 서버로 자동 이전하지 않습니다.

## 세 가지 토큰 구분

| 종류 | 역할 | 저장 위치 |
|---|---|---|
| GitHub fine-grained PAT | `APP` 저장소 코드 업로드 | PC 자격 증명 관리자 |
| 커플방 기기 토큰 | 해당 방의 일정·메모·펫 접근 | 해당 기기의 브라우저; 서버에는 해시만 저장 |
| GAS 관리자 토큰 | TwoPlace 전용 저장소의 모든 방 JSON 조회·수정 | 관리자의 비밀번호 관리자; GAS에는 해시만 저장 |

GitHub PAT로 Drive JSON에 접근할 수는 없습니다. 실제 커플 데이터는 GitHub에 저장하지 않습니다.

## APP 전용 GitHub 토큰 발급

1. https://github.com/settings/personal-access-tokens/new 에서 fine-grained token을 만듭니다.
2. Token name: `APP deployment`, 만료 기간: 예를 들어 30일. Resource owner: `SerenLucent`.
3. Repository access: **Only select repositories → APP**. 다른 저장소를 선택하지 않습니다.
4. Repository permissions: **Contents: Read and write**. `.github/workflows`를 업로드/수정하려면 **Workflows: Read and write**도 필요합니다. Metadata는 자동 읽기 권한입니다. 단순 파일 업로드에는 나머지 권한을 추가하지 않습니다.
5. Generate token 후 비밀번호 관리자에 보관합니다. Git HTTPS 인증 시 비밀번호 대신 사용하거나 Git Credential Manager를 사용합니다. 채팅, `.env`, 소스, 커밋, 웹 설정에 넣지 않습니다.

GitHub 토큰은 폴더 단위 제한을 지원하지 않으므로 `APP/TwoPlace`만 허용하는 토큰은 만들 수 없습니다. 이 토큰은 `APP`의 다른 앱에도 쓸 수 있습니다. 업로드 작업에서 경로를 제한하는 것과 토큰 권한 자체를 제한하는 것은 다릅니다.

공식 안내: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

## 모든 커플 JSON 관리

1. GAS 편집기에서 `issueAdminToken`을 실행합니다. 실행 로그에 1회 표시되는 관리자 토큰을 비밀번호 관리자에 보관하세요. 로그에도 토큰이 남으므로 프로젝트 편집 권한은 소유자에게만 허용합니다.
2. 위 관리자 화면에서 **GAS 관리자 토큰**을 입력합니다. GitHub PAT를 입력하지 않습니다.
3. 방 목록 → 방 선택 → 상태 JSON/펫 JSON 편집 → 저장. 저장 시 원본 백업을 해당 방 폴더에 생성합니다. 멤버 접속 해시·기기 권한은 이 화면으로 수정할 수 없습니다.
4. 상대가 먼저 저장하면 충돌로 거절합니다. 다시 불러와 최신 내용에서 수정하세요. 관리자 저장 시 펫 갱신/하트 적립 기준 시각은 현재로 초기화됩니다.
5. 연결 해제를 누르면 화면 메모리에서 관리자 토큰을 제거합니다. 토큰을 잃었거나 유출되면 `issueAdminToken`을 다시 실행해 교체합니다. 이전 토큰은 즉시 사용할 수 없습니다.

## 다른 앱을 APP에 추가할 때

`TwoPlace/`와 다른 앱 폴더를 나란히 둡니다. 공용 Pages 워크플로는 `_site/TwoPlace`에 앱을 빌드하고, `pages/`의 다른 앱 정적 파일도 함께 묶습니다. 다른 앱의 소스 폴더를 삭제하거나 덮어쓰지 않습니다. 다른 앱에 빌드 과정이 필요하면 이 공용 배포 워크플로에 해당 빌드 단계를 추가해야 합니다. Pages 배포는 저장소당 하나의 전체 사이트를 교체하므로 앱별로 서로 다른 워크플로가 전체 사이트를 덮어쓰지 않도록 하세요.
