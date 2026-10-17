<template>
  <div
    class="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl bg-white shadow-2xl rounded-2xl py-[15px] px-[14px] sm:p-6 md:p-8 border border-gray-200 mx-auto font-nanum mb-12"
  >
    <!-- 📌 PC: 상단 단계별 탭 바 -->
    <div class="flex border-b mb-6">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab"
        @click="goToTab(idx)"
        class="flex-1 py-3 text-center font-semibold transition"
        :class="[
          currentTab === idx
            ? 'border-b-4 border-purple-600 text-purple-700'
            : 'text-gray-500 hover:text-gray-700',
          idx === 2 && !isStepValid(1) ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        {{ tab }}
      </button>
    </div>

    <!-- ========================================== -->
    <!-- 1단계: 기본 정보 -->
    <!-- ========================================== -->
    <div v-if="currentTab === 0" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/70 p-6 rounded-xl border border-gray-200">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            대상 회계연도 <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <select
              v-model="targetYear"
              class="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
            >
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년도</option>
            </select>
          </div>
          <span class="text-xs text-gray-500 mt-1 block">
            ※ 당해년도({{ targetYear - 1 }}년) 예산이 기본 세팅됩니다.
          </span>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            신청 부서 <span class="text-red-500">*</span>
          </label>
          <select
            v-model="selectedDeptName"
            :disabled="!canChangeDept"
            class="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option v-for="d in sortedDepartmentOptions" :key="d.id || d.dept_name" :value="d.dept_name">
              {{ d.dept_name }}
            </option>
          </select>
          <span v-if="!canChangeDept" class="text-xs text-purple-700 mt-1 block font-medium">
            ※ 회계 권한 사용자는 소속 부서({{ userDeptName }})의 예산만 기안할 수 있습니다.
          </span>
          <span v-else class="text-xs text-indigo-700 mt-1 block font-medium">
            ※ 재정부 권한으로 전체 부서의 예산을 신청할 수 있습니다.
          </span>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">기안자</label>
          <input
            type="text"
            :value="currentUser?.userName || '작성자'"
            readonly
            class="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm text-gray-600 outline-none cursor-not-allowed"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">기안 일자</label>
          <input
            type="text"
            :value="todayStr"
            readonly
            class="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm text-gray-600 outline-none cursor-not-allowed"
          />
        </div>
      </div>

      <!-- 하단 액션 버튼 바 -->
      <div class="flex justify-end pt-4 border-t">
        <button
          type="button"
          @click="loadTemplateAndNext"
          :disabled="loading"
          class="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-md transition flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>다음: 예산편성 입력 →</span>
        </button>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 2단계: 계정별 예산 편성 입력 (관·항·목·세목) -->
    <!-- ========================================== -->
    <div v-else-if="currentTab === 1" class="space-y-6">
      <!-- 헤더 요약 칩 바 -->
      <div class="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
        <span class="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
          {{ targetYear }}년도
        </span>
        <span class="font-bold text-gray-800 text-base">{{ selectedDeptName }} 예산편성</span>
      </div>

      <!-- 로딩 인디케이터 -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-2"></div>
        <div class="text-sm text-gray-500 font-medium">계정과목 및 당해년도 예산 로딩 중...</div>
      </div>

      <!-- 계정별 트리 테이블 -->
      <div v-else class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-purple-100 text-gray-800 font-bold border-b border-purple-200">
              <th class="p-3 text-center w-48 sm:w-52">계정명</th>
              <th class="p-3 text-center w-16 sm:w-20">단계</th>
              <th class="p-3 text-center w-32 sm:w-36">{{ baseYear }} 당해예산</th>
              <th class="p-3 text-center w-40 sm:w-44">{{ targetYear }} 편성요청</th>
              <th class="p-3 text-center w-48 sm:w-56 whitespace-nowrap">전년대비 증감</th>
              <th class="p-3 text-center min-w-[180px]">산출 근거 / 비고</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in flatCategories"
              :key="item.id"
              :class="getRowClass(item.level)"
              class="border-b transition hover:bg-purple-50/50"
            >
              <!-- 1. 계정명 (들여쓰기) -->
              <td class="p-2.5">
                <div class="flex items-center flex-wrap gap-1" :style="{ paddingLeft: `${(item.depth - 1) * 20}px` }">
                  <span
                    v-if="item.depth > 1"
                    class="text-gray-400 mr-1 text-xs select-none"
                  >└</span>
                  <span :class="item.is_leaf ? 'font-normal text-gray-800' : 'font-bold text-gray-900'">
                    {{ item.category_name }}
                  </span>
                  <!-- 🆕 신규신청 뱃지 -->
                  <span
                    v-if="item.is_new_category"
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200"
                  >
                    🆕 신규신청
                  </span>
                  <!-- 항 단계인 경우 신규 목 추가 퀵 버튼 -->
                  <button
                    v-if="item.level === '항' && isLevelEligibleForAdd(item)"
                    type="button"
                    @click="openNewCategoryModal('목', item.id)"
                    class="ml-1 px-1.5 py-0.5 text-[10px] bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded font-medium transition cursor-pointer"
                    title="이 항 하위에 신규 목 추가"
                  >
                    +목추가
                  </button>
                  <!-- 목 단계인 경우 신규 세목 추가 퀵 버튼 -->
                  <button
                    v-if="item.level === '목' && isLevelEligibleForAdd(item)"
                    type="button"
                    @click="openNewCategoryModal('세목', item.id)"
                    class="ml-1 px-1.5 py-0.5 text-[10px] bg-white hover:bg-green-50 text-green-700 border border-green-200 rounded font-medium transition cursor-pointer"
                    title="이 목 하위에 신규 세목 추가"
                  >
                    +세목추가
                  </button>
                </div>
              </td>

              <!-- 2. 단계 (관 / 항 / 목 / 세목) -->
              <td class="p-2.5 text-center">
                <span
                  v-if="item.level === '관'"
                  class="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-bold"
                >관</span>
                <span
                  v-else-if="item.level === '항'"
                  class="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded font-bold"
                >항</span>
                <span
                  v-else-if="item.level === '목'"
                  class="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded font-bold"
                >목</span>
                <span
                  v-else
                  class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded font-medium"
                >세목</span>
              </td>

              <!-- 2. 당해년도(전년도) 예산액 -->
              <td class="p-2.5 text-right font-mono text-gray-600">
                {{ formatAmount(item.prev_amount) }}
              </td>

              <!-- 3. 차기년도 편성요청액 -->
              <td class="p-2.5 text-right">
                <div class="flex justify-end">
                  <!-- 1) 최하위 Leaf 계정이면서 신청 부서가 Owner인 경우 (또는 신규계정): 정상 수정 가능 -->
                  <input
                    v-if="isItemEditable(item)"
                    type="text"
                    inputmode="numeric"
                    :value="item.request_amount ? item.request_amount.toLocaleString() : '0'"
                    @input="handleAmountInput(item, $event)"
                    @focus="$event.target.select()"
                    class="w-36 text-right font-mono border border-gray-300 rounded px-2.5 py-1.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition"
                  />
                  <!-- 2) 최하위 Leaf 계정이지만 타 부서 관리 계정인 경우: 수정 불가 잠금 -->
                  <div
                    v-else-if="item.is_leaf && !isItemEditable(item)"
                    class="w-36 text-right font-mono border border-gray-200 bg-gray-100/90 text-gray-400 rounded px-2.5 py-1.5 text-sm font-semibold cursor-not-allowed select-none"
                    :title="item.owner_dept_name ? `${item.owner_dept_name} 관리 계정으로 수정 불가` : '수정 불가'"
                  >
                    {{ formatAmount(item.request_amount) }}
                  </div>
                  <!-- 3) 상위 계정: 자동 합산 금액 노출 -->
                  <div
                    v-else
                    class="w-36 text-right font-mono border border-transparent px-2.5 py-1.5 text-sm font-bold text-gray-900"
                  >
                    {{ formatAmount(item.request_amount) }}
                  </div>
                </div>
              </td>

              <!-- 4. 증감액 및 증감율 -->
              <td class="p-2.5 text-right font-mono whitespace-nowrap">
                <span :class="getDiffClass(item.diff_amount)">
                  {{ formatDiff(item.diff_amount, item.prev_amount) }}
                </span>
              </td>

              <!-- 5. 산출 근거 / 비고 -->
              <td class="p-2.5">
                <!-- 1) 신청 부서가 Owner인 경우: 산출근거 입력 가능 -->
                <div v-if="isItemEditable(item)" class="flex items-center gap-1.5">
                  <input
                    type="text"
                    v-model="item.calc_basis"
                    placeholder="산출 근거 및 주요 변동 사유"
                    class="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-purple-300 focus:border-purple-300 outline-none transition"
                  />
                  <!-- 신규 신청 계정 삭제 버튼 -->
                  <button
                    v-if="item.is_new_category"
                    type="button"
                    @click="removeNewCategory(item)"
                    title="신규 신청 삭제"
                    class="shrink-0 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition text-xs cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
                <!-- 2) 타 부서 관리 계정인 경우: Owner 부서명 명시 -->
                <div v-else-if="item.is_leaf && !isItemEditable(item)" class="flex items-center gap-1.5 py-0.5">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                    <span>🏢</span>
                    <span>{{ item.owner_dept_name || '타 부서' }}</span>
                  </span>
                  <span class="text-[11px] text-gray-400 font-medium">관리</span>
                </div>
                <!-- 3) 상위 계정 -->
                <span v-else class="text-xs text-gray-400">-</span>
              </td>
            </tr>

            <tr v-if="flatCategories.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-500">
                조회된 계정과목이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 실시간 예산 현황 요약 바 (3단 인터랙션) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/70">
          <div class="text-xs font-semibold text-blue-700 mb-1">
            당해년도({{ baseYear }}년) 예산 총액
          </div>
          <div class="text-xl font-bold font-mono text-blue-900">
            {{ formatAmount(totalPrevAmount) }} 원
          </div>
        </div>

        <div class="p-4 rounded-xl border border-purple-200 bg-purple-50/70">
          <div class="text-xs font-semibold text-purple-700 mb-1">
            {{ targetYear }}년도 편성요청 합계
          </div>
          <div class="text-xl font-bold font-mono text-purple-900">
            {{ formatAmount(totalRequestAmount) }} 원
          </div>
        </div>

        <div
          class="p-4 rounded-xl border"
          :class="totalDiffAmount >= 0 ? 'border-emerald-200 bg-emerald-50/70' : 'border-blue-200 bg-blue-50/70'"
        >
          <div class="text-xs font-semibold mb-1" :class="totalDiffAmount >= 0 ? 'text-emerald-700' : 'text-blue-700'">
            전년 대비 증감
          </div>
          <div class="text-xl font-bold font-mono" :class="totalDiffAmount >= 0 ? 'text-emerald-900' : 'text-blue-900'">
            {{ formatDiff(totalDiffAmount, totalPrevAmount) }}
          </div>
        </div>
      </div>

      <!-- 하단 네비게이션 버튼 그룹 -->
      <div class="flex justify-between items-center pt-4 border-t">
        <button
          type="button"
          @click="currentTab = 0"
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition"
        >
          ← 이전 단계
        </button>
        <div class="flex gap-3">
          <button
            type="button"
            @click="submitBudgetPlan('작성중')"
            :disabled="submitting"
            class="bg-gray-600 hover:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition"
          >
            임시저장
          </button>
          <button
            type="button"
            @click="currentTab = 2"
            class="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-md transition"
          >
            다음: 최종 확인 및 상신 →
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 3단계: 최종 확인 및 결재 상신 -->
    <!-- ========================================== -->
    <div v-else-if="currentTab === 2" class="space-y-6">
      <!-- 최종 요약 카드 -->
      <div class="bg-gray-50/80 p-6 rounded-2xl border border-gray-200 space-y-4">
        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📋</span>
          <span>{{ targetYear }}년도 {{ selectedDeptName }} 예산편성안 요약</span>
        </h3>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-500 block text-xs mb-1">대상연도</span>
            <strong class="text-gray-900 font-bold text-base">{{ targetYear }}년도</strong>
          </div>
          <div>
            <span class="text-gray-500 block text-xs mb-1">신청부서</span>
            <strong class="text-gray-900 font-bold text-base">{{ selectedDeptName }}</strong>
          </div>
          <div>
            <span class="text-gray-500 block text-xs mb-1">당해년도({{ baseYear }}년) 예산</span>
            <strong class="text-blue-700 font-bold font-mono text-base">{{ formatAmount(totalPrevAmount) }}원</strong>
          </div>
          <div>
            <span class="text-gray-500 block text-xs mb-1">편성요청 총액</span>
            <strong class="text-purple-700 font-bold font-mono text-base">{{ formatAmount(totalRequestAmount) }}원</strong>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-200 flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">전년대비 총 증감액</span>
          <span class="text-lg font-bold font-mono" :class="getDiffClass(totalDiffAmount)">
            {{ formatDiff(totalDiffAmount, totalPrevAmount) }}
          </span>
        </div>
      </div>

      <!-- 기안 총괄 설명(좌측) + 서명란(우측) (지출결의서 최종확인 레이아웃 적용) -->
      <div class="flex flex-col md:flex-row gap-6 items-start">
        <!-- 좌측: 기안 총괄 설명 -->
        <div class="flex-1 w-full">
          <label class="block text-base font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <span>📌</span>
            <span>기안 의견</span>
          </label>
          <textarea
            v-model="comment"
            rows="8"
            maxlength="500"
            placeholder="예산 편성의 주된 방향, 전년대비 주요 증감 원인 및 부서 운영 계획을 간략히 기술하세요."
            class="w-full h-[240px] border border-gray-300 rounded-xl p-3.5 text-sm shadow-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition resize-none"
          ></textarea>
          <p class="text-right text-xs text-gray-400 mt-1">
            {{ comment?.length || 0 }}/500
          </p>
        </div>

        <!-- 우측: 서명란 (지출결의서 작성과 동일 규격) -->
        <div class="w-full md:w-[260px] shrink-0">
          <label class="block text-base font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <span>✍️</span>
            <span>서명</span>
            <span class="text-red-500">*</span>
          </label>
          <div class="relative inline-block">
            <canvas
              ref="canvas"
              width="240"
              height="240"
              data-testid="signature-canvas"
              :class="['border border-gray-300 rounded-xl w-[240px] h-[240px] touch-none bg-white shadow-sm', { 'cursor-not-allowed': isImageLoaded }]"
            ></canvas>
            <button
              type="button"
              @click="clearCanvas(false)"
              class="absolute top-2 right-2 text-gray-400 hover:text-red-600 bg-white/90 hover:bg-white rounded-full p-1 text-sm shadow transition"
              aria-label="서명 지우기"
              title="서명 지우기"
            >
              ✕
            </button>
          </div>
          <!-- 안내 메시지 -->
          <p class="text-xs text-gray-500 mt-2 leading-relaxed">
            <span class="px-1 text-red-500 font-bold">✕</span>를 눌러 지우고 다시 서명할 수 있으며, <strong>기본서명</strong>으로 저장됩니다.
          </p>
        </div>
      </div>

      <!-- 하단 버튼 그룹 -->
      <div class="flex justify-between items-center pt-6 border-t">
        <button
          type="button"
          @click="currentTab = 1"
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition"
        >
          ← 이전 단계
        </button>

        <button
          type="button"
          @click="submitBudgetPlan('결재진행중')"
          :disabled="submitting"
          class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-7 py-2.5 rounded-lg shadow-md transition flex items-center gap-2"
        >
          <span v-if="submitting" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>📤 결재 상신</span>
        </button>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 🌟 신규 계정(세목) 추가 모달 -->
    <!-- ========================================== -->
    <div
      v-if="showNewCategoryModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div class="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="text-xl">✨</span>
            <h3 class="font-bold text-base">신규 계정(목 / 세목) 추가 신청</h3>
          </div>
          <button
            type="button"
            @click="closeNewCategoryModal"
            class="text-white/80 hover:text-white p-1 rounded-full text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 leading-relaxed">
            💡 <strong>신규 계정 신청 안내</strong><br />
            추가된 계정은 예산편성안이 부서 결재를 거쳐 <strong>재정부에서 최종 승인될 때 마스터 계정과목에 정식으로 자동 등록</strong>됩니다.
          </div>

          <!-- 단계 선택 (목 vs 세목) -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">
              추가할 단계 <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                @click="setNewCategoryLevel('목')"
                :class="newCategoryForm.level === '목' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-800 font-medium'"
                class="py-2 text-xs rounded-lg transition text-center cursor-pointer"
              >
                📁 '목' 추가 (항 하위)
              </button>
              <button
                type="button"
                @click="setNewCategoryLevel('세목')"
                :class="newCategoryForm.level === '세목' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-gray-500 hover:text-gray-800 font-medium'"
                class="py-2 text-xs rounded-lg transition text-center cursor-pointer"
              >
                📄 '세목' 추가 (목 하위)
              </button>
            </div>
          </div>

          <!-- 상위 항목 선택 드롭다운 -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">
              <span v-if="newCategoryForm.level === '목'">상위 '항' 선택 (관 · 항)</span>
              <span v-else>상위 '목' 선택 (관 · 항 · 목)</span>
              <span class="text-red-500">*</span>
            </label>
            <select
              v-model="newCategoryForm.parentId"
              class="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
            >
              <option value="" disabled>
                {{ newCategoryForm.level === '목' ? '-- 상위 항을 선택하세요 --' : '-- 상위 목을 선택하세요 --' }}
              </option>
              <template v-if="newCategoryForm.level === '목'">
                <option v-for="opt in availableHangOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </template>
              <template v-else>
                <option v-for="opt in availableMokOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </template>
            </select>
          </div>

          <!-- 계정명 입력 -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">
              <span>신규 {{ newCategoryForm.level === '목' ? "'목'" : "'세목'" }} 계정명</span>
              <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="newCategoryForm.name"
              :placeholder="newCategoryForm.level === '목' ? '예: 선교행사비, 부서운영비' : '예: 특별초청강사료, 청년부행사지원비'"
              class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
            />
          </div>

          <!-- 금액 입력 -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">
              {{ targetYear }}년 편성요청 금액 (원)
            </label>
            <input
              type="text"
              inputmode="numeric"
              :value="newCategoryForm.amount ? Number(newCategoryForm.amount).toLocaleString() : ''"
              @input="handleNewModalAmountInput"
              placeholder="0"
              class="w-full text-right font-mono border border-gray-300 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
            />
          </div>

          <!-- 산출 근거 -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5">
              신설 사유 및 산출 근거
            </label>
            <input
              type="text"
              v-model="newCategoryForm.calcBasis"
              placeholder="신설 사유 및 산출 근거를 입력하세요."
              class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
            />
          </div>
        </div>

        <div class="p-4 bg-gray-50 border-t flex justify-end gap-2">
          <button
            type="button"
            @click="closeNewCategoryModal"
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            @click="confirmAddNewCategory"
            class="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-sm transition cursor-pointer"
          >
            + 계정 추가하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { useUserStore } from "@/store/userStore";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const props = defineProps({
  id: {
    type: [String, Number],
    default: null
  }
});

