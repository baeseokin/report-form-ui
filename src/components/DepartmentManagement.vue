<template>
  <div class="font-nanum text-gray-800 space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
      <!-- 좌측: 조직 트리 -->
      <section class="bg-white rounded-xl shadow p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">부서 목록</h2>
          <span class="text-sm text-gray-500">총 {{ departments.length }}개</span>
        </div>
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

      <!-- 우측: 부서 상세 (세로 배열) -->
      <section class="bg-white rounded-xl shadow p-6 lg:col-span-2 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ editable.isNew ? '🆕 새 부서 등록' : '📋 부서 상세' }}
          </h2>
        </div>

        <div class="space-y-4">
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

          <label class="block text-sm font-semibold text-gray-700">
            청구계좌정보
            <input
              v-model="editable.account_info"
              class="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="예: 국민 495201-01-22221112 홍길동"
            />
          </label>

          <div class="grid grid-cols-2 gap-3 text-sm text-gray-600">
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

        <div class="flex gap-2 mt-6">
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
      </section>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";

const departments = ref([]);
const selected = ref(null);
const editable = ref(createBlank());
const searchKeyword = ref("");

function createBlank(parentId = null) {
  return {
    id: null,
    dept_name: "",
    dept_cd: "",
    parent_dept_id: parentId,
    account_info: "",
    created_at: "",
    updated_at: "",
    isNew: true,
  };
}

async function fetchDepartments() {
  try {
    const { data } = await axios.get("/api/departments");
    departments.value = Array.isArray(data) ? data : [];

    if (selected.value) {
      const updated = departments.value.find((d) => d.id === selected.value.id);
      if (updated) {
        selected.value = updated;
        editable.value = { ...updated, isNew: false };
      } else {
        resetForm();
      }
    }
  } catch (err) {
    console.error("부서 목록을 불러오지 못했습니다.", err);
    alert("부서 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
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

const departmentTree = computed(() => buildTree(departments.value));

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
  if (!searchKeyword.value.trim()) return departments.value;
  const keyword = searchKeyword.value.toLowerCase();
  return departments.value.filter(
    (dept) =>
      dept.dept_name.toLowerCase().includes(keyword) ||
      (dept.dept_cd && dept.dept_cd.toLowerCase().includes(keyword)) ||
      (parentName(dept.parent_dept_id) || "").toLowerCase().includes(keyword)
  );
});

function parentName(parentId) {
  if (!parentId) return "";
  const found = departments.value.find((d) => d.id === parentId);
  return found ? found.dept_name : "";
}

function selectById(id) {
  const found = departments.value.find((d) => d.id === id);
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

async function saveDepartment() {
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

  if (editable.value.isNew && trimmedCode && !/^[A-Z]{3}$/.test(trimmedCode)) {
    alert("부서코드는 반드시 대문자 3자리여야 합니다.");
    return;
  }  
  if (
    editable.value.isNew &&
    departments.value.some((dept) => {
        const existingName = (dept.dept_name || "").trim();
        const existingCode = (dept.dept_cd || "").trim();

        return existingName === trimmedName || (trimmedCode && existingCode === trimmedCode);
    })
  ) {
    alert("동일한 부서코드 또는 이름을 등록할 수 없습니다.");
    return;
  }

  const payload = {
    dept_name: editable.value.dept_name,
    dept_cd: editable.value.dept_cd,
    account_info: editable.value.account_info,
    parent_dept_id: editable.value.parent_dept_id || null,
  };

    try {
        if (editable.value.isNew) {
            const { data } = await axios.post("/api/departments", payload);
            await fetchDepartments();

        if (data?.id) {
            selectById(data.id);
        } else {
            const created = departments.value.find(
            (d) => d.dept_name === trimmedName && (d.dept_cd || "") === trimmedCode
            );
            if (created) selectById(created.id);
        }
      } else {
            const currentId = editable.value.id;
            await axios.put(`/api/departments/${currentId}`, payload);
            await fetchDepartments();
            if (currentId) {
                selectById(currentId);
            }
      }
      alert("저장되었습니다.");
    } catch (err) {
        console.error("부서 저장에 실패했습니다.", err);
        alert("부서를 저장하지 못했습니다. 다시 시도해주세요.");
    }
}

async function deleteDepartment() {
  if (editable.value.isNew || !editable.value.id) return;

  const confirmed = confirm("선택한 부서를 삭제하시겠습니까? 하위 부서는 최상위로 이동합니다.");
  if (!confirmed) return;

  try {
    await axios.delete(`/api/departments/${editable.value.id}`);
    await fetchDepartments();
    selected.value = null;
    editable.value = createBlank();
    alert("삭제되었습니다.");
  } catch (err) {
    console.error("부서 삭제에 실패했습니다.", err);
    alert("부서를 삭제하지 못했습니다. 다시 시도해주세요.");
  }

}

function resetForm() {
  if (selected.value) {
    editable.value = { ...selected.value, isNew: false };
  } else {
    editable.value = createBlank();
  }
}

onMounted(fetchDepartments);

const DepartmentNode = defineComponent({
  name: "DepartmentNode",
  props: {
    node: { type: Object, required: true },
    keyword: { type: String, default: "" },
    selectedId: { type: Number, default: null },
    onSelect: { type: Function, required: true },
    depth: { type: Number, default: 1 },
  },
  setup(props) {
    // 기본적으로 2 depth 까지만 펼치고(1 Open, 2 Closed), 3 depth는 접음
    const isOpen = ref(props.depth < 2);

    watch(
      () => props.keyword,
      (newVal) => {
        if (newVal) {
          isOpen.value = true;
        } else {
          isOpen.value = props.depth < 2;
        }
      },
      { immediate: true }
    );

    const isMatch = computed(() => {
      if (!props.keyword) return false;
      const keyword = props.keyword.toLowerCase();
      return (
        props.node.dept_name.toLowerCase().includes(keyword) ||
        (props.node.dept_cd && props.node.dept_cd.toLowerCase().includes(keyword))
      );
    });

    const toggle = (e) => {
      e.stopPropagation();
      isOpen.value = !isOpen.value;
    };

    return () =>
      h("li", { class: "space-y-1" }, [
        h(
          "div",
          {
            class: [
              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none",
              props.selectedId === props.node.id
                ? "bg-indigo-100 border-indigo-300 font-semibold"
                : "hover:bg-indigo-50",
            ],
            onClick: () => props.onSelect(props.node.id),
          },
          [
            // 토글 버튼 (하위 노드가 있을 때만 표시)
            props.node.children && props.node.children.length
              ? h(
                  "span",
                  {
                    class: "text-gray-400 hover:text-gray-600 w-4 text-center",
                    onClick: toggle,
                  },
                  isOpen.value ? "▼" : "▶"
                )
              : h("span", { class: "w-4" }), // 공간 확보

            h("span", { class: "text-gray-500 text-xs" }, props.node.dept_cd || "—"),
            h(
              "span",
              { class: isMatch.value ? "bg-yellow-100 px-1 rounded" : "" },
              props.node.dept_name
            ),
          ]
        ),
        props.node.children && props.node.children.length && isOpen.value
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
                  depth: props.depth + 1,
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