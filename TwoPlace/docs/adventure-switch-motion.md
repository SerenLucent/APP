# 교체 모션과 정지 화면 흔들림 수정

- 손 든 정면 포즈: imagegen 내장 도구, 기존 standing-v2 PNG를 기준으로 오른손(화면 왼쪽)만 올리고 플러시 질감·비율·투명 배경 유지. 쿠키 꼬리 끝의 큰 별 유지.
- 프롬프트 요약: front-facing full-body plush character; own right paw raised next to face, left paw down; same framing and proportions; transparent alpha; no extra effects or objects.
- 적용 파일: public/adventure/momo-switch-v1.png, public/adventure/kuki-switch-v1.png.
- 시간: 준비 포즈 0.5초 → 상승 0.35초 → 새 캐릭터 낙하 0.45초 → 착지 후 깜빡임 무적 1초.
- 교체 중에는 이동·공격·차지·재교체를 막고 피해를 받지 않음. 일시정지는 교체 시간을 보존.
- 배경 흔들림: 일시정지 시 shake를 초기화하며, 정지/승리/패배 시 렌더링에도 흔들림 0을 강제.
- 검증: 교체 단계/전환 시점/착지 후 무적/공격 중 교체 제한/정지 시 흔들림 차단 단위 테스트, 브라우저에서 모모→쿠키→모모 전환 및 착지 메시지 확인.
- 원정은 가상 재화 전용 프로토타입으로 제공하며 실제 보상 및 커플별 3종 순환 제한은 미연결.
