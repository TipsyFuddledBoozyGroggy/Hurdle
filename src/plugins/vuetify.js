// Vuetify plugin configuration
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Custom theme for Hurdle game
const hurdleTheme = {
  dark: true,
  colors: {
    primary: '#538d4e', // Wordle green
    secondary: '#b59f3b', // Wordle yellow
    accent: '#818384', // Wordle gray
    error: '#d32f2f',
    info: '#2196F3',
    success: '#538d4e',
    warning: '#b59f3b',
    background: '#121213', // Dark background
    surface: '#1a1a1b',
    'on-background': '#ffffff',
    'on-surface': '#ffffff',
    'tile-empty': '#121213',
    'tile-filled': '#121213',
    'tile-correct': '#538d4e',
    'tile-present': '#b59f3b',
    'tile-absent': '#3a3a3c',
    'border-empty': '#3a3a3c',
    'border-filled': '#565758',
    'border-active': '#818384'
  }
}

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'hurdleTheme',
    themes: {
      hurdleTheme
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none;'
    },
    VCard: {
      elevation: 2
    }
  }
})