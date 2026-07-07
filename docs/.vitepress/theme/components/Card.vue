<script setup lang="ts">
import { withBase } from 'vitepress'
defineProps<{ title: string; href: string }>()
</script>

<template>
  <a :href="withBase(href)" class="vp-card">
    <article class="vp-card-inner">
      <h3 class="vp-card-title">{{ title }}</h3>
      <p class="vp-card-details"><slot /></p>
    </article>
  </a>
</template>
