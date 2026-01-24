<template>
  <div class="space-y-6 font-nanum">
    <h2 class="text-xl font-bold text-gray-800">💸 지출내역 입력</h2>

    <div class="text-sm text-gray-600">☞ 관/항을 선택하면 해당 범위 기준으로 예산/지출/잔액이 계산되고, 아래에서 목부터 입력할 수 있습니다.</div>

    <!-- ✅ 상단: 관/항 선택 (입력 테이블에서는 관/항 컬럼 숨김) -->
    <div class="bg-white border rounded-xl shadow-sm p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm font-semibold text-gray-800">계정 선택</div>
        <!--div class="text-sm text-gray-500">관/항을 선택해야 금액이 계산됩니다.</div> -->
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 관 -->
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-2">관</label>
          <div class="relative">
            <select
              v-model="selectedGwan"
              class="w-full appearance-none bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              <option disabled value="">관 선택</option>
              <option v-for="g in getGwans" :key="g" :value="g">{{ g }}</option>
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">▾</span>
          </div>
        </div>

        <!-- 항 -->
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-2">항</label>
          <div class="relative">
            <select
              v-model="selectedHang"
              :disabled="!selectedGwan"
              class="w-full appearance-none bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option disabled value="">항 선택</option>
              <option v-for="h in hangsForSelectedGwan" :key="h" :value="h">{{ h }}</option>
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">▾</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 📊 예산/지출/잔액 표시 (관/항 선택 전에는 0 표시) -->
    <div class="grid grid-cols-3 gap-4 text-lg font-bold">
      <div class="p-4 bg-blue-50 border border-blue-200 rounded">
        📊 예산 총액: {{ formatCurrency(totalBudget) }} 원
      </div>
      <div class="p-4 bg-red-50 border border-red-200 rounded">
        💸 지출 총액: {{ formatCurrency(totalExpense) }} 원
      </div>
      <div
        class="p-4 border rounded"
        :class="remainingBudget < 0 ? 'bg-red-100 border-red-400 text-red-600' : 'bg-green-50 border-green-200 text-green-600'"
      >
        💰 잔액: {{ formatCurrency(remainingBudget) }} 원
      </div>
    </div>

        <!-- ✅ 반응형 테이블: 넓은 화면=기존 테이블 / 좁은 화면=2줄 컴팩트 -->
    <div class="overflow-x-auto md:overflow-visible -mx-2 md:mx-0">
      <!-- ✅ 선택 전에는 입력을 막고 안내 문구 표시 -->
      <div :class="!isSelectionReady ? 'opacity-50 pointer-events-none' : ''">
        <!-- 넓은 화면: 기존 1줄 테이블 -->
        <table
          class="min-w-[920px] sm:min-w-0 w-full border text-sm bg-white rounded-lg overflow-hidden mt-3 table-fixed"
        >
        <thead class="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800">
          <tr>
            <th class="border p-3 w-8">선택</th>
            <th class="border p-3 w-36">목</th>
            <th class="border p-3 w-36">세목</th>
            <th class="border p-3 w-44">지출내역</th>
            <th class="border p-3 w-32">금액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in items" :key="idx">
            <!-- 선택 -->
            <td class="border p-2 text-center">
              <input type="checkbox" :checked="item.selected" @change="updateField(idx, 'selected', $event.target.checked)" />
            </td>
            <!-- 목 -->
            <td class="border p-2">
              <template v-if="item.mok === '__custom__'">
                <input type="text" :value="item.customMok || ''" @input="updateField(idx, 'customMok', $event.target.value)" placeholder="목 직접 입력" class="w-full p-2 border rounded" />
              </template>
              <template v-else>
                <select :disabled="!isSelectionReady" :value="item.mok" @change="onSelect(idx, 'mok', $event.target.value)" class="w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400">
                  <option disabled value="">선택</option>
                  <option v-for="m in getMoks(item)" :key="m">{{ m }}</option>
                  <option value="__custom__">직접입력</option>
                </select>
              </template>
            </td>
            <!-- 세목 -->
            <td class="border p-2">
              <template v-if="item.mok === '__custom__' || item.semok === '__custom__'">
                <input type="text" :value="item.customSemok || ''" @input="updateField(idx, 'customSemok', $event.target.value)" placeholder="세목 직접 입력" class="w-full p-2 border rounded" />
              </template>
              <template v-else>
                <select :disabled="!isSelectionReady" :value="item.semok" @change="onSelect(idx, 'semok', $event.target.value)" class="w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400">
                  <option disabled value="">선택</option>
                  <option v-for="s in getSemoks(item)" :key="s">{{ s }}</option>
                  <option value="__custom__">직접입력</option>
                </select>
              </template>
            </td>
            <!-- 지출내역 (항상 input) -->
            <td class="border p-2">
              <input
                :disabled="!isSelectionReady"
                type="text"
                :value="item.detail || ''"
                @input="updateField(idx, 'detail', $event.target.value)"
                placeholder="지출내역 입력"
                class="w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400"
              />
            </td>
            <!-- 금액 -->
            <td class="border p-2 text-right">
              <input :disabled="!isSelectionReady" type="text" :value="formatCurrencyInput(item.amount)" @input="updateAmount($event, idx)" class="w-full p-2 text-right rounded border disabled:bg-gray-100 disabled:text-gray-400" />
            </td>
          </tr>
          <!-- 합계 -->
          <tr class="bg-purple-50 font-bold">
            <td class="border p-3 text-center" colspan="4">합계</td>
            <td class="border p-3 text-right">{{ totalAmount.toLocaleString() }} 원</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 버튼 -->
    <div class="flex justify-between mt-6">
      <div>
        <button
          @click="addItem"
          :disabled="!isSelectionReady"
          class="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-5 py-2 rounded-lg shadow-md transition"
        >＋ 행 추가</button>
        <button
          @click="deleteItems"
          :disabled="!isSelectionReady"
          class="ml-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-5 py-2 rounded-lg shadow-md transition"
        >－ 행 삭제</button>
      </div>
      <div class="flex gap-3">
        <button @click="$emit('prev')" class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md transition">← 이전</button>
        <button
          @click="handleNext"
          :disabled="!isSelectionReady"
          class="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg shadow-md transition"
        >다음 →</button>
      </div>
    </div>

    <!-- 안내 모달 -->
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
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import axios from "axios";
import ConfirmBox from "./ConfirmBox.vue";
import ModalAlert from "./ModalAlert.vue";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  deptData: {
    type: Object,
    default: () => ({}),
  },
  selectedDept: {
    type: String,
    default: "",
  },
  selectedGwan: {
    type: String,
    default: "",
  },
  selectedHang: {
    type: String,
    default: "",
  },
});

