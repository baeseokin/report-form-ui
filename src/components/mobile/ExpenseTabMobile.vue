<template>
  <div class="space-y-4 font-nanum px-2">
    <h2 class="text-lg font-bold text-gray-800">💸 지출내역 입력</h2>
    <!-- ✅ 관/항 선택 (타이틀 바로 아래) -->
    <div class="bg-white border rounded-xl shadow-sm p-3 space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <!-- 관 -->
        <div class="min-w-0">
          <label class="block text-xs font-semibold mb-1">관</label>
          <select
            v-model="selectedGwan"
            class="w-full rounded border px-2 py-1 text-sm"
          >
            <option value="">선택</option>
            <option
              v-for="g in getGwans"
              :key="g"
              :value="g"
            >
              {{ g }}
            </option>
          </select>
        </div>

        <!-- 항 -->
        <div class="min-w-0">
          <label class="block text-xs font-semibold mb-1">항</label>
          <select
            v-model="selectedHang"
            :disabled="!selectedGwan"
            class="w-full rounded border px-2 py-1 text-sm"
          >
            <option value="">선택</option>
            <option
              v-for="h in hangsForSelectedGwan"
              :key="h"
              :value="h"
            >
              {{ h }}
            </option>
          </select>
        </div>
      </div>
    </div>


    <div class="bg-white border rounded-xl shadow-sm p-3 space-y-3">

      <!-- ✅ 예산/지출/잔액 (다음 줄) -->
      <div class="grid grid-cols-1 gap-2 text-sm font-bold">
        <div class="p-3 bg-blue-50 border border-blue-200 rounded">
          📊 예산 총액: {{ formatCurrency(totalBudget) }} 원
        </div>
        <div class="p-3 bg-red-50 border border-red-200 rounded">
          💸 지출 총액: {{ formatCurrency(totalExpense) }} 원
        </div>
        <div
          class="p-3 border rounded"
          :class="remainingBudget < 0
            ? 'bg-red-100 border-red-300 text-red-600'
            : 'bg-green-50 border-green-200 text-green-700'"
        >
          ✅ 잔액: {{ formatCurrency(remainingBudget) }} 원
        </div>
      </div>
    </div>




    <!-- ✅ 입력 테이블 -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold text-gray-800">입력 항목</div>
        <div class="flex gap-2">
          <button
            class="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
            @click="addRow"
            :disabled="!isSelectionReady"
          >
            + 행추가
          </button>
          <button
            class="px-3 py-2 text-sm rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
            @click="removeSelected"
            :disabled="!isSelectionReady || !hasSelected"
          >
            행삭제
          </button>
        </div>
      </div>

      <div v-if="!selectedGwan || !selectedHang" class="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        관/항을 먼저 선택한 후, 목/세목/지출내역/금액을 입력해주세요.
      </div>

      <!-- 모바일: 카드 형태로 행 렌더 -->
      <div :class="!isSelectionReady ? 'opacity-50 pointer-events-none' : ''">
        <div
          v-for="(item, idx) in formattedItems"
          :key="item.uuid || idx"
          class="border rounded-lg p-4 bg-white shadow-sm space-y-3 relative"
        >
          <!-- 선택 체크박스 (✅ 첫 로딩/행추가 시 기본 미체크) -->
          <div class="absolute top-2 right-2">
            <input
              type="checkbox"
              :checked="!!item.selected"
              @change="updateField(idx, 'selected', $event.target.checked)"
            />
          </div>

         <!-- 목 -->
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-gray-600">목</label>
            <template v-if="item.mok === '__custom__'">
              <input
                type="text"
                :value="item.customMok || ''"
                @input="updateField(idx, 'customMok', $event.target.value)"
                placeholder="목 직접 입력"
                class="w-full p-2 border rounded text-sm"
                :disabled="!isSelectionReady"
              />
            </template>
            <template v-else>
              <select
                :value="item.mok"
                @change="onSelect(idx, 'mok', $event.target.value)"
                class="w-full p-2 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
                :disabled="!isSelectionReady"
              >
                <option disabled value="">선택</option>
                <option v-for="m in moksForSelectedHang" :key="m" :value="m">{{ m }}</option>
                <option value="__custom__">직접입력</option>
              </select>
            </template>
          </div>
           <!-- 세목 -->
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-gray-600">세목</label>
            <template v-if="item.mok === '__custom__' || item.semok === '__custom__'">
              <input
                type="text"
                :value="item.customSemok || ''"
                @input="updateField(idx, 'customSemok', $event.target.value)"
                placeholder="세목 직접 입력"
                class="w-full p-2 border rounded text-sm"
                :disabled="!isSelectionReady"
              />
            </template>
            <template v-else>
              <select
                :value="item.semok"
                @change="onSelect(idx, 'semok', $event.target.value)"
                class="w-full p-2 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
                :disabled="!item.mok"
              >
                <option disabled value="">선택</option>
                <option v-for="s in getSemoks(item)" :key="s" :value="s">{{ s }}</option>
                <option value="__custom__">직접입력</option>
              </select>
            </template>
          </div>

          <!-- 지출내역 (✅ input) -->
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-gray-600">지출내역</label>
            <input
              type="text"
              :value="item.detail"
              @input="updateField(idx, 'detail', $event.target.value)"
              class="w-full p-2 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
              :disabled="!isSelectionReady"
              placeholder="지출내역을 입력하세요"
            />
          </div>

          <!-- 금액 -->
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-gray-600">금액</label>
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              class="w-full p-2 border rounded text-sm text-right disabled:bg-gray-100 disabled:text-gray-400"
              :disabled="!isSelectionReady"
              :value="item.amountFocused
                        ? item.amountInput
                        : formatKRW(item.amount)"
              @focus="onAmountFocus(item.uuid)"
              @input="onAmountInput(item.uuid, $event.target.value)"
              @blur="onAmountBlur(item.uuid)"
              placeholder="₩0"
            />
          </div>
        </div>
      </div>
    </div>

    <ConfirmBox
      :visible="showConfirm"
      title="알림"
      :message="confirmMessage"
      @confirm="confirmProceed"
      @cancel="showConfirm = false"
    />
    <ModalAlert
      :visible="showBlockAlert"
      title="알림"
      :message="blockAlertMessage"
      @close="showBlockAlert = false"
    />
    <!-- ✅ 이전/다음 -->
    <div class="flex justify-between gap-2 pt-2">
      <button class="w-full py-3 rounded bg-gray-100 hover:bg-gray-200" @click="emits('prev')">
        이전
      </button>
      <button class="w-full py-3 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300" :disabled="!isSelectionReady" @click="handleNext">
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useUserStore } from "../../store/userStore";
import { storeToRefs } from "pinia";
import axios from "axios";
import ConfirmBox from "../ConfirmBox.vue";
import ModalAlert from "../ModalAlert.vue";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  deptData: {
    type: Object,
    default: () => ({}),
  },
  selectedGwan: {
    type: String,
    default: "",
  },
  selectedHang: {
    type: String,
    default: "",
  },
  selectedDept: {
    type: String,
    default: "",
  },
});

