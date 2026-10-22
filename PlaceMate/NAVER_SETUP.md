# 네이버 지도와 실제 가게 검색 설정

2026-10-23 공식 문서 확인 기준입니다. 지도 SDK와 가게 검색 서버 코드를 연결했습니다. API 키 설정 및 Google Apps Script 재배포 전에는 실서비스 호출을 검증할 수 없으며 기존 OpenStreetMap을 임시로 표시합니다.

## 1. 지도 표시 키: 네이버 클라우드 Maps

1. [네이버 클라우드 콘솔](https://console.ncloud.com/)에 로그인합니다.
2. VPC → Services → Application Services → **Maps**에서 서비스를 신청합니다.
3. Application을 등록하고 **Dynamic Map**을 선택합니다. 예전 AI·NAVER API 상품이 아닌 신규 Maps를 사용합니다.
4. Web 서비스 URL에 `https://serenlucent.github.io`를 등록합니다. PlaceMate와 TwoPlace는 같은 도메인입니다.
5. 인증 정보의 **Client ID**를 확인합니다. 이 값이 지도 SDK의 `ncpKeyId`입니다. 지도 화면에는 이 ID만 필요하며 Maps Client Secret은 사용하지 않습니다.

[Maps 등록 공식 안내](https://guide.ncloud-docs.com/docs/application-maps-app-vpc), [SDK 로드 방법](https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html)

## 2. 가게 검색 키: NAVER API HUB

1. 같은 콘솔에서 Services → Application Services → **NAVER API HUB**로 이동합니다.
2. 서비스를 신청하고 Application을 등록합니다.
3. **NAVER Search → 지역(Region)** 검색을 선택합니다.
4. 인증 정보의 **Client ID**와 **Client Secret**을 확인합니다. Maps에서 발급한 키와 별개입니다.

기존 개발자센터의 검색 API는 2026-07-31부터 신규 신청이 차단되어 신규 키는 API HUB에서 발급해야 합니다. 구현도 API HUB의 `/search/v1/local`을 사용합니다. 결과는 요청당 최대 5개이므로 지역과 지점명을 같이 입력하면 좋습니다.

[API HUB 발급 안내](https://guide.ncloud-docs.com/docs/apihub-application), [지역 검색 API](https://api.ncloud-docs.com/docs/naver-api-hub-search-local), [이관 공지](https://developers.naver.com/notice/article/32530)

## 3. Apps Script 설정 및 배포

지도메이트 전용 Apps Script의 **프로젝트 설정 → 스크립트 속성**에 추가합니다. `GITHUB_TOKEN` 등 기존 설정은 유지합니다.

| 속성 | 넣는 값 |
| --- | --- |
| `NAVER_MAP_CLIENT_ID` | Maps의 Client ID |
| `NAVER_SEARCH_CLIENT_ID` | API HUB 지역 검색의 Client ID |
| `NAVER_SEARCH_CLIENT_SECRET` | API HUB 지역 검색의 Client Secret |
| `NAVER_SEARCH_DAILY_LIMIT` | 선택사항. 앱 자체 하루 검색 상한, 기본 `1000` |

**검색 Client Secret은 GitHub·프런트 설정 파일·채팅에 넣지 않습니다.** 브라우저는 검색어만 Apps Script에 전달하고, 서버가 Secret을 사용해 네이버를 호출합니다. 지도 SDK용 Client ID는 SDK 로딩 시 브라우저에서 사용되므로 등록 도메인 제한으로 관리합니다.

1. `npm run build:gas`로 생성한 **`apps-script/Code.gs` 전체**를 지도메이트 Apps Script의 코드로 사용합니다.
2. `PlaceMate.gs`와 `Naver.gs`는 빌드 원본입니다. `Code.gs`에 둘 다 포함되므로 Apps Script에 세 파일을 중복 등록하지 않습니다. 기존 같은 함수가 있는 파일은 하나로 정리합니다.
3. 저장 후 **배포 관리 → 기존 배포 편집 → 새 버전 → 배포**를 선택합니다. 기존 `/exec` URL을 유지합니다.
4. 웹앱을 새로고침하고 **가게 찾기** 또는 **장소 등록**을 누릅니다.
5. `성수 센터커피`처럼 검색하고, 결과를 선택한 뒤 등록합니다.

투플레이스 안에서도 사용하려면 **투플레이스 전용 Apps Script에도 같은 네이버 속성 3개를 설정**하고, 저장소의 `TwoPlace/gas/Code.gs` 최신 통합 파일로 기존 배포를 업데이트합니다. 두 앱의 개인 데이터·커플방 저장 위치와 인증은 기존처럼 분리됩니다. 투플레이스의 지도 iframe은 기존 커플방 토큰을 부모 창에 맡기며, 검색 요청도 승인된 커플방 API를 통해 전달합니다.

## 4. 요금과 한도

- 신규 Maps: 대표 계정에 Dynamic Map 월 **6,000,000건 무료 이용량**을 제공합니다. 대표 계정 여부와 초과분 요금은 신청 화면의 현재 요금표를 확인합니다. 웹 지도 표시는 일반 요금표에 **0.1원/건, VAT 별도**로 안내되어 있으며 구상품과 신규 Maps의 무료량 적용 조건을 구분해야 합니다.
- API HUB: 공식 이관 공지는 **한시 무료 요금제**이며 추후 유료 요금제를 제공할 예정이라고 안내합니다. 검색 API 한도는 Application 등록 안내상 월 **775,000건**, 지역 검색 문서상 일 **25,000회**입니다. 신청 시 현재 과금 조건을 다시 확인합니다.
- 두 앱에서 같은 키를 사용하면 사용량은 합산됩니다. 네이버 콘솔에서 일별·월별 한도와 알림을 설정할 수 있습니다.
- 앱은 검색 버튼을 눌렀을 때만 호출합니다. 글자마다 API를 호출하지 않습니다. 지도 객체는 화면 필터 변경 때 재생성하지 않고 재사용합니다.
- 앱 자체 기본 상한은 하루 1,000회, 사용자당 분당 15회입니다. 네이버 콘솔의 과금·호출 한도가 최종 기준입니다.

[Maps 무료량 FAQ](https://www.ncloud.com/support/faq/prod/2828), [공식 요금표](https://m.ncloud.com/charge/price/ko), [API HUB 한시 무료 공지](https://developers.naver.com/notice/article/32530)

## 현재 검증 범위

픽스처 기반으로 인증 헤더, 좌표 변환, 결과명 정리, 공통 장소 식별값, 카테고리, 호출 한도와 오류를 검사했습니다. 실제 발급 키로 지도 표시·검색·저장하는 통합 검증은 키 설정 후 진행합니다. 기존 장소·방문·메이트 평가의 저장 구조는 그대로 사용합니다.