const emits = defineEmits(["update:items", "prev", "next", "update:selectedGwan", "update:selectedHang"]);

const { user } = storeToRefs(useUserStore());
const userDept = computed(() => props.selectedDept || user.value?.deptName || "");

// ✅ 합계
const totalAmount = computed(() =>
  props.items.reduce((sum, i) => sum + (i.amount || 0), 0)
);

// ✅ 상단 선택: 관/항 (선택 전에는 금액 0 표시)
const selectedGwan = computed({
  get: () => props.selectedGwan || "",
  set: (value) => emits("update:selectedGwan", value),
});

const selectedHang = computed({
  get: () => props.selectedHang || "",
  set: (value) => emits("update:selectedHang", value),
});
const isSelectionReady = computed(() => !!selectedGwan.value && !!selectedHang.value);

// ✅ 예산/지출/잔액
const totalBudget = ref(0);
const serverExpense = ref(0);  // DB에서 가져온 지출 총액
const totalExpense = ref(0);
const currentYear = new Date().getFullYear();
const remainingBudget = computed(() => totalBudget.value - totalExpense.value);

// ✅ 모달 상태
const showConfirm = ref(false);
const confirmMessage = ref("");
const showBlockAlert = ref(false);
const blockAlertMessage = ref("");

// ✅ "다음" 버튼 제어
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


// ✅ totalAmount 변경 → 서버 지출 합계 + 입력값 반영
watch([totalAmount, isSelectionReady], ([newAmount, ready]) => {
  if (!ready) {
    totalExpense.value = 0;
    return;
  }
  const baseExpense = Number(serverExpense.value) || 0; // DB 값 (숫자 보장)
  const addExpense = Number(newAmount) || 0;           // 입력 합계 (숫자 보장)
  totalExpense.value = baseExpense + addExpense;
});