const emits = defineEmits(["update:items", "prev", "next", "update:selectedGwan", "update:selectedHang"]);

const { user } = storeToRefs(useUserStore());
const userDept = computed(() => props.selectedDept || user.value?.deptName || "");

// ✅ 마운트 상태 추적 (비동기 업데이트 방지)
const isMountedRef = ref(false);
onMounted(() => { isMountedRef.value = true; });
onBeforeUnmount(() => { isMountedRef.value = false; });

const currentYear = new Date().getFullYear();

// ✅ 상단 선택 상태 (모바일도 상단에서 관/항 먼저 선택)
const selectedGwan = computed({
  get: () => props.selectedGwan || "",
  set: (value) => emits("update:selectedGwan", value),
});

const selectedHang = computed({
  get: () => props.selectedHang || "",
  set: (value) => emits("update:selectedHang", value),
});

const isSelectionReady = computed(() => !!selectedGwan.value && !!selectedHang.value);

// ✅ account_categories 기반 계층 탐색 (TDZ 방지 위해 상단)
const categories = ref([]);
const deptCategories = computed(() => categories.value);
const departments = ref([]);

const userDeptId = computed(() => {
  if (departments.value.length > 0) {
    const found = departments.value.find(d => d.dept_name === userDept.value);
    if (found) return found.id;
  }
  if (user.value && user.value.deptName === userDept.value) {
    return user.value.deptId || user.value.dept_id;
  }
  return null;
});

