// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSync);
} else {
  initSync();
}

function initSync() {
  chrome.storage.local.get(['ohzicSyncData'], (result) => {
    const data = result.ohzicSyncData;
    if (!data) return; // No sync data found

    console.log("[OhZic Extension] Found sync data:", data);

    try {
      // 다건 지출내역 입력 및 '추가' 버튼 클릭
      if (data.expenses && Array.isArray(data.expenses) && data.expenses.length > 0) {
        let currentIndex = 0;

        function addNextExpense() {
          if (currentIndex >= data.expenses.length) {
            console.log("[OhZic Extension] All expenses added successfully.");
            
            // 작업이 끝나면 스토리지 비우기 (새로고침 시 중복입력 방지)
            chrome.storage.local.remove('ohzicSyncData', () => {
              console.log("[OhZic Extension] Cleared sync data from storage.");
            });
            return;
          }

          const exp = data.expenses[currentIndex];
          
          const accNameInput = document.getElementById('child_account_name');
          if (accNameInput) accNameInput.value = exp.category || '';

          const amountInput = document.getElementById('amount3');
          if (amountInput) amountInput.value = exp.amount || '';

          const sumNameInput = document.getElementById('sumName3');
          if (sumNameInput) sumNameInput.value = exp.remarks || '';

          // 추가 버튼 강제 클릭
          const addBtn = document.getElementById('btn_save');
          if (addBtn) {
            addBtn.click();
          }

          currentIndex++;
          
          // 약간의 딜레이를 주어 UI 업데이트 시간 확보 (0.3초)
          setTimeout(addNextExpense, 300);
        }

        // 재귀 호출 시작
        addNextExpense();
      } else {
        // expenses가 없는 경우 스토리지 정리
        chrome.storage.local.remove('ohzicSyncData');
      }

    } catch (e) {
      console.error("[OhZic Extension] Error during auto-fill:", e);
    }
  });
}