const tabs = ["1. 기본정보", "2. 예산편성 입력", "3. 최종확인"];
const currentTab = ref(0);

const currentUser = computed(() => userStore.user);
const userDeptName = computed(() => userStore.user?.deptName || "");

// 권한 판별: 재정부 권한 또는 관리자 여부
const hasFinanceRole = computed(() => {
  const roles = userStore.user?.roles || [];
  const hasRole = roles.some(r => {
    const name = typeof r === "string" ? r : r.role_name;
    return name === "재정부" || name === "관리자";
  });
  return hasRole || userDeptName.value === "재정부";
});

// 재정부 권한을 가진 사용자는 모든 부서 예산 신청 가능, 회계 권한 등은 본인 소속 부서만 신청 가능
const canChangeDept = computed(() => hasFinanceRole.value);

// 신청부서(selectedDeptName)가 해당 계정의 관리(Owner) 부서인지 판별 (수정 가능 여부)
const isItemEditable = (item) => {
  if (!item.is_leaf) return false;
  if (item.is_new_category) return true; // 신규 신청 계정은 직접 금액/산출근거 수정 가능
  if (item.owner_dept_name) {
    return item.owner_dept_name === selectedDeptName.value;
  }
  return !!item.is_owner;
};

// 특정 레벨(항 또는 목)에 신규 하위 계정 추가 가능한지 판별
const isLevelEligibleForAdd = (item) => {
  if (item.level !== "항" && item.level !== "목") return false;
  if (hasFinanceRole.value) return true;
  if (item.owner_dept_name) {
    return item.owner_dept_name === selectedDeptName.value;
  }
  return true;
};