const fetchCategories = async () => {
  let targetId = null;

  // 1. user store 정보 우선 확인
  if (user.value && user.value.deptName === userDept.value) {
    targetId = user.value.deptId || user.value.dept_id;
  }

  // 2. ID가 없으면 부서 목록 로드 후 이름으로 검색
  if (!targetId) {
    if (departments.value.length === 0) {
      try {
        const res = await axios.get('/api/departments');
        departments.value = res.data || [];
      } catch (e) {
        console.error("부서 목록 로드 실패", e);
      }
    }
    const found = departments.value.find(d => d.dept_name === userDept.value);
    if (found) targetId = found.id;
  }

  if (!targetId) return;

  // 3. 계정과목 조회
  try {
    // (1) 부서에 매핑된 항목 조회 (부모가 없을 수 있음)
    const mappedRes = await axios.get(`/api/accountCategories/${targetId}`);
    let mappedCategories = [];
    if (mappedRes.data && Array.isArray(mappedRes.data.categories)) {
      mappedCategories = mappedRes.data.categories;
    } else if (Array.isArray(mappedRes.data)) {
      mappedCategories = mappedRes.data;
    }

    // (2) 전체 계정 구조 조회 (부모 찾기용)
    const allRes = await axios.get('/api/accountCategories');
    const allCategories = allRes.data.categories || [];

    // (3) 매핑된 ID 추출 및 부모 노드 추적
    const mappedIds = new Set(mappedCategories.map(c => c.id));
    const finalIds = new Set(mappedIds);

    const addParents = (nodeId) => {
      const node = allCategories.find(c => c.id === nodeId);
      if (node && node.parent_id && !finalIds.has(node.parent_id)) {
        finalIds.add(node.parent_id);
        addParents(node.parent_id);
      }
    };
    mappedIds.forEach(id => addParents(id));

    categories.value = allCategories.filter(c => finalIds.has(c.id));
  } catch (err) {
    console.error("계정과목 조회 실패:", err);
    categories.value = [];
  }
};

watch([userDept, user], () => {
  fetchCategories();
}, { immediate: true });

const findCategory = (level, name, parentId = null) =>
  deptCategories.value.find(
    (c) =>
      c.level === level &&
      c.category_name === name &&
      (parentId === null ? true : String(c.parent_id) === String(parentId))
  );

// "관" 목록
const getGwans = computed(() =>
  deptCategories.value.filter((c) => c.level === "관").map((c) => c.category_name)
);

// 상단 선택용 "항" 목록
const hangsForSelectedGwan = computed(() => {
  if (!selectedGwan.value) return [];
  const gwan = findCategory("관", selectedGwan.value);
  if (!gwan) return [];
  return deptCategories.value
    .filter((c) => c.level === "항" && String(c.parent_id) === String(gwan.id))
    .map((c) => c.category_name);
});


// "목" 목록 (선택된 항 기준)
const moksForSelectedHang = computed(() => {
  if (!selectedGwan.value || !selectedHang.value) return [];
  const gwan = findCategory("관", selectedGwan.value);
  if (!gwan) return [];
  const hang = findCategory("항", selectedHang.value, gwan.id);
  if (!hang) return [];
  return deptCategories.value
    .filter((c) => c.level === "목" && String(c.parent_id) === String(hang.id))
    .map((c) => c.category_name);
});

