<script setup lang="ts">
import { withBase } from 'vitepress'

defineProps<{
  title: string
  href: string
  badge?: string   // e.g. "Very Easy", "HTB", "CTF"
  date?: string    // ISO date string for display
  tags?: string[]
  repo?: string    // optional GitHub link → "View on GitHub" button
}>()
</script>

<template>
  <a :href="withBase(href)" class="vp-card">
    <article class="vp-card-inner">
      <div v-if="badge" class="vp-card-badge">{{ badge }}</div>
      <h3 class="vp-card-title">{{ title }}</h3>
      <p class="vp-card-details"><slot /></p>
      <div v-if="date || (tags && tags.length) || repo" class="vp-card-footer">
        <span v-if="date" class="vp-card-date">{{ date }}</span>
        <span v-for="tag in tags" :key="tag" class="tag-pill">{{ tag }}</span>
        <a v-if="repo" :href="repo" class="vp-card-repo" @click.stop target="_blank" rel="noopener">
          GitHub ↗
        </a>
      </div>
    </article>
  </a>
</template>