// 회계연도 옵션 (현재 기준 차기년도만 표시)
const currentYear = new Date().getFullYear();
const yearOptions = [currentYear + 1];
const targetYear = ref(currentYear + 1);
const baseYear = computed(() => targetYear.value - 1);

const departmentOptions = ref([]);
const sortedDepartmentOptions = computed(() => {
  return [...departmentOptions.value].sort((a, b) => {
    const nameA = a.dept_name || "";
    const nameB = b.dept_name || "";
    return nameA.localeCompare(nameB, "ko-KR");
  });
});
const selectedDeptName = ref("");
const todayStr = new Date().toISOString().split("T")[0];

const loading = ref(false);
const submitting = ref(false);

const rawCategories = ref([]);
const comment = ref("");
const userSignature = ref("");
const savedRequestId = ref(null);

/* ==========================================
   ✍️ 서명 캔버스 & 기본서명 로직 (지출결의서 동일)
   ========================================== */
const canvas = ref(null);
let ctx = null;
let drawing = false;
const wasCleared = ref(false);
const hasNotified = ref(false);
const didRedrawAfterClear = ref(false);
const isImageLoaded = ref(false);
const hasInitialSignature = ref(false);

// 기본서명 불러오기 (서버 GET /api/users/me/signature)
async function loadDefaultSignature() {
  try {
    const { data } = await axios.get("/api/users/me/signature", { withCredentials: true });
    const url = data?.signature;
    if (url) {
      await drawImageToCanvas(url);
      hasInitialSignature.value = true;
      return;
    }
  } catch (e) {
    // 서버 미구현/오류 시 무시
  }
  hasInitialSignature.value = false;
  clearCanvas(true);
}