// 세목
const getSemoks = (item) => {
  if (!selectedGwan.value || !selectedHang.value) return [];
  if (!item.mok) return [];
  const gwan = findCategory("관", selectedGwan.value);
  const hang = gwan ? findCategory("항", selectedHang.value, gwan.id) : null;
  const mok = hang ? findCategory("목", item.mok, hang.id) : null;
  if (!mok) return [];
  return deptCategories.value
    .filter((c) => c.level === "세목" && String(c.parent_id) === String(mok.id))
    .map((c) => c.category_name);
};

// ✅ items에 선택된 관/항을 동기화 (테이블에는 숨기지만 데이터에는 유지)
const syncSelectionToItems = () => {
  const newItems = (props.items || []).map((it) => {
    const next = { ...it };
    const selectionChanged = (next.gwan !== (selectedGwan.value || "")) || (next.hang !== (selectedHang.value || ""));

    next.gwan = selectedGwan.value || "";
    next.hang = selectedHang.value || "";

    if (!isSelectionReady.value || selectionChanged) {
      next.selected = false;
      next.mok = "";
      next.semok = "";
      next.detail = "";
      next.amount = 0;
      next.customMok = "";
      next.customSemok = "";
      next.customDetail = "";
      next.amountInput = "";
      next.amountFocused = false;
    }

    return next;
  });
  emits("update:items", newItems);
};

const fetchSummaryForSelectedHang = async () => {
  // 관/항 선택 전에는 0으로
  if (!isSelectionReady.value || !userDeptId.value) {
    totalBudget.value = 0;
    serverExpense.value = 0;
    totalExpense.value = 0;
    return;
  }

  try {
    const gwan = findCategory("관", selectedGwan.value);
    const hang = gwan ? findCategory("항", selectedHang.value, gwan.id) : null;

    // ✅ '항'에 해당하는 예산/지출 합계
    const { data } = await axios.get(`/api/expenses/summaryByCategory`, {
      params: {
        deptId: userDeptId.value,
        year: currentYear,
        hangCategoryId: hang?.category_id,
      },
    });

    if (!isMountedRef.value) return;

    totalBudget.value = Number(data.totalBudget) || 0;
    serverExpense.value = Number(data.totalExpense) || 0;
    totalExpense.value = (Number(serverExpense.value) || 0) + (Number(totalAmount.value) || 0);
  } catch (err) {
    console.error("❌ 예산/지출(항 기준) 조회 실패:", err);
    totalBudget.value = 0;
    serverExpense.value = 0;
    totalExpense.value = 0;
  }
};

// ✅ 관 변경: 항 초기화 + items 동기화 + 자동 항 선택은 hangs watch가 처리
watch(selectedGwan, async () => {
  // ✅ 관 변경 시 항 초기화
  selectedHang.value = "";
  syncSelectionToItems();

  // ✅ 항 후보가 1개뿐이면 자동 선택 (ExpenseTab.vue 방식)
  const hangs = hangsForSelectedGwan.value;
  if (Array.isArray(hangs) && hangs.length === 1) {
    selectedHang.value = hangs[0]; // selectedHang watch가 summary까지 처리
  } else {
    // 관만 선택된 상태이므로 summary는 0으로
    await fetchSummaryForSelectedHang();
  }
});

// ✅ 항 변경: items 동기화 + 예산/지출/잔액 재계산
watch(selectedHang, async () => {
  syncSelectionToItems();
  await fetchSummaryForSelectedHang();
});

watch(
  hangsForSelectedGwan,
  (hangs) => {
    if (selectedGwan.value && !selectedHang.value && Array.isArray(hangs) && hangs.length === 1) {
      selectedHang.value = hangs[0];
    }
  },
  { immediate: true }
);

