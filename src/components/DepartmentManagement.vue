<template>
  <div class="font-nanum text-gray-800 space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-500">조직 트리 · 코드 관리</p>
        <h1 class="text-2xl font-bold text-indigo-700">🏢 부서 관리</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="px-3 py-2 text-sm rounded-lg bg-emerald-500 text-white shadow hover:bg-emerald-600"
          @click="startCreateRoot"
        >
          ＋ 최상위 부서
        </button>
        <button
          class="px-3 py-2 text-sm rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600 disabled:opacity-50"
          :disabled="!selected"
          @click="startCreateChild"
        >
          ＋ 하위 부서
        </button>
        <button
          class="px-3 py-2 text-sm rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          @click="resetForm"
        >
          새로고침
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
      <!-- 좌측: 조직 트리 -->
      <section class="bg-white rounded-xl shadow p-4 flex flex-col">
        <div class="flex items-center gap-2 mb-3">
          <div class="relative flex-1">
            <span class="absolute left-3 top-2.5 text-gray-400">🔎</span>
            <input
              v-model="searchKeyword"
              type="search"
              placeholder="부서명·코드 검색"
              class="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            class="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            @click="searchKeyword = ''"
          >
            초기화
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scroll">
          <p v-if="filteredTree.length === 0" class="text-sm text-gray-500">검색 결과가 없습니다.</p>
          <ul class="space-y-2">
            <DepartmentNode
              v-for="node in filteredTree"
              :key="node.id"
              :node="node"
              :keyword="searchKeyword"
              :selected-id="selected?.id"
              :on-select="selectById"
            />
          </ul>
        </div>
      </section>

      <!-- 우측: 상세/목록 -->
      <section class="bg-white rounded-xl shadow p-6 lg:col-span-2 flex flex-col overflow-hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ editable.isNew ? '🆕 새 부서 등록' : '📋 부서 상세' }}
          </h2>
          <p class="text-sm text-gray-500">총 {{ departments.length }}개</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block text-sm font-semibold text-gray-700">
            부서명
            <input
              v-model="editable.dept_name"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="예: 기획팀"
            />
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            부서 코드
            <input
              v-model="editable.dept_cd"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="예: PLAN"
              maxlength="10"
            />
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            상위 부서
            <select
              v-model="editable.parent_dept_id"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option :value="null">(최상위)</option>
              <option
                v-for="option in parentOptions"
                :key="option.id"
                :value="option.id"
                :disabled="option.id === editable.id"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <p class="font-semibold">생성일</p>
              <p class="mt-1 border rounded-lg px-3 py-2 bg-gray-50">{{ editable.created_at || '-' }}</p>
            </div>
            <div>
              <p class="font-semibold">수정일</p>
              <p class="mt-1 border rounded-lg px-3 py-2 bg-gray-50">{{ editable.updated_at || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-2 mt-4">
          <button
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-40"
            :disabled="!editable.dept_name"
            @click="saveDepartment"
          >
            저장
          </button>
          <button
            class="px-4 py-2 bg-rose-500 text-white rounded-lg shadow hover:bg-rose-600 disabled:opacity-40"
            :disabled="editable.isNew"
            @click="deleteDepartment"
          >
            삭제
          </button>
          <button
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            @click="resetForm"
          >
            초기화
          </button>
        </div>

        <div class="mt-6 flex-1 flex flex-col overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">부서 목록</h3>
            <p class="text-sm text-gray-500">검색 결과 {{ filteredList.length }}건</p>
          </div>
          <div class="overflow-x-auto border rounded-lg">
            <table class="w-full text-sm text-left">
              <thead class="bg-indigo-50 text-indigo-900">
                <tr>
                  <th class="px-3 py-2 border">코드</th>
                  <th class="px-3 py-2 border">부서명</th>
                  <th class="px-3 py-2 border">상위 부서</th>
                  <th class="px-3 py-2 border">생성일</th>
                  <th class="px-3 py-2 border">수정일</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="dept in filteredList"
                  :key="dept.id"
                  class="hover:bg-indigo-50 cursor-pointer"
                  :class="selected?.id === dept.id ? 'bg-indigo-100 font-semibold' : ''"
                  @click="selectById(dept.id)"
                >
                  <td class="px-3 py-2 border font-mono">{{ dept.dept_cd || '-' }}</td>
                  <td class="px-3 py-2 border">{{ dept.dept_name }}</td>
                  <td class="px-3 py-2 border text-gray-700">{{ parentName(dept.parent_dept_id) || '-' }}</td>
                  <td class="px-3 py-2 border text-gray-500">{{ dept.created_at || '-' }}</td>
                  <td class="px-3 py-2 border text-gray-500">{{ dept.updated_at || '-' }}</td>
                </tr>
                <tr v-if="filteredList.length === 0">
                  <td colspan="5" class="text-center text-gray-500 px-3 py-6">검색 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref } from "vue";

const seedDepartments = [
  { id: 1, dept_name: "교회", parent_dept_id: null, created_at: "2025-09-06 07:35:33", updated_at: "2025-10-23 09:56:53", dept_cd: "CHR" },
  { id: 2, dept_name: "음악부", parent_dept_id: 1, created_at: "2025-09-06 07:35:34", updated_at: "2025-10-23 09:57:28", dept_cd: "MUS" },
  { id: 3, dept_name: "교육부", parent_dept_id: 1, created_at: "2025-09-06 07:35:34", updated_at: "2025-10-23 09:57:52", dept_cd: "TEA" },
  { id: 4, dept_name: "재정부", parent_dept_id: 1, created_at: "2025-09-06 07:35:34", updated_at: "2025-10-23 09:57:52", dept_cd: "FIN" },
  { id: 5, dept_name: "원천엔젤스", parent_dept_id: 2, created_at: "2025-09-06 07:35:38", updated_at: "2025-09-24 08:22:16", dept_cd: "ANG" },
  { id: 6, dept_name: "할렐루야찬양대", parent_dept_id: 2, created_at: "2025-09-06 07:35:38", updated_at: "2025-09-24 08:22:16", dept_cd: "HAL" },
  { id: 7, dept_name: "임마누엘찬양대", parent_dept_id: 2, created_at: "2025-09-06 07:35:38", updated_at: "2025-09-24 08:22:16", dept_cd: "EMM" },
  { id: 8, dept_name: "샬롬찬양대", parent_dept_id: 2, created_at: "2025-09-06 07:35:38", updated_at: "2025-09-24 08:22:16", dept_cd: "SAL" },
  { id: 9, dept_name: "청년부", parent_dept_id: 3, created_at: "2025-09-06 07:35:41", updated_at: "2025-09-24 08:22:16", dept_cd: "YOU" },
  { id: 10, dept_name: "청소년부", parent_dept_id: 3, created_at: "2025-10-02 11:56:37", updated_at: "2025-10-02 11:56:37", dept_cd: "TEE" },
  { id: 11, dept_name: "실내악단", parent_dept_id: 2, created_at: "2025-10-04 02:43:00", updated_at: "2025-10-04 02:43:30", dept_cd: "ORC" },
];

const departments = reactive([...seedDepartments]);
const selected = ref(null);
const editable = ref(createBlank());
const searchKeyword = ref("");

function createBlank(parentId = null) {
  return {
    id: null,
    dept_name: "",
    dept_cd: "",
    parent_dept_id: parentId,
    created_at: "",
    updated_at: "",
    isNew: true,
  };
}

function formatNow() {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace("T", " ");
}

function buildTree(list) {
  const map = new Map();
  list.forEach((item) => map.set(item.id, { ...item, children: [] }));
  const roots = [];

  map.forEach((node) => {
    if (node.parent_dept_id && map.has(node.parent_dept_id)) {
      map.get(node.parent_dept_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.dept_name.localeCompare(b.dept_name));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

const departmentTree = computed(() => buildTree(departments));

const filteredTree = computed(() => {
  if (!searchKeyword.value.trim()) return departmentTree.value;
  const keyword = searchKeyword.value.toLowerCase();
  const filterNode = (node) => {
    const matched =
      node.dept_name.toLowerCase().includes(keyword) ||
      (node.dept_cd && node.dept_cd.toLowerCase().includes(keyword));
    const children = node.children.map(filterNode).filter(Boolean);
    if (matched || children.length) {
      return { ...node, children };
    }
    return null;
  };
  return departmentTree.value
    .map(filterNode)
    .filter(Boolean);
});

const parentOptions = computed(() => {
  const flatten = (nodes, depth = 0) =>
    nodes.flatMap((node) => [
      { id: node.id, label: `${"— ".repeat(depth)}${node.dept_name}` },
      ...flatten(node.children || [], depth + 1),
    ]);
  return flatten(departmentTree.value);
});

const filteredList = computed(() => {
  if (!searchKeyword.value.trim()) return departments;
  const keyword = searchKeyword.value.toLowerCase();
  return departments.filter(
    (dept) =>
      dept.dept_name.toLowerCase().includes(keyword) ||
      (dept.dept_cd && dept.dept_cd.toLowerCase().includes(keyword)) ||
      (parentName(dept.parent_dept_id) || "").toLowerCase().includes(keyword)
  );
});

function parentName(parentId) {
  if (!parentId) return "";
  const found = departments.find((d) => d.id === parentId);
  return found ? found.dept_name : "";
}

function selectById(id) {
  const found = departments.find((d) => d.id === id);
  if (!found) return;
  selected.value = found;
  editable.value = { ...found, isNew: false };
}

function startCreateRoot() {
  selected.value = null;
  editable.value = createBlank();
}

function startCreateChild() {
  if (!selected.value) return;
  editable.value = createBlank(selected.value.id);
}

function saveDepartment() {
  if (!editable.value.dept_name) {
    alert("부서명을 입력해주세요.");
    return;
  }

  const trimmedName = editable.value.dept_name.trim();
  const trimmedCode = (editable.value.dept_cd || "").trim();

  if (!trimmedName) {
    alert("부서명을 입력해주세요.");
    return;
  }

  if (editable.value.isNew) {
    const duplicateName = departments.some(
      (d) => d.dept_name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    const duplicateCode = trimmedCode
      ? departments.some(
          (d) => d.dept_cd && d.dept_cd.trim().toLowerCase() === trimmedCode.toLowerCase()
        )
      : false;

    if (duplicateName || duplicateCode) {
      alert("동일한 부서명 또는 부서 코드가 이미 등록되어 있습니다.");
      return;
    }

    const newId = (departments.length ? Math.max(...departments.map((d) => d.id)) : 0) + 1;
    const now = formatNow();
    const newDept = {
      ...editable.value,
      id: newId,
      dept_name: trimmedName,
      dept_cd: trimmedCode,
      created_at: now,
      updated_at: now,
      isNew: false,
    };
    departments.push(newDept);
    selectById(newId);
  } else {
    const idx = departments.findIndex((d) => d.id === editable.value.id);
    if (idx >= 0) {
      departments[idx] = {
        ...departments[idx],
        ...editable.value,
        dept_name: trimmedName,
        dept_cd: trimmedCode,
        updated_at: formatNow(),
        isNew: false,
      };
      selectById(editable.value.id);
    }
  }
}

function deleteDepartment() {
  if (editable.value.isNew || !editable.value.id) return;

  const confirmed = confirm("선택한 부서를 삭제하시겠습니까? 하위 부서는 최상위로 이동합니다.");
  if (!confirmed) return;

  const targetId = editable.value.id;

  departments.forEach((dept) => {
    if (dept.parent_dept_id === targetId) {
      dept.parent_dept_id = null;
    }
  });

  const index = departments.findIndex((d) => d.id === targetId);
  if (index >= 0) {
    departments.splice(index, 1);
  }

  selected.value = null;
  editable.value = createBlank();
}

function resetForm() {
  if (selected.value) {
    editable.value = { ...selected.value, isNew: false };
  } else {
    editable.value = createBlank();
  }
}

const DepartmentNode = defineComponent({
  name: "DepartmentNode",
  props: {
    node: { type: Object, required: true },
    keyword: { type: String, default: "" },
    selectedId: { type: Number, default: null },
    onSelect: { type: Function, required: true },
  },
  setup(props) {
    const isMatch = computed(() => {
      if (!props.keyword) return false;
      const keyword = props.keyword.toLowerCase();
      return (
        props.node.dept_name.toLowerCase().includes(keyword) ||
        (props.node.dept_cd && props.node.dept_cd.toLowerCase().includes(keyword))
      );
    });

    return () =>
      h("li", { class: "space-y-1" }, [
        h(
          "div",
          {
            class: [
              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer",
              props.selectedId === props.node.id
                ? "bg-indigo-100 border-indigo-300 font-semibold"
                : "hover:bg-indigo-50",
            ],
            onClick: () => props.onSelect(props.node.id),
          },
          [
            h("span", { class: "text-gray-500 text-xs" }, props.node.dept_cd || "—"),
            h(
              "span",
              { class: isMatch.value ? "bg-yellow-100 px-1 rounded" : "" },
              props.node.dept_name
            ),
          ]
        ),
        props.node.children && props.node.children.length
          ? h(
              "ul",
              { class: "pl-4 border-l border-dashed border-gray-200 space-y-1" },
              props.node.children.map((child) =>
                h(DepartmentNode, {
                  key: child.id,
                  node: child,
                  keyword: props.keyword,
                  selectedId: props.selectedId,
                  onSelect: props.onSelect,
                })
              )
            )
          : null,
      ]);
  },
});
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>