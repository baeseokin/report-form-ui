---
description: 
---

---
description: 
---

Antigravity Browser Control을 사용하여 아래 테스트를 실행해줘.

아래의 테스트 시나리오의 순서에 따라 테스트를 진행해줘.
Live View Mode 로 실행해서 브라우저화면에 테스트 진행상황을 볼 수 있게 해줘.
최종 결과는  실행 로그(Console Log)와 최종 성공/실패 리포트를 보여줘.
시나리오 ID에 정의된 테스트 케이스를 순차적으로 수행하고, 화면 스크린을 찍어줘.
에러가 발생한 경우에는 디버깅이 가능하도록 에러 메세지를 상세하게 기록해줘.

# URL: localhost:5173
# 테스트 디바이스 : PC, Chrome

# 테스트 시나리오
  1. 시나리오 ID : 1
    1) 로그인
       - URL 접속
       - [data-testid="login-dept-trigger"] 클릭 후 목록에서 "원천엔젤스" 선택
       - [data-testid="login-role-select"] 에서 "회계" 선택
       - [data-testid="login-user-select"] 에서 "ang001" 선택
       - [data-testid="login-password-input"] 에 "0000" 입력
       - [data-testid="login-submit-button"] 클릭 및 화면 로딩 대기
    2) 지출결의서 작성
       - "지출결의서 작성" 메뉴 클릭 (URL 이동이 아닌 메뉴 클릭)
       - [data-testid="tab-basic"] 클릭 (이미 선택되어 있을 수 있음)
       - [data-testid="claim-type-option-청구지출결의서"] 클릭 (또는 텍스트 "청구지출" 확인)
       - [data-testid="alias-input"] 에 "자동 테스트" 입력
       - [data-testid="btn-next"] 클릭
       - [data-testid="tab-expense"] 화면 전환 확인
       
       - [data-testid="select-gwan"] 에서 "사례비" 또는 "행사비" 선택
       - [data-testid="select-hang"] 에서 "지휘자" 또는 "연주행사" 선택 (관 선택 후 활성화 대기)
       
       - [data-testid="row-0-detail"] 에 "임의 지출내역" 입력
       - [data-testid="row-0-amount"] 에 100000 이하의 금액 입력 (예: 50000)
       - [data-testid="btn-next"] 클릭
       
       - [data-testid="tab-file"] 화면 전환 확인
       - [data-testid="file-upload-input"] 에 임의의 이미지 파일 업로드 (선택 가능하면)
       - [data-testid="btn-next"] 클릭
       
       - [data-testid="tab-confirm"] 화면 전환 확인
       - [data-testid="comment-textarea"] 에 "테스트 청구합니다" 입력
       - [data-testid="signature-canvas"] 에 마우스 드래그로 서명 그리기
       - [data-testid="btn-submit"] 클릭
       
    3) 청구목록 조회
       - "청구목록 조회" 메뉴 클릭
       - [data-testid="row-view-btn-0"] (첫번째 항목 상세보기) 클릭
       - 오픈된 리포트에서 "기안" 상태 뱃지 확인
       - 입력했던 지출내역, 금액 일치 여부 확인
       - [data-testid="btn-comment-list"] 버튼 클릭하여 "기안" 내용 확인

  2. 시나리오 ID : 2
    1) 로그인
       - URL 접속 (로그아웃 후 재접속)
       - [data-testid="login-dept-trigger"] 클릭 후 "음악부" 선택
       - [data-testid="login-role-select"] 에서 "부장" 선택
       - [data-testid="login-user-select"] 에서 "mus002" 선택
       - [data-testid="login-password-input"] 에 "0000" 입력
       - [data-testid="login-submit-button"] 클릭

    2) 결재 처리
       - "내결재목록 조회" 메뉴 클릭
       - 목록에서 시나리오 1에서 작성한 건 확인
       - [data-testid="row-view-btn-0"] 클릭 (첫번째 항목이 방금 작성한 건이라고 가정)
       - 오픈된 리포트에서 데이터 일치 여부 확인
       - [data-testid="btn-approve"] 클릭
       - 서명이 없을 경우 [data-testid="signature-canvas-popup"] 에 서명
       - [data-testid="btn-submit-approval"] 클릭
       - 목록에서 해당 건이 사라졌는지 확인

  3. 시나리오 ID : 3
    1) 로그인
       - URL 접속 (로그아웃 후 재접속)
       - [data-testid="login-dept-trigger"] 클릭 후 "음악부" 선택
       - [data-testid="login-role-select"] 에서 "위원장" 선택
       - [data-testid="login-user-select"] 에서 "mus003" 선택
       - [data-testid="login-password-input"] 에 "0000" 입력
       - [data-testid="login-submit-button"] 클릭

    2) 결재 처리
       - "내결재목록 조회" 메뉴 클릭
       - 목록에서 시나리오 1에서 작성한 건 확인
       - [data-testid="row-view-btn-0"] 클릭 (첫번째 항목이 방금 작성한 건이라고 가정)
       - 오픈된 리포트에서 데이터 일치 여부 확인
       - [data-testid="btn-approve"] 클릭
       - 서명이 없을 경우 [data-testid="signature-canvas-popup"] 에 서명
       - [data-testid="btn-submit-approval"] 클릭
       - 목록에서 해당 건이 사라졌는지 확인

  4. 시나리오 ID : 4
    1) 로그인
       - URL 접속 (로그아웃 후 재접속)
       - [data-testid="login-dept-trigger"] 클릭 후 "재정부" 선택
       - [data-testid="login-role-select"] 에서 "재정부" 선택
       - [data-testid="login-user-select"] 에서 "fin001" 선택
       - [data-testid="login-password-input"] 에 "0000" 입력
       - [data-testid="login-submit-button"] 클릭

    2) 결재 처리
       - "내결재목록 조회" 메뉴 클릭
       - 목록에서 시나리오 1에서 작성한 건 확인
       - [data-testid="row-view-btn-0"] 클릭 (첫번째 항목이 방금 작성한 건이라고 가정)
       - 오픈된 리포트에서 데이터 일치 여부 확인
       - [data-testid="btn-approve"] 클릭
       - 서명이 없을 경우 [data-testid="signature-canvas-popup"] 에 서명
       - [data-testid="btn-submit-approval"] 클릭
       - 목록에서 해당 건이 사라졌는지 확인