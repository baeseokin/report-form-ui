import { createRouter, createWebHistory } from "vue-router";
import ReportForm from "../components/ReportForm.vue";
import ApprovalList from "../components/ApprovalList.vue";

const routes = [
  { path: "/", component: ReportForm },
  { path: "/approvalList", component: ApprovalList },
  { path: "/report/:id?", name: "ReportForm", component: ReportForm, props: true }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
