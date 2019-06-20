import React from 'react'

import { IdentityProvider } from './identity-manager'
import { SettingsProvider } from './vote-settings-manager'
import { AppLogicProvider } from './app-logic'

function App() {
  return (
    <div css="min-width: 320px">
      hi! :D
    </div>
  )
}

export default () => (
  <AppLogicProvider>
    <IdentityProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </IdentityProvider>
  </AppLogicProvider>
)
