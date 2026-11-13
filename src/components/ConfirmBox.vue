<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
      <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
      <p class="text-gray-700 mb-6">{{ message }}</p>
      <div class="flex justify-center gap-3">
        <button
          @click="$emit('cancel')"
          class="btn btn-secondary"
        >
          중단
        </button>
        <button
          @click="$emit('confirm')"
          class="btn btn-primary"
        >
          계속진행
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: "알림" },
  message: { type: String, default: "" },
});

defineEmits(["confirm", "cancel"]);
</script>