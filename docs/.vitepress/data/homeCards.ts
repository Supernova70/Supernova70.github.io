export interface HomeCard {
  icon: string        // lucide icon name, e.g. 'shield' | 'book-open' | 'folder-git-2'
  title: string
  details: string
  link: string
}

export const homeCards: HomeCard[] = [
  { icon: 'file-terminal', title: 'Writeups', details: 'CTF writeups, RE notes & security research', link: '/writeups/' },
  { icon: 'book-open',     title: 'Blog',     details: 'Longer-form posts and learning logs',      link: '/blog/' },
  { icon: 'folder-git-2',  title: 'Projects', details: 'Tools and things I have built',            link: '/projects/' },
  { icon: 'user',          title: 'About',    details: 'Who I am and how to reach me',             link: '/about' },
]
