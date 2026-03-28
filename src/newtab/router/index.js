import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/intake',
      name: 'intake',
      component: () => import('../views/IntakeView.vue'),
      redirect: '/intake/daily',
      children: [
        {
          path: 'daily',
          name: 'daily-intake',
          component: () => import('../views/DailyIntake.vue'),
        },
        {
          path: 'food-library',
          name: 'food-library',
          component: () => import('../views/FoodLibrary.vue'),
        },
      ],
    },
    {
      path: '/weight',
      name: 'weight',
      component: () => import('../views/WeightView.vue'),
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('../views/DocumentsView.vue'),
    },
    {
      path: '/items',
      name: 'items',
      component: () => import('../views/ItemsView.vue'),
    },
    {
      path: '/series',
      name: 'series',
      component: () => import('../views/SeriesView.vue'),
    },
  ],
})

export default router