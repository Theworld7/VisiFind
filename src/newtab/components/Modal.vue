<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:open', 'close'])

const handleClose = () => {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 modal-backdrop"
          @click="handleClose"
        />

        <!-- Modal -->
        <div class="relative modal-content rounded-lg w-full max-w-md mx-4 overflow-hidden max-h-[80vh] flex flex-col text-white">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-white/20 shrink-0">
            <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
            <button
              class="p-1 rounded-md hover:bg-white/10 transition-colors"
              @click="handleClose"
            >
              <X class="w-5 h-5 text-white" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-4 overflow-y-auto">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.1s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.1s ease, opacity 0.1s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}
</style>
