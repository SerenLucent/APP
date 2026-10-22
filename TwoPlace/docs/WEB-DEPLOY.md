# TwoPlace 웹 연결 — AST와 같은 방식

## 구조

웹 → Google Apps Script(앱스크립트) → GitHub APP 저장소 JSON.
Drive 저장 방식은 사용하지 않습니다. AST 프로젝트와 AST 토큰은 수정하지 않습니다.

- 웹: https://serenlucent.github.io/APP/TwoPlace/
- 소스: https://github.com/SerenLucent/APP/tree/main/TwoPlace
- TwoPlace 앱스크립트: https://script.google.com/home/projects/1iNQywp2xwwsPpaZMVL4mbTp52XYbcUEh8nY35cXIoZ8ycTwIqm5AkzmR/edit
- 관리자 화면: https://serenlucent.github.io/APP/TwoPlace/admin.html

## APP 토큰 발급 및 입력

1. https://github.com/settings/personal-access-tokens/new 에서 fine-grained token을 만듭니다.
2. 이름: APP, Resource owner: SerenLucent, 만료 기간은 원하는 기간으로 설정합니다.
3. Repository access: Only select repositories → **APP**만 선택합니다.
4. Repository permissions: **Contents → Read and write**. 소스의 배포 워크플로도 토큰으로 수정할 때만 **Workflows → Read and write**를 추가합니다. 앱스크립트 JSON 저장 자체에는 Contents 권한만 필요합니다.
5. Generate token 후 토큰을 비밀번호 관리자에 보관합니다.
6. 위 **TwoPlace 앱스크립트** → 프로젝트 설정 → 스크립트 속성 → 속성 추가:
   - 속성: GITHUB_TOKEN
   - 값: 방금 발급한 APP 토큰
7. 저장합니다. 토큰을 웹 소스, web-config.json, Git 커밋, 채팅에 넣지 않습니다.
8. 편집기에서 setupTwoPlace 실행으로 APP 접근을 확인한 뒤 배포 관리 → 기존 웹 앱 편집 → **새 버전**으로 업데이트합니다. Google에서 외부 서비스 연결 승인을 요청하면 승인합니다.

GitHub 토큰 권한은 APP 전체입니다. 폴더 전용 토큰은 지원하지 않습니다. 대신 TwoPlace 앱스크립트는 TwoPlace/remote-data/couples/ 아래만 쓰도록 경로를 검증합니다.

현재 PC는 Git Credential Manager로 SerenLucent에 로그인되어 있어서 소스 업로드에 새 토큰이 필요하지 않았습니다. 앱스크립트는 PC와 별도 실행 환경이므로 GITHUB_TOKEN 설정이 필요합니다.

공식 토큰 안내: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

## 방 생성 시 JSON 자동 생성

~~~text
APP/
  TwoPlace/
    remote-data/
      couples/
        123456789012/
          room.json
          backups/
            수정시각_UUID.json
~~~

디데이, 일정, 메모, 펫, 하트, 먹이, 가구를 room.json에 저장합니다. 기기 토큰 원문 대신 SHA-256 해시를 저장합니다. 상태 revision과 Git 파일 SHA를 확인해 다른 저장을 덮어쓰지 않습니다. 가입 인덱스는 TwoPlace 스크립트 속성에만 보관합니다. 커플 JSON 변경만으로 웹 빌드를 다시 실행하지 않습니다.

**APP은 공개 저장소이므로 JSON도 GitHub에서 공개됩니다. 기기 토큰은 앱 API를 보호할 뿐 GitHub 원본 JSON의 공개 열람을 막지 않습니다. 개인적인 일정·메모를 넣기 전에 저장소 공개 범위를 확인하세요.**

## 모든 방 JSON 조회·수정

GITHUB_TOKEN을 설정하면 앱스크립트가 이 앱의 모든 커플 JSON을 읽고 수정할 수 있습니다. GitHub에서도 해당 폴더의 JSON을 직접 확인할 수 있습니다.

별도 관리자 화면을 사용하려면 앱스크립트 편집기에서 issueAdminToken 함수를 실행하고, 실행 로그에 표시되는 관리자 접속 토큰을 보관합니다. 관리자 화면에는 이 접속 토큰을 입력합니다. **GitHub PAT는 관리자 웹 화면에 입력하지 않습니다.** 관리자 접속 토큰은 메모리에만 보관하며, 서버에는 해시만 저장합니다.

방 선택 → JSON 수정 → 저장하면 해당 방의 backups 폴더에 원본을 먼저 저장합니다. 다른 사람이 먼저 변경하면 다시 불러와서 수정해야 합니다. 관리자 펫 수정은 적립/배고픔 기준 시각을 현재로 갱신합니다. issueAdminToken을 재실행하면 기존 관리자 토큰은 무효화됩니다.

## 코드 업데이트

- npm run build:gas: 공용 검증·펫 규칙과 gas/Router.gs를 합쳐 **gas/Code.gs**를 생성합니다.
- 생성된 Code.gs 하나로 TwoPlace 앱스크립트의 기존 Code.gs를 교체합니다. AST의 Code.gs를 교체하지 않습니다.
- 웹 연결 주소는 public/web-config.json의 apiUrl입니다. 여기에 토큰은 넣지 않습니다.
- 웹은 약 15초 간격으로 갱신하며, 기기 동작·API 저장은 Google/GitHub 서비스 제한을 받습니다.
- 기존 PC SQLite 방과 이전 Drive 시험 데이터는 자동으로 옮기거나 삭제하지 않습니다.
- APP 저장소의 다른 앱 소스는 수정하지 않습니다. 공용 Pages 워크플로는 TwoPlace 빌드와 pages/에 있는 다른 앱 정적 파일을 함께 배포합니다.

## 배포 기록

2026-10-22: TwoPlace GitHub JSON storage v2 배포. 웹 연결 주소는 기존 /exec를 유지하며 GitHub APP/TwoPlace/remote-data/couples 경로를 사용합니다. Drive 저장 코드는 사용하지 않습니다.

