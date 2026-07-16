<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/**
 * Format a YAML date value (may arrive as a Date object from gray-matter
 * or as an ISO string after JSON serialisation during SSR hydration).
 * Uses UTC accessors so output is identical on server and client regardless
 * of the host's local timezone.
 */
function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(String(d))
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

const formattedDate = computed<string | null>(() => {
  const d = frontmatter.value.date as Date | string | undefined
  return d != null ? formatDate(d) : null
})

const tags = computed<string[]>(() => {
  const t = frontmatter.value.tags
  return Array.isArray(t) ? t : []
})

const repo = computed<string | null>(() => {
  const r = frontmatter.value.repo as string | undefined
  return r ?? null
})

const hasAnything = computed(
  () => formattedDate.value !== null || tags.value.length > 0 || repo.value !== null
)
</script>

<template>
  <div v-if="hasAnything" class="page-meta">
    <time v-if="formattedDate" class="page-date">{{ formattedDate }}</time>
    <span v-for="tag in tags" :key="tag" class="tag-pill">{{ tag }}</span>
    <a
      v-if="repo"
      :href="repo"
      class="page-repo-btn"
      target="_blank"
      rel="noopener noreferrer"
    >
      View on GitHub ↗
    </a>
  </div>
</template>