// 캔버스에 이미지 로드
function drawImageToCanvas(src) {
  return new Promise((resolve, reject) => {
    if (!canvas.value) return resolve();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (ctx && canvas.value) {
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height);
      }
      isImageLoaded.value = true;
      resolve();
    };
    img.onerror = () => {
      resolve(); // 이미지 로드 실패 시 에러 중단 방지
    };
    img.src = src;
  });
}

// 캔버스 dataURL 추출
function getSignatureDataURL() {
  if (!canvas.value) return null;
  return canvas.value.toDataURL("image/png");
}

// 기본서명 저장 (PUT /api/users/me/signature)
async function saveDefaultSignature() {
  const dataURL = getSignatureDataURL();
  if (!dataURL) return;
  try {
    await axios.put(
      "/api/users/me/signature",
      { signature: dataURL },
      { withCredentials: true }
    );
  } catch (e) {
    console.warn("기본서명 저장 실패:", e?.message || e);
  }
}

// 마우스 드로잉
const startDraw = (e) => {
  if (isImageLoaded.value) return;
  if (wasCleared.value && !hasNotified.value) {
    hasNotified.value = true;
  }
  if (wasCleared.value || !hasInitialSignature.value) {
    didRedrawAfterClear.value = true;
  }
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
};

const draw = (e) => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
};

