import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Supernova70',
  description: 'Cybersecurity · Reverse Engineering · CTFs',
  lang: 'en-US',

  // Served from the ROOT ('/') — correct for a custom domain (yourdomain.com/)
  // or a GitHub user site repo (`<username>.github.io`).
  // ONLY change back to '/portfolio/' if you deploy to a GitHub Pages *project*
  // page (username.github.io/portfolio/) without a custom domain.
  base: '/',

  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { property: 'og:image', content: '/og.png' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Writeups', link: '/writeups/' },
      { text: 'Blog',     link: '/blog/' },
      { text: 'Projects', link: '/projects/' },
      { text: 'About',    link: '/about' },
    ],

    // Sidebars: auto-grouped per section.
    sidebar: {
      '/writeups/': [
        {
          text: 'Labs',
          items: [
            {
              text: 'HackTheBox',
              link: '/writeups/htb',
              collapsed: false,
              items: [
                { text: 'Appointment', link: '/writeups/htb-appointment' },
                { text: 'Crocodile',   link: '/writeups/htb-crocodile' },
                { text: 'Funnel',      link: '/writeups/htb-funnel' },
                { text: 'Mongod',      link: '/writeups/htb-mongod' },
                { text: 'Pennyworth',  link: '/writeups/htb-pennyworth' },
                { text: 'Synced',      link: '/writeups/htb-synced' },
                { text: 'Tactics',     link: '/writeups/htb-tactics' },
              ],
            },
            {
              text: 'TryHackMe',
              link: '/writeups/thm',
              collapsed: false,
              items: [
                { text: 'Lian Yu', link: '/writeups/thm-lian-yu' },
              ],
            },
          ],
        },
        {
          text: 'CTF',
          items: [
            { text: 'PicoCTF — Binary Exploitation', link: '/writeups/picoctf-binexp' },
          ],
        },
        {
          text: 'Reverse Engineering',
          items: [
            { text: 'Hero RideGuide BLE RE', link: '/writeups/hero-rideguide-ble' },
          ],
        },
      ],
      '/blog/': [
        {
          text: 'Blog',
          items: [
            { text: 'Making a Motorcycle Draw My Arrows', link: '/blog/reverse-engineering-ble' },
          ],
        },
      ],
      '/projects/': [
        {
          text: 'Projects',
          items: [
            { text: 'Hero RideGuide BLE RE',    link: '/projects/hero-rideguide-re' },
            { text: 'PhishDetect Scanner',       link: '/projects/phishdetect' },
          ],
        },
      ],
    },

    // Outline depth and label
    outline: { level: [2, 3], label: 'On this page' },

    // Last-updated display
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    },

    // Prev/next labels on doc pages
    docFooter: {
      prev: '← Previous',
      next: 'Next →',
    },

    search: { provider: 'local' },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Supernova70' },
      // LinkedIn removed — old URL pointed to someone else's profile.
      // Add back once you have your own: { icon: 'linkedin', link: 'https://www.linkedin.com/in/<you>/' },
    ],

    editLink: {
      pattern: 'https://github.com/Supernova70/Supernova70.github.io/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Security research & reverse engineering notes',
      copyright: '© 2026 Supernova70',
    },

    // Mark external links with an icon (default VitePress feature)
    externalLinkIcon: true,
  },
})