watch([deptCategories, isSelectionReady, userDeptId], ([categories, ready, deptId]) => {
  if (!deptId || !ready || !Array.isArray(categories) || categories.length === 0) return;
  fetchSummaryForSelectedHang();
}, { immediate: true });



// ✅ 부서 변경 시: 관/항 초기화 + 자동 관 선택 + summary는 항 선택 이후 실행
watch(
  userDept,
  (newDept, prevDept) => {
    if (!newDept) return;

    const deptChanged = prevDept && newDept !== prevDept;
    if (deptChanged) {
      selectedGwan.value = "";
      selectedHang.value = "";
      totalBudget.value = 0;
      serverExpense.value = 0;
      totalExpense.value = 0;
    }

    // ✅ 관이 1개뿐이면 자동 선택 (이미 선택된 값이 없을 때만)
    const gwans = getGwans.value;
    if (!selectedGwan.value && gwans.length === 1) selectedGwan.value = gwans[0];

    if (isSelectionReady.value) {
      fetchSummaryForSelectedHang();
    }
  },
  { immediate: true }
);

// ✅ 예산/지출/잔액 (항 기준)
const totalBudget = ref(0);
const serverExpense = ref(0);

// ✅ 입력합계 (금액)
const totalAmount = computed(() =>
  (props.items || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
);

// 서버 지출 + 입력값 반영
const totalExpense = ref(0);
watch([totalAmount, isSelectionReady], ([newAmount, ready]) => {
  if (!ready) {
    totalExpense.value = 0;
    return;
  }
  totalExpense.value = (Number(serverExpense.value) || 0) + (Number(newAmount) || 0);
});

const remainingBudget = computed(() => (Number(totalBudget.value) || 0) - (Number(totalExpense.value) || 0));

// ✅ 표시용 items (selected 기본값 false 보정)
const formattedItems = computed(() =>
  (props.items || []).map((it) => ({
    selected: false,
    mok: "",
    semok: "",
    detail: "",
    amount: 0,
    ...it,
    selected: !!it.selected, // 기존 값 유지하되 boolean 보장
  }))
);

const hasSelected = computed(() => formattedItems.value.some((it) => !!it.selected));

// ✅ UUID 보장 (없으면 생성하여 업데이트)
watch(() => props.items, (items) => {
  if (!items) return;
  const missingUuid = items.some(i => !i.uuid);
  if (missingUuid) {
    const newItems = items.map(i => i.uuid ? i : { ...i, uuid: genUUID() });
    emits("update:items", newItems);
  }
}, { immediate: true });

// ✅ 값 업데이트
const updateField = (idx, field, value) => {
  const newItems = [...(props.items || [])];
  const current = newItems[idx] || {};
  newItems[idx] = { ...current, [field]: value };
  emits("update:items", newItems);
};

// ✅ 단계 변경 시 하위 필드 초기화
const onSelect = (idx, field, value) => {
  const newItems = [...(props.items || [])];
  const current = newItems[idx] || {};

  if (field === "mok") {
    // ✅ mok 선택 시 semok 초기화까지 한 번에 처리
    newItems[idx] = {
      ...current,
      mok: value,
      semok: "",
      detail: "",
      customSemok: "",
      customMok: value === "__custom__" ? current.customMok || "" : "",
    };
  } else if (field === "semok") {
    newItems[idx] = {
      ...current,
      semok: value,
      detail: "",
      customSemok: value === "__custom__" ? current.customSemok || "" : "",
    };
  }

  emits("update:items", newItems);
};


// ✅ 행추가 (선택은 기본 false)
const addRow = () => {
  const newItems = [...(props.items || [])];
  newItems.push({
    selected: false,
    gwan: selectedGwan.value || "",
    hang: selectedHang.value || "",
    mok: "",
    semok: "",
    detail: "",
    amount: 0,
    customMok: "",
    customSemok: "",
    customDetail: "",
    uuid: genUUID(),
    amountInput: "",    // 입력용 string
    amountFocused: false,
  });
  emits("update:items", newItems);
};

// ✅ 선택삭제
const removeSelected = () => {
  const newItems = (props.items || []).filter((it) => !it.selected);
  emits("update:items", newItems);
};

// ✅ 유틸
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value) => {
  const n = Number(value) || 0;
  return n.toLocaleString("ko-KR");
};

