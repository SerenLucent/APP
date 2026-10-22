# 지도메이트 전용 Google Apps Script

`npm run build:gas`로 생성한 **`Code.gs` 전체**를 지도메이트 전용 Apps Script 프로젝트에 복사합니다. 네이버 지도·검색을 포함한 최신 통합 배포 파일입니다. `PlaceMate.gs`와 `Naver.gs`는 빌드 원본이므로 `Code.gs`와 중복 등록하지 않습니다. [네이버 키 발급 및 설정 안내](../NAVER_SETUP.md)를 참고하세요. 공개 `SerenLucent/APP` 저장소의 [투플레이스 서버 소스](https://github.com/SerenLucent/APP/blob/main/TwoPlace/gas/Router.gs)를 확인해 같은 저장소·브랜치·스크립트 속성 토큰을 사용하는 GitHub JSON 방식으로 맞췄습니다.

기존 `PRIVATE_REPOSITORY_REQUIRED` 검사는 제거했습니다. 최신 소스로 교체한 뒤 **배포 → 배포 관리 → 기존 배포 수정 → 새 버전 → 배포**를 선택하면 현재 `/exec` 주소를 유지할 수 있습니다. 새 배포를 만들면 달라진 주소를 웹앱에도 반영해야 합니다. 실제 배포 변경과 GitHub 쓰기는 아직 수행하지 않았습니다.

## 설정

프로젝트 설정 → 스크립트 속성에 다음 값을 입력합니다. 토큰을 소스 코드나 웹앱 설정 화면에 넣지 않습니다.

| 속성 | 값 |
| --- | --- |
| `GITHUB_TOKEN` | APP 저장소에 Contents 읽기/쓰기 권한이 있는 fine-grained 토큰 |
| `GITHUB_OWNER` | 생략하면 `SerenLucent` |
| `GITHUB_REPO` | 생략하면 `APP` |
| `GITHUB_BRANCH` | 생략하면 `main` |

투플레이스와 같이 `GITHUB_TOKEN`만 설정해도 됩니다. 선택 속성이 이미 있다면 `SerenLucent`, `APP`, `main`으로 지정합니다. 다른 저장소로 변경했던 설정이 있으면 되돌립니다. 공개·비공개 저장소 모두 지원하며 저장소 공개 범위를 변경할 필요는 없습니다. `setupPlaceMate`를 편집기에서 실행하면 저장소·브랜치 접근을 확인할 수 있습니다. 토큰 권한과 브랜치 보호 규칙이 쓰기를 허용해야 합니다.

공개 저장소에 저장한 JSON은 GitHub에서도 공개됩니다. 앱의 방장 승인·밴은 API 및 앱 화면의 접근을 제어하며 GitHub 원본 열람까지 제한하지 않습니다. GitHub 토큰과 개인키 원문은 JSON에 저장하지 않습니다.

`appsscript.json`은 제공한 파일의 V8 런타임과 외부 요청 OAuth 범위를 참고해 적용합니다. 그다음 새 배포 → 웹 앱, 실행 사용자 ‘나’, 접근 권한은 대상 사용자에 맞게 설정합니다. Google의 최초 권한 승인과 실제 배포는 프로젝트 소유자가 진행합니다. 웹앱 `/exec` 주소를 사용합니다.

## 생성되는 GitHub 경로

```text
APP/
├── TwoPlace/                       # 기존 내용 유지
└── PlaceMate/
    ├── users/
    │   └── u_<개인키의 SHA256>/
    │       └── personal.json        # 닉네임·개인 장소·방문·평가·가입 방
    └── rooms/
        └── <12자리 방키>/
            ├── room.json           # 방장·승인된 멤버·대기·밴·선택 배포 ID
            └── merged.json         # 현재 방에 공개하는 장소·방문·개인 평가 합본
```

폴더는 가입 및 생성 API가 JSON을 첫 저장할 때 자동으로 생성됩니다. 쓰기 경로는 `PlaceMate/`로 고정되어 있고, GitHub 기존 tree를 기준으로 변경 파일만 추가합니다. 다른 앱 폴더를 덮어쓰지 않습니다.

## 개인 원본과 방 합본

`personal.json`이 원본이며 `merged.json`은 방별 조회용 파생 데이터입니다. 배포하지 않은 장소는 합본에 들어가지 않습니다. 원본 변경, 공유 선택, 가입 승인, 밴, 탈퇴 시 관련 합본을 함께 갱신합니다. 신규 장소는 기존 방에 자동 추가하지 않습니다.

같은 실제 장소의 개인 저장 레코드는 `id`가 각각 달라도 `canonicalId`가 같아야 합니다. 방문과 평가는 `canonicalId` 기준으로 개인당 한 묶음입니다. 합본은 개인별 등록 기록을 보존하므로 지도에서는 `canonicalId`로 하나의 핀으로 묶어 표시합니다. 방문 기록은 방 안의 현재 멤버 중 해당 공통 장소를 기록한 사람만 표시합니다. 커스텀 항목은 개인 평가 그대로 유지하며 항목별 평균을 강제로 만들지 않습니다. 종합 평균은 `rating !== null`인 사람만 계산합니다.

밴과 탈퇴는 현재 합본 및 공유 관계에서 제거하며 개인 원본과 다른 방은 유지합니다. **GitHub 과거 커밋에는 이전 데이터가 남습니다.** 현재 방 접근 해제와 저장소 역사에서 완전 삭제는 별개입니다. 사용자가 이미 내려받은 데이터도 회수할 수 없습니다.

## 인증

방키는 가입 요청에만 사용합니다. 코드를 알아도 승인 전에는 방 데이터를 읽을 수 없습니다. 개인 인증은 별도의 무작위 32바이트 개인키로 처리합니다. 개인키 자체를 GitHub에 저장하지 않고 SHA256으로 사용자 ID를 파생합니다. 서버는 클라이언트가 보내는 `ownerId`, `masterId`, 멤버 목록을 신뢰하지 않습니다.

개인키는 비밀번호와 같은 복구 수단입니다. 다른 기기에서는 같은 개인키로 접속해야 같은 기록을 읽을 수 있습니다. 키를 잃으면 이 버전에서는 복구할 수 없고, 키를 아는 사람은 해당 사용자로 접근할 수 있습니다. 개인키는 URL에 넣지 않습니다. 정식 이메일/Google 계정 인증과 키 교체는 별도 기능입니다.

## API 사용

POST 본문은 다음 형태입니다. `doGet`은 상태 확인만 제공하며 개인 데이터는 반환하지 않습니다.

```json
{
  "action": "getPersonal",
  "personalKey": "클라이언트에서_생성한_64자리_소문자_hex",
  "payload": {}
}
```

성공은 `{ "ok": true, "data": ... }`, 실패는 `{ "ok": false, "error": "MASTER_ONLY" }`입니다. Apps Script ContentService 응답에서는 HTTP 상태만 보지 말고 `ok`를 반드시 검사합니다.

| action | payload | 결과 |
| --- | --- | --- |
| `register` | `nickname` | 새 개인 저장소 생성 |
| `getPersonal` | `{}` | 본인 원본 및 가입/대기 방키 |
| `savePersonal` | `expectedRevision`, `nickname`, `places`, `visits` | 본인 기록 전체 저장 및 공유 중인 방 갱신 |
| `createRoom` | `name`, `description` | 새 방 생성, 생성자가 방장 |
| `requestJoin` | `roomKey` | 승인 대기, 방 데이터 반환 없음 |
| `getRoom` | `roomKey` | 승인된 회원에게 방 정보와 합본 반환 |
| `share` | `roomKey`, `expectedRevision`, `placeIds` | 본인 장소의 공유 선택 교체, 빈 배열은 전체 공유 해제 |
| `approve` / `reject` | `roomKey`, `expectedRevision`, `userId` | 방장만 가입 처리 |
| `ban` / `unban` | 위와 같음 | 방장만 밴 처리, 해제 후에도 재가입 승인 필요 |
| `transfer` | 위와 같음 | 기존 회원 한 명에게 방장 위임 |
| `leave` | `roomKey`, `expectedRevision` | 탈퇴, 방장은 위임 후 탈퇴 |

개인 저장 예시:

```js
await api.call('savePersonal', {
  expectedRevision: personal.revision,
  nickname: '서연',
  places: [{
    id: 'my-place-1', canonicalId: 'osm-node-123456',
    name: '메이트 카페', category: '카페', address: '서울 성동구',
    lat: 37.54, lng: 127.04, checkedAt: null
  }],
  visits: [{
    canonicalId: 'osm-node-123456', visited: true, visitedAt: null,
    rating: 4,
    custom: [{ label: '의자 편안함', score: 2 }],
    comment: '커피가 맛있고, 의자는 조금 단단해요.'
  }]
});
```

`places`와 `visits`는 부분 갱신이 아니라 본인 목록 전체 교체입니다. 방문 취소는 해당 방문 레코드를 배열에서 제거합니다. 종합 미평가는 `null`, 세부 미평가 항목은 배열에서 제외합니다. ID는 영문·숫자·밑줄·하이픈 최대 100자입니다. 좌표, 점수, 중복 항목, 소유권은 서버에서 검사합니다. `checkedAt`, `visitedAt`은 `YYYY-MM-DD` 또는 `null`입니다.

## 웹앱에서 호출

`cloud-client.js`는 전송 모듈, `cloud-store.js`는 서버 데이터와 지도 화면을 연결하는 모듈입니다. 제공받은 배포 주소를 연결했고 화면에서 개인키 발급·접속·백업, 방 생성·가입 요청·선택 배포·관리, 개인 장소·평가 저장을 호출합니다. 브라우저 체험 데이터는 자동 업로드하지 않습니다.

```js
import { createPlaceMateClient, generatePersonalKey } from './cloud-client.js';
const personalKey = generatePersonalKey(); // 최초 1회 생성, 안전하게 보관
const api = createPlaceMateClient({
  endpoint: 'https://script.google.com/macros/s/실제_배포_ID/exec',
  personalKey
});
const personal = await api.call('register', { nickname: '서연' });
const created = await api.call('createRoom', { name: '우리 동네 메이트' });
```

외부 정적 웹앱에서는 `text/plain` POST를 사용합니다. 실제 배포의 Google 접근 설정과 리다이렉트/CORS는 브라우저에서 검증해야 합니다. 응답을 읽지 못하는 `no-cors`는 사용하지 않습니다. CORS 때문에 실패하는 환경에서는 자체 동일 출처 프록시 또는 Apps Script HTML Service의 `google.script.run` 경로를 사용합니다. HTML Service 안에서는 다음처럼 호출할 수 있습니다.

```js
const api = createPlaceMateClient({ personalKey, scriptRun: google.script.run });
```

## 충돌과 운영 범위

쓰기 요청은 ScriptLock으로 직렬화하고, 한 요청의 개인 원본·방 상태·합본 변경을 Git tree 한 개와 커밋 한 개에 담아 non-force ref update로 반영합니다. 다른 앱이 같은 브랜치에 먼저 쓰면 `GITHUB_CONFLICT`가 발생할 수 있습니다. 이 경우 재조회 후 사용자가 의도한 작업을 다시 시도합니다. `STALE_REVISION`도 최신 원본을 불러와 변경 내용을 조정해야 합니다. 오래된 전체 JSON을 자동 재전송하지 않습니다.

타임아웃은 저장 실패를 의미하지 않습니다. 응답을 받지 못했다면 최신 개인/방 데이터를 먼저 조회합니다. 같은 요청의 무조건 재시도는 방 중복 생성 같은 결과를 만들 수 있습니다.

기본 한도는 개인 장소 1,000개, 방문 3,000개, 방 가입 30개, 방 인원 50명입니다. 소규모 방에서 시작하기 위한 구조이며 GitHub API와 Apps Script 실행 시간·호출 제한을 받습니다. 대규모 실시간 DB 대체용은 아닙니다. 텍스트 입력마다 원격 저장하지 말고 저장 버튼이나 적절한 묶음 저장을 사용합니다.

## 검증

```sh
node apps-script/backend-test.mjs
```

가상 저장소에서 가입 승인, 방 접근 차단, 본인 장소만 배포, 자동 갱신, 버전 충돌, 밴 후 제거 및 개인 원본 유지, 다른 방 유지, 재가입, 위임, 탈퇴를 검증합니다. 실제 GitHub/Google 배포 통합 검증은 토큰과 배포 주소 설정 후 수행해야 합니다.

공식 문서: [Apps Script 웹 앱](https://developers.google.com/apps-script/guides/web), [스크립트 속성](https://developers.google.com/apps-script/guides/properties), [GitHub Git trees](https://docs.github.com/en/rest/git/trees), [GitHub ref 갱신](https://docs.github.com/en/rest/git/refs).
