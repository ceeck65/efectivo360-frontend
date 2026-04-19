/**
 * @fileoverview Router para el módulo de Chat
 * @module @modules/chat/router
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import ChatView from './views/ChatView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/admin/chat',
    name: 'Chat',
    component: ChatView,
    meta: {
      requiresAuth: true,
      requiresStaff: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
export { routes as chatRoutes };
