import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const triggerImport = ref<(() => void) | null>(null)
  const exportData = ref<(() => void) | null>(null)
  const importData = ref<((event: Event) => void) | null>(null)

  const registerImportExport = (
    triggerFn: () => void,
    exportFn: () => void,
    importFn: (event: Event) => void,
  ) => {
    triggerImport.value = triggerFn
    exportData.value = exportFn
    importData.value = importFn
  }

  const doTriggerImport = () => {
    triggerImport.value?.()
  }

  const doExportData = () => {
    exportData.value?.()
  }

  const doImportData = (event: Event) => {
    importData.value?.(event)
  }

  return {
    triggerImport,
    exportData,
    importData,
    registerImportExport,
    doTriggerImport,
    doExportData,
    doImportData,
  }
})
