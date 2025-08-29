import { createRouter, createWebHistory } from "vue-router";
import ReportForm from "../components/ReportForm.vue";
import ApprovalList from "../components/ApprovalList.vue";

const routes = [
  { path: "/", component: ReportForm },
  { path: "/approvalList", component: ApprovalList },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
