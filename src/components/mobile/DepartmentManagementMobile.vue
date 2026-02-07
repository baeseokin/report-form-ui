<template>
  <div class="font-nanum text-gray-800">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
      <div class="px-4 py-3 flex items-center justify-end gap-3">
        <button
          class="shrink-0 px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          @click="resetForm"
        >
          새로고침
        </button>
      </div>

      <!-- Actions -->
      <div class="px-4 pb-3 flex gap-2">
        <button
          class="flex-1 px-3 py-2 text-sm rounded-lg bg-emerald-500 text-white shadow hover:bg-emerald-600"
          @click="startCreateRoot"
        >
          ＋ 최상위
        </button>
        <button
          class="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600 disabled:opacity-50"
          :disabled="!selected"
          @click="startCreateChild"
        >
          ＋ 하위
        </button>
      </div>

      <!-- Search -->
      <div class="px-4 pb-4">
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <span class="absolute left-3 top-2.5 text-gray-400 text-sm">🔎</span>
            <input
              v-model="searchKeyword"
              type="search"
              placeholder="부서명·코드 검색"
              class="mobile-form-control pl-9"
            />
          </div>
          <button
            class="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            @click="searchKeyword = ''"
          >
            초기화
          </button>
        </div>
      </div>
    </div>

    <div class="px-4 py-4 space-y-4">
      <!-- Tree (Accordion list) -->
      <section class="bg-white rounded-xl shadow p-3">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-gray-800">조직 트리</h2>
          <p class="text-xs text-gray-500">총 {{ departments.length }}개</p>
        </div>

        <p v-if="filteredTree.length === 0" class="text-sm text-gray-500 py-6 text-center">
          검색 결과가 없습니다.
        </p>
        <ul v-else class="space-y-2">
          <DepartmentNode
            v-for="node in filteredTree"
            :key="node.id"
            :node="node"
            :keyword="searchKeyword"
            :selected-id="selected?.id"
            :on-select="selectById"
          />
        </ul>
      </section>

      <!-- 부서 상세 (세로 배열) -->
      <section class="bg-white rounded-xl shadow p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800">
            {{ editable.isNew ? "🆕 새 부서 등록" : "📋 부서 상세" }}
          </h2>
          <span v-if="selected" class="text-xs text-gray-500">선택됨</span>
        </div>

        <div class="space-y-4">
          <label class="block text-sm font-semibold text-gray-700">
            부서명
            <input
              v-model="editable.dept_name"
              class="mt-1 mobile-form-control"
              placeholder="예: 기획팀"
            />
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            부서 코드
            <input
              v-model="editable.dept_cd"
              class="mt-1 mobile-form-control"
              placeholder="예: PLAN"
              maxlength="10"
            />
            <p class="mt-1 text-[11px] text-gray-500">
              신규 등록 시 부서코드는 <strong>대문자 3자리</strong>만 허용됩니다.
            </p>
          </label>

          <label class="block text-sm font-semibold text-gray-700">
            상위 부서
            <select
              v-model="editable.parent_dept_id"
              class="mt-1 mobile-form-control mobile-form-control-select"
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

          <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <p class="font-semibold">생성일</p>
              <p class="mt-1 border rounded-lg px-3 py-2 bg-gray-50 truncate">{{ editable.created_at || "-" }}</p>
            </div>
            <div>
              <p class="font-semibold">수정일</p>
              <p class="mt-1 border rounded-lg px-3 py-2 bg-gray-50 truncate">{{ editable.updated_at || "-" }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-40"
            :disabled="!editable.dept_name"
            @click="saveDepartment"
          >
            저장
          </button>
          <button
            class="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg shadow hover:bg-rose-600 disabled:opacity-40"
            :disabled="editable.isNew"
            @click="deleteDepartment"
          >
            삭제
          </button>
        </div>

        <button
          class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          @click="resetForm"
        >
          입력 초기화
        </button>
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
  return departmentTree.value.map(filterNode).filter(Boolean);
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

  // 신규 등록 시: 부서 코드는 대문자 3자리
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
    dept_name: trimmedName,
    dept_cd: trimmedCode || null,
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
      if (currentId) selectById(currentId);
    }
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
    // 모바일에서는 기본적으로 2 depth 까지만 펼치고, 검색 시 모두 펼침
    const isOpen = ref(props.depth < 2);

    watch(
      () => props.keyword,
      (newVal) => {
        if (newVal) isOpen.value = true;
        else isOpen.value = props.depth < 2;
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

    const badgeClass = computed(() =>
      props.selectedId === props.node.id
        ? "bg-indigo-100 text-indigo-800 border-indigo-200"
        : "bg-gray-50 text-gray-700 border-gray-200"
    );

    return () =>
      h("li", { class: "space-y-1" }, [
        h(
          "div",
          {
            class: [
              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none",
              props.selectedId === props.node.id ? "bg-indigo-50 border-indigo-200" : "hover:bg-gray-50",
            ],
            onClick: () => props.onSelect(props.node.id),
          },
          [
            // 토글 아이콘
            props.node.children && props.node.children.length
              ? h(
                  "button",
                  {
                    class: "text-gray-400 hover:text-gray-600 w-6 h-6 grid place-items-center rounded",
                    onClick: toggle,
                    type: "button",
                    "aria-label": "toggle",
                  },
                  isOpen.value ? "▼" : "▶"
                )
              : h("span", { class: "w-6" }),

            h(
              "span",
              { class: ["text-[11px] font-mono px-2 py-0.5 rounded border", badgeClass.value] },
              props.node.dept_cd || "—"
            ),
            h(
              "span",
              { class: ["text-sm", isMatch.value ? "bg-yellow-100 px-1 rounded" : "", "truncate"] },
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