// ✅ "다음" 버튼 → 예산 초과 차단
const showConfirm = ref(false);
const confirmMessage = ref("");
const showBlockAlert = ref(false);
const blockAlertMessage = ref("");

const handleNext = () => {
  // [수정됨] 1. 지출내역(detail) 텍스트가 비어있는 항목이 있는지 검사
  // some() 함수는 하나라도 조건에 맞으면 true를 반환합니다.
  const hasEmptyDetail = props.items.some(item => !item.detail || item.detail.trim() === "");

  if (hasEmptyDetail) {
    blockAlertMessage.value = "지출내역은 반드시 입력되어야 합니다.";
    showBlockAlert.value = true;
    return; // 진행 중단
  }    
  if (totalAmount.value <= 0) {
    blockAlertMessage.value = "지출항목을 입력해야 다음으로 이동할 수 있습니다.";
    showBlockAlert.value = true;
    return;
  }  
  if (remainingBudget.value < 0) {
    confirmMessage.value = "예산을 초과하였습니다. 반드시 소속 위원장님과 획인 바랍니다.";
    showConfirm.value = true;
    return;
  } 
  emits("next");
  
};

const confirmProceed = () => {
  showConfirm.value = false;
  emits("next");
};

const digitsOnly = (v) => (v ?? "").toString().replace(/[^\d]/g, "");

const formatKRW = (n) => {
  if (n === null || n === undefined || n === "") return "";
  return "₩" + Number(n).toLocaleString("ko-KR");
};


const onAmountFocus = (uuid) => {
  const newItems = [...(props.items || [])];
  const idx = newItems.findIndex(x => x.uuid === uuid);
  if (idx < 0) return;

  const amt = newItems[idx].amount;

  newItems[idx] = {
    ...newItems[idx],
    amountFocused: true,
    // ✅ 0이면 빈 값으로 시작
    amountInput: amt && amt > 0 ? amt.toString() : ""
  };

  emits("update:items", newItems);
};


const onAmountInput = (uuid, raw) => {
  const s = digitsOnly(raw);

  const newItems = [...(props.items || [])];
  const idx = newItems.findIndex(x => x.uuid === uuid);
  if (idx < 0) return;

  newItems[idx] = {
    ...newItems[idx],
    amountInput: s,
    amount: s === "" ? null : parseInt(s, 10)
  };

  emits("update:items", newItems);
};

const onAmountBlur = (uuid) => {
  const newItems = [...(props.items || [])];
  const idx = newItems.findIndex(x => x.uuid === uuid);
  if (idx < 0) return;

  const s = digitsOnly(newItems[idx].amountInput);
  const n = s === "" ? 0 : parseInt(s, 10);

  newItems[idx] = {
    ...newItems[idx],
    amountFocused: false,
    amountInput: s,
    amount: n
  };

  emits("update:items", newItems);
};

const genUUID = () => {
  // 1) 표준 randomUUID 지원 시
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  // 2) getRandomValues 지원 시 (대부분의 모바일 브라우저에서 지원)
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    // RFC4122 v4 형태로 맞춤
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
    return (
      hex.slice(0, 8) + "-" +
      hex.slice(8, 12) + "-" +
      hex.slice(12, 16) + "-" +
      hex.slice(16, 20) + "-" +
      hex.slice(20)
    );
  }

  // 3) 최후 폴백 (충돌 가능성 낮게)
  return "id-" + Date.now().toString(16) + "-" + Math.random().toString(16).slice(2);
};

</script>