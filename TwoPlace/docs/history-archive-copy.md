# 이력 분리 1단계: 원본 유지, 복사만

`node scripts/copy-history-archives.mjs`는 마지막으로 fetch한 `origin/main`의
하트 이력과 모험 클리어 이력을 `.data/history-split/TwoPlace/remote-data/couples`에 복사합니다.
한 커밋을 고정해 읽으며 저장소와 `room.json`은 수정하지 않습니다. 실제 배포, 기존 이력 삭제,
화면 조회 방식 변경, 향후 이력의 자동 이중 저장은 이 단계에 포함하지 않습니다.

```
couples/방코드/history/2026/11/heart_2026_11_10.json
couples/방코드/history/2026/11/clear_2026_11_10.json
```

한국 시간 기준으로 매월 1일, 4일, 7일, 10일 등부터 3일씩 묶습니다.
예를 들어 `11_10`은 10일~12일이며 월말은 해당 월 마지막 날까지만 포함합니다.
기록이 없는 기간은 파일을 만들지 않습니다. 기록 내용은 원문 그대로 보존합니다.
다시 실행하면 기존 복사본을 유지하고 추가된 기록만 합칩니다. 같은 내용의 정상 거래가
여러 건 있는 경우에도 건수를 보존합니다. `copy-report.json`은 원본 커밋·SHA-256·건수를 기록합니다.

다른 입력과 출력 경로:

```
node scripts/copy-history-archives.mjs --source 입력couples폴더 --output 출력couples폴더
node scripts/copy-history-archives.mjs --repo releases/APP --git-ref origin/main
```

다음 단계에서 기간에 걸친 파일만 조회하는 API와 화면을 붙이고, 재화 변경과 이력 저장의
원자성을 확보한 뒤 원본 JSON에서 이력을 제거합니다. 그 전에는 원본을 계속 기준으로 사용합니다.