const categories = ref([]);

// ✅ account_categories 기반 계층 탐색
const deptCategories = computed(() => categories.value);
const departments = ref([]); // 부서 목록 저장용

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

  // 1. user store 정보 우선 확인 (API 호출 최소화)
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
  deptCategories.value.find(c =>
    c.level === level &&
    c.category_name === name &&
    (parentId === null ? true : String(c.parent_id) === String(parentId))
  );


// "관" 목록
const getGwans = computed(() =>
  deptCategories.value.filter(c => c.level === "관").map(c => c.category_name)
);

// 상단 선택용 "항" 목록
const hangsForSelectedGwan = computed(() => {
  if (!selectedGwan.value) return [];
  const gwan = findCategory("관", selectedGwan.value);
  if (!gwan) return [];
  return deptCategories.value
    .filter(c => c.level === "항" && String(c.parent_id) === String(gwan.id))
    .map(c => c.category_name);
});

const fetchSummaryBySelection = async () => {
  if (!userDeptId.value || !isSelectionReady.value) {
    totalBudget.value = 0;
    serverExpense.value = 0;
    totalExpense.value = 0;
    return;
  }

  try {
    const gwan = findCategory("관", selectedGwan.value);
    const hang = gwan ? findCategory("항", selectedHang.value, gwan.id) : null;
    const startCategoryId = hang?.category_id || gwan?.category_id;

    if (!startCategoryId) {
      totalBudget.value = 0;
      serverExpense.value = 0;
      totalExpense.value = 0;
      return;
    }

    const { data } = await axios.get(`/api/expenses/summaryByCategory`, {
      params: {
        deptId: userDeptId.value,
        year: currentYear,
        hangCategoryId: hang.category_id, // ✅ '항'의 category_id만 전달
      },
    });

    totalBudget.value = Number(data.totalBudget) || 0;
    serverExpense.value = Number(data.totalExpense) || 0;
    totalExpense.value = (Number(serverExpense.value) || 0) + (Number(totalAmount.value) || 0);
  } catch (err) {
    console.error("❌ /api/expenses/summaryByCategory 조회 실패:", err);
    totalBudget.value = 0;
    serverExpense.value = 0;
    totalExpense.value = 0;
  }
};

// ✅ 항 후보가 1개뿐이면 자동 선택 (타이밍 이슈 방지용)
watch(
  hangsForSelectedGwan,
  (hangs) => {
    if (selectedGwan.value && !selectedHang.value && Array.isArray(hangs) && hangs.length === 1) {
      selectedHang.value = hangs[0];
    }
  },
  { immediate: true }
);

// ✅ 부서 변경 시: 선택값/합계 초기화
watch(userDept, async (newDept, prevDept) => {
  if (!newDept) return;
  const deptChanged = prevDept && newDept !== prevDept;
  if (deptChanged) {
    selectedGwan.value = "";
    selectedHang.value = "";
    totalBudget.value = 0;
    serverExpense.value = 0;
    totalExpense.value = 0;
  }

  // ✅ 관이 1개뿐이면 자동 선택 (기존 선택값이 없을 때만)
  const gwans = getGwans.value;
  if (!selectedGwan.value && gwans.length === 1) {
    selectedGwan.value = gwans[0];
  }

  if (isSelectionReady.value) {
    fetchSummaryBySelection();
  }

}, { immediate: true });



// "항"
const getHangs = (item) => {
  if (!item.gwan) return [];
  const gwan = deptCategories.value.find(c => c.level === "관" && c.category_name === item.gwan);
  return gwan ? deptCategories.value.filter(c => c.parent_id === gwan.id && c.level === "항").map(c => c.category_name) : [];
};

// ✅ 관/항 선택 시: 모든 행의 관/항 자동 반영 + 합계 재조회
const syncSelectionToItems = () => {
  const newItems = props.items.map((it) => {
    const next = { ...it };
    const selectionChanged = (next.gwan !== (selectedGwan.value || "")) || (next.hang !== (selectedHang.value || ""));
    next.gwan = selectedGwan.value || "";
    next.hang = selectedHang.value || "";

    // 선택 전/변경 시 하위 입력값은 안전하게 초기화 (다른 계정으로 잘못 입력되는 것 방지)
    if (!isSelectionReady.value || selectionChanged) {
      next.selected = false; 
      next.mok = "";
      next.semok = "";
      next.detail = "";
      next.amount = 0;
      next.customMok = "";
      next.customSemok = "";
      next.customDetail = "";
    }
    return next;
  });
  emits("update:items", newItems);
};



