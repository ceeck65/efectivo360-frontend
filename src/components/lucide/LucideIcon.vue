<template>
  <component :is="iconComponent" :size="size" :class="className" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

interface Props {
  name: string
  size?: number | string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  className: '',
})

const iconComponent = computed(() => {
  if (!props.name) return LucideIcons.Circle

  // Convert PascalCase to camelCase if needed
  const iconName = props.name.charAt(0).toLowerCase() + props.name.slice(1)
  return (LucideIcons as any)[props.name] || (LucideIcons as any)[iconName] || LucideIcons.Circle
})
</script>
