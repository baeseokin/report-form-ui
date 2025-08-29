<template>
  <div class="p-6 font-nanum">
    <nav class="flex gap-4 mb-6">
      <router-link to="/" class="text-blue-600 hover:underline">보고서 작성</router-link>
      <router-link to="/approvalList" class="text-blue-600 hover:underline">청구목록 조회</router-link>
    </nav>

    <router-view />
  </div>
</template>
