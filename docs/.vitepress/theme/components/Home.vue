<script setup lang="ts">
import { homeCards } from '../../data/homeCards'
import HomeCard from './HomeCard.vue'
import { useData, withBase } from 'vitepress'
const { site } = useData()
</script>

<template>
  <div class="home">
    <section class="hero">
      <img class="hero-logo" :src="withBase('/logo.svg')" alt="logo" />
      <h1 class="hero-title">{{ site.title }}</h1>
      <p class="hero-tagline">Cybersecurity · Reverse Engineering · CTFs</p>
    </section>

    <section class="home-grid">
      <HomeCard
        v-for="c in homeCards"
        :key="c.link"
        :icon="c.icon"
        :title="c.title"
        :details="c.details"
        :link="c.link"
      />
    </section>
  </div>
</template>
