# 모모와 쿠키의 별조각 탐험대

투플 원본과 별도로 분리한 개인 육성 웹 게임입니다. 커플 가입이나 투플 로그인 없이 누구나 각자 플레이합니다.

## 공개 서비스 구성

- GitHub Pages: 게임 HTML, JS, 이미지, 음악 제공
- 별조각 탐험대 전용 Google Apps Script: 개인 저장 API, 게임 보상·강화 검증
- 비공개 Google Drive: 개인 프로필 JSON 및 별도 클리어 이력 JSON

투플 GAS, 커플방 폴더, 공유 재화에 접근하지 않습니다. 개인 저장 내용과 복구코드는 공개 GitHub 저장소에 올리지 않습니다.

## 개인 저장과 복구

첫 접속 때 256비트 무작위 개인 복구코드를 만들고 브라우저에 보관합니다. GAS는 해시로 개인 저장을 찾습니다. 모든 플레이어는 레벨 1·재화 0으로 시작합니다. 테스트 포인트 자동 지급은 없습니다.

저장 관리 → 복구 파일 내려받기로 복구코드를 보관하세요. 다른 기기에서 파일이나 코드를 입력하면 같은 기록을 이어갑니다. 복구코드는 비밀번호와 같으므로 타인에게 공유하지 마세요. 코드와 브라우저 정보를 모두 잃으면 현재는 저장을 찾을 수 없습니다.

서버 프로필은 `profile.json`에 저장하고, 클리어 이력은 `game-history/YYYY/MM/clear_YYYY_MM_DD.json`으로 3일 단위로 분리합니다. 저장 도중 이력 쓰기가 실패하면 프로필의 outbox를 이용해 복구하며, 같은 요청을 다시 보내도 보상을 중복 지급하지 않습니다.

복구 파일의 snapshot은 참고용 사본입니다. 파일의 수치를 수정하여 서버에 업로드하는 기능은 없습니다. 실제 복구는 Drive에 존재하는 개인 저장에 연결합니다.

이전 Node/SQLite 로컬 실험 버전의 DB와 브라우저 키는 삭제하지 않습니다. GAS 버전은 별도의 개인 저장 키를 사용합니다. 두 저장소 사이의 자동 이관은 포함하지 않습니다.

## 전용 GAS 설치

1. `npm ci && npm run build:gas` 실행.
2. 별도 Apps Script 프로젝트에 `gas/Code.gs` 내용을 넣습니다.
3. 편집기에서 `setupStarShardExplorers`를 한 번 실행하고 Google Drive 권한을 승인합니다.
4. 생성되는 `StarShardExplorers · Private Players` 폴더는 비공개로 유지합니다. 기존 투플 폴더와 다릅니다.
5. 웹 앱으로 배포: 실행 사용자 나, 액세스 모든 사용자.
6. 배포된 `/exec` 주소를 `public/runtime-config.json`의 gasUrl에 넣습니다. 이 API 주소는 비밀키가 아니며 클라이언트에 공개됩니다.

GitHub 토큰은 필요하지 않습니다. 복구코드 원문은 Drive 파일에 저장하지 않고, 코드 해시로 생성한 개인 폴더 안의 파일만 사용합니다. Drive 권한 승인 화면은 사용자가 직접 처리해야 할 수 있습니다.

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```sh
npm ci
npm run build:gas
npm test
npm run dev
```

http://127.0.0.1:5190

GAS URL이 설정되어 있으면 로컬에서도 전용 GAS 저장을 사용합니다. URL이 비어 있을 때만 localhost에서 이전 Node/SQLite API를 사용할 수 있습니다. 공개 사이트에서 설정 없이 로컬 API로 돌아가는 동작은 하지 않습니다.

## GitHub Pages 빌드

```sh
VITE_BASE_PATH=/APP/StarShardExplorers/ npm run build
```

결과물은 `dist/`입니다. APP 저장소의 Pages 워크플로가 기존 앱을 유지하면서 `/StarShardExplorers/`를 함께 게시합니다. `data/`, `node_modules/`, `.env`, 로그, 복구 파일은 업로드하지 마세요.

프런트엔드 코드와 이미지는 공개되지만, 개인 기록은 Drive에서만 보관합니다. 향후 로그인·대규모 DB 저장으로 옮길 때는 `src/adventure-wallet.js`와 저장 API를 교체하면 됩니다. 현재 전투는 브라우저에서 계산하므로 경쟁 순위나 현금 결제 도입 시에는 전투 검증을 별도로 보강해야 합니다.

LUCENTY LABS. All rights reserved.
