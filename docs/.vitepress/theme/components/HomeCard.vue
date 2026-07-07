<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import * as icons from 'lucide-vue-next'

const props = defineProps<{
  icon: string; title: string; details: string; link: string
}>()

// 'file-terminal' -> 'FileTerminal' (lucide export name)
const IconComp = computed(() => {
  const name = props.icon.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')
  return (icons as any)[name] ?? icons.Square
})
</script>

<template>
  <a :href="withBase(link)" class="home-card">
    <span class="home-card-icon"><component :is="IconComp" :size="22" /></span>
    <h3 class="home-card-title">{{ title }}</h3>
    <p class="home-card-details">{{ details }}</p>
  </a>
</template>