watch(selectedGwan, () => {
  // 관 변경 시 항 초기화
  selectedHang.value = "";

  syncSelectionToItems();

  // ✅ 항이 1개뿐이면 자동 선택
  const hangs = hangsForSelectedGwan.value;
  if (hangs.length === 1) {
    selectedHang.value = hangs[0];
  } else {
    fetchSummaryBySelection();
  }
});


watch(selectedHang, () => {
  syncSelectionToItems();
  fetchSummaryBySelection();
});

watch([deptCategories, isSelectionReady, userDeptId], ([categories, ready, deptId]) => {
  if (!deptId || !ready || !Array.isArray(categories) || categories.length === 0) return;
  fetchSummaryBySelection();
}, { immediate: true });

// "목"
const getMoks = (item) => {
  if (!item.hang) return [];
  const hang = deptCategories.value.find(c => c.level === "항" && c.category_name === item.hang);
  return hang ? deptCategories.value.filter(c => c.parent_id === hang.id && c.level === "목").map(c => c.category_name) : [];
};

// "세목"
const getSemoks = (item) => {
  if (!item.mok) return [];
  const mok = deptCategories.value.find(c => c.level === "목" && c.category_name === item.mok);
  return mok ? deptCategories.value.filter(c => c.parent_id === mok.id && c.level === "세목").map(c => c.category_name) : [];
};

// "지출내역" (세목명과 동일하게)
const getDetails = (item) => {
  if (!item.semok) return [];
  return [item.semok]; // 기본적으로 세목명 사용
};

// ✅ 값 업데이트
const updateField = (idx, field, value) => {
  const newItems = [...props.items];
  if (field === "customSemok") {
    const next = {
      ...newItems[idx],
      semok: newItems[idx].semok === "__custom__" ? newItems[idx].semok : "__custom__",
      customSemok: value,
    };
    newItems[idx] = next;
  } else {
    newItems[idx] = { ...newItems[idx], [field]: value };
  }
  emits("update:items", newItems);
};

// ✅ 단계 변경 시 하위 필드 초기화
const onSelect = (idx, level, value) => {
  const item = { ...props.items[idx], [level]: value };

  if (level === "gwan") {
    item.hang = "";
    item.mok = "";
    item.semok = "";
    item.detail = "";
  }
  if (level === "hang") {
    item.mok = "";
    item.semok = "";
    item.detail = "";
  }
  if (level === "mok") {
    item.semok = "";
    item.detail = "";
  }
  if (level === "semok") {
    item.detail = "";
  }


  const newItems = [...props.items];
  newItems[idx] = item;
  emits("update:items", newItems);
};

// ✅ 금액 입력 처리
const formatCurrency = (value) => Number(value || 0).toLocaleString();
const formatCurrencyInput = (value) => (value ? Number(value).toLocaleString() : "");
const updateAmount = (event, idx) => {
  const rawValue = event.target.value.replace(/[^0-9]/g, "");
  const amount = rawValue ? parseInt(rawValue, 10) : 0;
  const newItems = [...props.items];
  newItems[idx] = { ...newItems[idx], amount };
  emits("update:items", newItems);
  event.target.value = formatCurrencyInput(amount);
};

// ✅ 행 추가/삭제
const addItem = () => {
  const newItems = [
    ...props.items,
    {
      selected: false,
      gwan: selectedGwan.value || "",
      hang: selectedHang.value || "",
      mok: "",
      semok: "",
      detail: "",
      amount: 0,
      customMok: "",
      customSemok: "",
      uuid: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2),
    },
  ];
  emits("update:items", newItems);
};
const deleteItems = () => {
  const newItems = props.items.filter((i) => !i.selected);
  emits("update:items", newItems);
};
</script>


 <style scoped>
/* ✅ 컴팩트 모드에서 각 셀의 작은 라벨 */
.cell-label {
  font-size: 11px;
  line-height: 1;
  color: #6b7280; /* gray-500 */
  margin-bottom: .25rem;
}
 </style>