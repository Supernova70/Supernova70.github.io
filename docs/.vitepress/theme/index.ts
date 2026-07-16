import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import './custom.css'

import HomeLayout from './components/Home.vue'
import HomeCard from './components/HomeCard.vue'
import Card from './components/Card.vue'
import Grid from './components/Grid.vue'
import PageMeta from './components/PageMeta.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // Renders date + tag pills immediately before page content on doc pages
      'doc-before': () => h(PageMeta),
    })
  },
  enhanceApp({ app }) {
    // custom landing layout, selected via `layout: home-custom` frontmatter
    app.component('home-custom', HomeLayout)
    // usable inline in any markdown listing page
    app.component('HomeCard', HomeCard)
    app.component('Card', Card)
    app.component('Grid', Grid)
  },
} satisfies Theme
