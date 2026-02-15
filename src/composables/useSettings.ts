import { ref, computed, watch } from 'vue'

const showSettingsDrawer = ref(false)

export function useSettings() {
  const formValue = ref({
    mode: 'color' as 'color' | 'upload' | 'url',
    url: '',
    blur: 0,
    color: '#1a1a2e',
  })

  const tempBackgroundUrl = ref('')
  const backgroundFileInput = ref<HTMLInputElement | null>(null)

  const selectFileButtonText = computed(() =>
    tempBackgroundUrl.value ? '重新选择图片' : '选择图片',
  )

  const triggerFileInput = () => {
    backgroundFileInput.value?.click()
  }

  const handleBackgroundUpload = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        tempBackgroundUrl.value = e.target?.result as string
        formValue.value.mode = 'upload'
      }
      reader.readAsDataURL(file)
    }
  }

  const syncFormWithSettings = (
    mode: 'color' | 'upload' | 'url',
    url: string,
    blur: number,
    color: string,
  ) => {
    tempBackgroundUrl.value = url
    formValue.value.mode = mode
    formValue.value.url = mode === 'url' ? url : ''
    formValue.value.blur = blur
    formValue.value.color = color
  }

  const openSettings = () => {
    showSettingsDrawer.value = true
  }

  const closeSettings = () => {
    showSettingsDrawer.value = false
  }

  return {
    showSettingsDrawer,
    formValue,
    tempBackgroundUrl,
    backgroundFileInput,
    selectFileButtonText,
    triggerFileInput,
    handleBackgroundUpload,
    syncFormWithSettings,
    openSettings,
    closeSettings,
  }
}