const stopDraw = () => {
  drawing = false;
};

// 터치 드로잉
const startDrawTouch = (e) => {
  if (isImageLoaded.value) return;
  e.preventDefault();
  if (wasCleared.value && !hasNotified.value) {
    hasNotified.value = true;
  }
  if (wasCleared.value || !hasInitialSignature.value) {
    didRedrawAfterClear.value = true;
  }
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
};

const drawTouch = (e) => {
  e.preventDefault();
  if (!drawing) return;
  const rect = canvas.value.getBoundingClientRect();
  const touch = e.touches[0];
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
  ctx.stroke();
};

// 캔버스 지우기
const clearCanvas = (skipMark = false) => {
  if (canvas.value && ctx) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
  isImageLoaded.value = false;
  if (!skipMark) {
    wasCleared.value = true;
    hasNotified.value = false;
    didRedrawAfterClear.value = false;
  }
};

// 캔버스 초기화 및 이벤트 연결
const initCanvas = async () => {
  if (!canvas.value) return;
  ctx = canvas.value.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // 기존 리스너 제거 후 등록
  canvas.value.removeEventListener("mousedown", startDraw);
  canvas.value.removeEventListener("mousemove", draw);
  canvas.value.removeEventListener("mouseup", stopDraw);
  canvas.value.removeEventListener("mouseleave", stopDraw);
  canvas.value.removeEventListener("touchstart", startDrawTouch);
  canvas.value.removeEventListener("touchmove", drawTouch);
  canvas.value.removeEventListener("touchend", stopDraw);

  canvas.value.addEventListener("mousedown", startDraw);
  canvas.value.addEventListener("mousemove", draw);
  canvas.value.addEventListener("mouseup", stopDraw);
  canvas.value.addEventListener("mouseleave", stopDraw);
  canvas.value.addEventListener("touchstart", startDrawTouch, { passive: false });
  canvas.value.addEventListener("touchmove", drawTouch, { passive: false });
  canvas.value.addEventListener("touchend", stopDraw);

  await loadDefaultSignature();
};

// 3단계 진입 시 캔버스 초기화
watch(currentTab, async (newTab) => {
  if (newTab === 2) {
    await nextTick();
    await initCanvas();
  }
});

// 1단계에서 부서나 대상연도 변경 시 이전 로드 상태 초기화
watch([selectedDeptName, targetYear], () => {
  if (currentTab.value === 0 && !props.id && !route.params?.id) {
    savedRequestId.value = null;
    rawCategories.value = [];
  }
});

// 초기 부서 및 옵션 로드
onMounted(async () => {
  try {
    const res = await axios.get("/api/departments");
    departmentOptions.value = res.data.departments || res.data || [];

    // 재정부 권한이 없으면(회계 등) 본인 소속 부서로 강제 고정
    if (!canChangeDept.value) {
      selectedDeptName.value = userDeptName.value || "";
    } else {
      selectedDeptName.value = userDeptName.value || departmentOptions.value[0]?.dept_name || "";
    }

    // 사용자 기본 서명 로드
    const userRes = await axios.get("/api/users/me");
    if (userRes.data?.user?.signature_path) {
      userSignature.value = userRes.data.user.signature_path;
    }

    // 기존 임시저장/수정 건 ID가 넘어온 경우 상세 데이터 로드
    const targetId = props.id || route.params.id;
    if (targetId) {
      await loadExistingBudgetPlan(targetId);
    }
  } catch (err) {
    console.error("초기 데이터 로드 실패:", err);
  }
});

