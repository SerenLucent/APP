# TwoPlace Android 1.4

- applicationId: com.twoplace.app, versionCode: 5, versionName: 1.4.
- 펫·메뉴·게임의 뒤로가기는 웹의 twoPlaceBack을 먼저 처리합니다.
- 웹이 명시적으로 메인화면이라고 응답할 때만 모모 아이콘의 종료 확인창을 표시합니다. ‘예’를 직접 눌렀을 때만 앱을 종료합니다.
- 로딩 중, 게임의 오래된 페이지, 웹 응답 오류는 앱 종료로 처리하지 않습니다. 하위 페이지는 고정 메인 URL로 돌아갑니다.
- 크림색 배경·연핑크 버튼·모모 아이콘의 네이티브 종료창을 사용합니다.
- 기존 APK와 동일한 서명이며, 기존 앱을 삭제하지 않고 업데이트 설치하면 기기 연결 저장소를 유지합니다.
- APK에는 android-shell의 연결·오프라인 화면만 포함합니다. 실제 웹·게임 이미지는 기존 HTTPS 주소에서 읽습니다.
- npm run android:sync 후 Android Studio 또는 gradlew :app:assembleDebug로 다시 빌드합니다. 서명 키를 교체하지 않습니다.
- 검증: 웹 뒤로가기·기존 기능 회귀 테스트, Android BackNavigationPolicy 단위 테스트 3개, APK 서명·앱 ID·버전 확인.