// 기존 예산편성서(임시저장 등) 상세 데이터 로드
const loadExistingBudgetPlan = async (id) => {
  loading.value = true;
  try {
    const res = await axios.get(`/api/budget-plans/${id}`);
    if (res.data.success && res.data.report) {
      const rep = res.data.report;
      savedRequestId.value = rep.id;
      selectedDeptName.value = rep.dept_name || selectedDeptName.value;

      // 회계연도 파싱 (aliasName 예: "2027년도 원천엔젤스 예산편성")
      const yearMatch = rep.aliasName?.match(/(\d{4})년/);
      if (yearMatch) {
        targetYear.value = parseInt(yearMatch[1], 10);
      }

      comment.value = rep.comment || "";

      // 기안자 서명이 있으면 로드
      const drafterHistory = rep.history?.find(h => h.signature_path);
      if (drafterHistory?.signature_path) {
        userSignature.value = drafterHistory.signature_path;
      }

      // 부서 ID -> 명칭 맵 생성
      const deptMap = {};
      departmentOptions.value.forEach(d => {
        deptMap[d.id] = d.dept_name;
      });

      // 기존 저장된 항목들 매핑
      if (rep.budgetPlanItems && rep.budgetPlanItems.length > 0) {
        rawCategories.value = rep.budgetPlanItems.map(it => {
          const ownerDeptName = it.owner_dept_id ? (deptMap[it.owner_dept_id] || "") : "";
          const isOwner = selectedDeptName.value ? (ownerDeptName === selectedDeptName.value) : true;
          return {
            id: it.category_id || it.id,
            category_id: it.category_code || it.category_id,
            parent_id: it.parent_id,
            category_name: it.category_name,
            level: it.level,
            owner_dept_id: it.owner_dept_id,
            owner_dept_name: ownerDeptName,
            is_owner: isOwner,
            is_leaf: it.is_leaf ? 1 : 0,
            is_new_category: !!it.is_new_category,
            prev_amount: Number(it.prev_amount || 0),
            request_amount: Number(it.request_amount || 0),
            diff_amount: Number(it.diff_amount || 0),
            calc_basis: it.calc_basis || ""
          };
        });

        // 롤업 재계산
        recalculateRollups();

        // 2단계(예산편성 입력) 탭으로 바로 이동
        currentTab.value = 1;
      }
    }
  } catch (err) {
    console.error("기존 예산편성서 로드 실패:", err);
    alert("예산편성서 정보를 불러오지 못했습니다.");
  } finally {
    loading.value = false;
  }
};

// 1단계 ➔ 2단계 이동
const loadTemplateAndNext = async () => {
  if (!selectedDeptName.value) {
    alert("신청 부서를 선택해주세요.");
    return;
  }
  loading.value = true;
  try {
    const res = await axios.get("/api/budget-plans/template", {
      params: {
        deptName: selectedDeptName.value,
        targetYear: targetYear.value
      }
    });

    if (res.data.draft && !savedRequestId.value) {
      const draft = res.data.draft;
      let promptMsg = "";

      if (draft.status === "재정부이관완료" || draft.status === "재정부이관") {
        promptMsg = `이전에 재정부이관이 완료된 [${selectedDeptName.value} ${targetYear.value}년도 예산편성서]가 있습니다.\n이전 승인 내용을 불러와서 이어서 작성하시겠습니까?`;
      } else if (draft.status === "결재반려" || draft.status === "반려") {
        promptMsg = `이전에 반려된 [${selectedDeptName.value} ${targetYear.value}년도 예산편성서]가 있습니다.\n반려된 이전 내용을 불러와서 이어서 작성하시겠습니까?`;
      } else {
        promptMsg = `이전에 임시저장된 [${selectedDeptName.value} ${targetYear.value}년도 예산편성서]가 있습니다.\n이어서 작성하시겠습니까?`;
      }

      const resume = confirm(promptMsg);
      if (resume) {
        await loadExistingBudgetPlan(draft.id);
        return;
      }
    }

    rawCategories.value = res.data.categories || [];
    // 상위 계정 합계 재계산
    recalculateRollups();
    currentTab.value = 1;
  } catch (err) {
    console.error("예산편성 템플릿 로드 실패:", err);
    alert("예산 템플릿을 불러오지 못했습니다.");
  } finally {
    loading.value = false;
  }
};

// 트리 계층 평탄화 및 depth 계산 (원본 객체 참조 유지)
const flatCategories = computed(() => {
  if (!rawCategories.value || rawCategories.value.length === 0) return [];

  const byParent = {};
  rawCategories.value.forEach((c) => {
    const pid = c.parent_id || 0;
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(c);
  });

  const result = [];
  const traverse = (parentId, depth) => {
    const children = byParent[parentId] || [];
    children.forEach((c) => {
      c.depth = depth;
      result.push(c);
      traverse(c.id, depth + 1);
    });
  };

  traverse(0, 1);
  return result;
});

// 상위 계정 합계 자동 계산 (Roll-up)
const recalculateRollups = () => {
  const items = rawCategories.value;
  if (!items || items.length === 0) return;

  const itemMap = {};
  items.forEach(it => { itemMap[it.id] = it; });

  // 1. Leaf가 아닌 상위 항목의 금액 초기화
  items.forEach(it => {
    if (!it.is_leaf) {
      it.prev_amount = 0;
      it.request_amount = 0;
    }
  });

  // 2. Leaf 항목의 금액을 부모 계정들로 누적 합산
  items.forEach(it => {
    if (it.is_leaf) {
      let currentParentId = it.parent_id;
      while (currentParentId && itemMap[currentParentId]) {
        const parent = itemMap[currentParentId];
        parent.prev_amount += Number(it.prev_amount || 0);
        parent.request_amount += Number(it.request_amount || 0);
        currentParentId = parent.parent_id;
      }
    }
  });

  // 3. 증감액 계산
  items.forEach(it => {
    it.diff_amount = Number(it.request_amount || 0) - Number(it.prev_amount || 0);
  });
};

// 금액 인풋 핸들러
const handleAmountInput = (item, event) => {
  const raw = event.target.value.replace(/[^0-9]/g, "");
  const num = raw ? parseInt(raw, 10) : 0;
  item.request_amount = num;
  event.target.value = num ? num.toLocaleString() : "";
  recalculateRollups();
};

// 총액 집계
const totalPrevAmount = computed(() => {
  return rawCategories.value
    .filter(it => it.is_leaf)
    .reduce((sum, it) => sum + Number(it.prev_amount || 0), 0);
});

const totalRequestAmount = computed(() => {
  return rawCategories.value
    .filter(it => it.is_leaf)
    .reduce((sum, it) => sum + Number(it.request_amount || 0), 0);
});

const totalDiffAmount = computed(() => {
  return totalRequestAmount.value - totalPrevAmount.value;
});

// 탭 이동 제어
const goToTab = (idx) => {
  if (idx === 1 && rawCategories.value.length === 0) {
    loadTemplateAndNext();
    return;
  }
  if (idx === 2 && !isStepValid(1)) return;
  currentTab.value = idx;
};

const isStepValid = (step) => {
  if (step === 1) return rawCategories.value.length > 0;
  return true;
};

/* ==========================================
   ✨ 신규 계정(목 / 세목) 추가 모달 로직
   ========================================== */
const showNewCategoryModal = ref(false);
const newCategoryForm = ref({
  level: "세목", // '목' 또는 '세목'
  parentId: "",
  name: "",
  amount: 0,
  calcBasis: ""
});

const setNewCategoryLevel = (lvl) => {
  newCategoryForm.value.level = lvl;
  if (lvl === "목") {
    newCategoryForm.value.parentId = availableHangOptions.value[0]?.id || "";
  } else {
    newCategoryForm.value.parentId = availableMokOptions.value[0]?.id || "";
  }
};

// 상위 '항' 드롭다운 목록 (관 > 항 경로 라벨 생성)
const availableHangOptions = computed(() => {
  const items = rawCategories.value || [];
  const itemMap = {};
  items.forEach(it => { itemMap[it.id] = it; });

  const hangs = items.filter(it => it.level === "항");
  return hangs.map(h => {
    const gwan = h.parent_id ? itemMap[h.parent_id] : null;
    const path = gwan?.category_name ? `[${gwan.category_name}] ` : "";
    return {
      id: h.id,
      label: `${path}${h.category_name}`
    };
  });
});

// 상위 '목' 드롭다운 목록 (관 > 항 > 목 경로 라벨 생성)
const availableMokOptions = computed(() => {
  const items = rawCategories.value || [];
  const itemMap = {};
  items.forEach(it => { itemMap[it.id] = it; });

  const moks = items.filter(it => it.level === "목");
  return moks.map(m => {
    const hang = m.parent_id ? itemMap[m.parent_id] : null;
    const gwan = hang && hang.parent_id ? itemMap[hang.parent_id] : null;
    const path = [gwan?.category_name, hang?.category_name].filter(Boolean).join(" > ");
    return {
      id: m.id,
      label: path ? `[${path}] ${m.category_name}` : m.category_name
    };
  });
});

const openNewCategoryModal = (preferredLevel = "세목", preferredParentId = null) => {
  const level = preferredLevel || "세목";
  let parentId = preferredParentId;
  if (!parentId) {
    parentId = level === "목" ? (availableHangOptions.value[0]?.id || "") : (availableMokOptions.value[0]?.id || "");
  }
  newCategoryForm.value = {
    level,
    parentId,
    name: "",
    amount: 0,
    calcBasis: ""
  };
  showNewCategoryModal.value = true;
};

const closeNewCategoryModal = () => {
  showNewCategoryModal.value = false;
};

const handleNewModalAmountInput = (e) => {
  const raw = e.target.value.replace(/[^0-9]/g, "");
  newCategoryForm.value.amount = raw ? parseInt(raw, 10) : 0;
};

const confirmAddNewCategory = () => {
  if (!newCategoryForm.value.parentId) {
    alert(newCategoryForm.value.level === "목" ? "상위 '항' 항목을 선택해주세요." : "상위 '목' 항목을 선택해주세요.");
    return;
  }
  const name = (newCategoryForm.value.name || "").trim();
  if (!name) {
    alert("신규 계정명을 입력해주세요.");
    return;
  }

  const parentId = newCategoryForm.value.parentId;
  const isDuplicate = rawCategories.value.some(
    it => it.parent_id === parentId && it.category_name === name
  );
  if (isDuplicate) {
    alert("동일한 상위 항목에 이미 존재하는 계정명입니다.");
    return;
  }

  const level = newCategoryForm.value.level;
  const parentItem = rawCategories.value.find(it => it.id === parentId);
  if (parentItem && level === "세목") {
    // 세목이 추가되면 부모 목은 더이상 leaf가 아님
    parentItem.is_leaf = 0;
  }

  const minId = rawCategories.value.reduce((min, it) => Math.min(min, typeof it.id === 'number' && it.id < 0 ? it.id : 0), 0);
  const tempId = minId - 1;
  const newItem = {
    id: tempId,
    category_id: tempId,
    category_code: "신규",
    parent_id: parentId,
    category_name: name,
    level: level,
    owner_dept_id: null,
    owner_dept_name: selectedDeptName.value,
    is_owner: true,
    is_leaf: 1, // 새로 추가된 계정은 일단 자식이 없으므로 leaf=1
    is_new_category: true,
    prev_amount: 0,
    request_amount: Number(newCategoryForm.value.amount || 0),
    diff_amount: Number(newCategoryForm.value.amount || 0),
    calc_basis: (newCategoryForm.value.calcBasis || "").trim()
  };

  rawCategories.value.push(newItem);
  recalculateRollups();
  closeNewCategoryModal();
};

const removeNewCategory = (item) => {
  if (!confirm(`'${item.category_name}' 신규 신청 계정을 삭제하시겠습니까?`)) return;

  const idx = rawCategories.value.findIndex(it => it.id === item.id);
  if (idx !== -1) {
    const parentId = item.parent_id;
    // 만약 삭제하려는 항목이 '목'이고 그 아래 자식 세목들이 있다면 함께 삭제
    const childIds = rawCategories.value.filter(it => it.parent_id === item.id).map(it => it.id);
    rawCategories.value = rawCategories.value.filter(it => it.id !== item.id && !childIds.includes(it.id));

    // 부모 목에 다른 자식이 없다면 다시 leaf = 1 로 복원
    if (parentId) {
      const remainingChildren = rawCategories.value.filter(it => it.parent_id === parentId);
      if (remainingChildren.length === 0) {
        const parentItem = rawCategories.value.find(it => it.id === parentId);
        if (parentItem && parentItem.level === "목") parentItem.is_leaf = 1;
      }
    }

    recalculateRollups();
  }
};

// 예산편성서 저장 및 상신
const submitBudgetPlan = async (status) => {
  if (status === "결재진행중") {
    // 1) 기존 건 상태 사전 확인 (결재진행중 여부 및 재정부이관완료 여부)
    try {
      const checkRes = await axios.get("/api/budget-plans/check-status", {
        params: {
          deptName: selectedDeptName.value,
          targetYear: targetYear.value,
          requestId: savedRequestId.value || undefined
        }
      });

      if (checkRes.data?.hasInProgress) {
        alert(`해당 연도(${targetYear.value}년도)의 ${selectedDeptName.value} 예산편성서가 이미 결재진행중입니다.\n기존 결재가 완료되거나 반려된 후에 상신할 수 있습니다.`);
        return;
      }

      if (checkRes.data?.hasTransferred) {
        const ok = confirm(`해당 연도(${targetYear.value}년도)의 ${selectedDeptName.value} 예산편성서는 이미 재정부이관이 완료된 건이 있습니다.\n계속 상신하시면 기존 건이 다시 업데이트됩니다.\n계속 진행하시겠습니까?`);
        if (!ok) return;
      }
    } catch (checkErr) {
      console.error("기존 건 상태 확인 오류:", checkErr);
    }

    if (totalRequestAmount.value <= 0) {
      if (!confirm("편성요청 총액이 0원입니다. 그대로 결재를 상신하시겠습니까?")) return;
    } else {
      if (!confirm(`총 ${formatAmount(totalRequestAmount.value)}원의 예산편성안을 결재 상신하시겠습니까?`)) return;
    }
  }

  submitting.value = true;
  try {
    const signatureData = getSignatureDataURL() || userSignature.value;

    const payload = {
      requestId: savedRequestId.value || undefined,
      deptName: selectedDeptName.value,
      targetYear: targetYear.value,
      totalAmount: totalRequestAmount.value,
      comment: comment.value,
      status,
      items: rawCategories.value.map(it => ({
        id: it.id,
        category_id: it.id,
        category_code: String(it.category_id || it.id || ""),
        category_name: it.category_name,
        level: it.level,
        parent_id: it.parent_id,
        owner_dept_id: it.owner_dept_id,
        is_leaf: it.is_leaf,
        is_new_category: !!it.is_new_category,
        prev_amount: it.prev_amount,
        request_amount: it.request_amount,
        diff_amount: it.diff_amount,
        calc_basis: it.calc_basis
      })),
      signature: signatureData
    };

    const res = await axios.post("/api/budget-plans", payload);
    if (res.data.success) {
      if (res.data.requestId) {
        savedRequestId.value = res.data.requestId;
      }

      // ✕ 후 재작성했거나 최초 서명 작성 시 기본서명 자동 저장
      if ((wasCleared.value && didRedrawAfterClear.value) || (!hasInitialSignature.value && didRedrawAfterClear.value)) {
        await saveDefaultSignature();
      }

      alert(status === "결재진행중" ? "📤 예산편성서가 성공적으로 결재 상신되었습니다." : "💾 임시저장되었습니다.");
    }
  } catch (err) {
    console.error("예산편성서 제출 실패:", err);
    alert(err.response?.data?.message || "예산편성서 제출 중 오류가 발생했습니다.");
  } finally {
    submitting.value = false;
  }
};

// 유틸리티 함수
const formatAmount = (num) => {
  return Number(num || 0).toLocaleString();
};

const formatDiff = (diff, prev) => {
  const d = Number(diff || 0);
  const p = Number(prev || 0);
  if (d === 0) return "0원 (0%)";
  const sign = d > 0 ? "+" : "";
  let pctStr = "";
  if (p > 0) {
    pctStr = `${sign}${((d / p) * 100).toFixed(1)}%`;
  } else if (d > 0) {
    pctStr = "+100%";
  } else {
    pctStr = "0%";
  }
  return `${sign}${d.toLocaleString()}원 (${pctStr})`;
};

const getDiffClass = (diff) => {
  const d = Number(diff || 0);
  if (d > 0) return "text-emerald-700 font-bold";
  if (d < 0) return "text-blue-700 font-bold";
  return "text-gray-400";
};

const getRowClass = (level) => {
  switch (level) {
    case "관": return "bg-blue-50/70 font-bold";
    case "항": return "bg-purple-50/40 font-semibold";
    case "목": return "bg-green-50/40 font-medium";
    default: return "bg-white";
  }
};
</script>
