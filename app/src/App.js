import React from 'react'
import { SyncIndicator, Main } from '@aragon/ui'

import EmptyState from './screens/EmptyState'
import Votes from './screens/Votes'
import VotePanel from './components/VotePanel'
import AppLayout from './components/AppLayout'

import { IdentityProvider } from './identity-manager'
import { SettingsProvider } from './vote-settings-manager'
import { AppLogicProvider, useAppLogic } from './app-logic'

function App() {
  const {
    isSyncing,
    intents,
    selectedIntent,
    actions,
    selectIntent,
    newIntentPanel,
    selectedIntentPanel,
  } = useAppLogic()


  return (
    <div css="min-width: 320px">
      <Main assetsUrl="./aragon-ui">
        <SyncIndicator visible={isSyncing} />
        <AppLayout
          title="Approvals"
        >
          {intents.length > 0 ? (
            <Votes intents={intents} onSelectIntent={selectIntent} />
          ) : (
            !isSyncing && <EmptyState onActivate={newIntentPanel.requestOpen} />
          )}
        </AppLayout>

        <VotePanel
          intent={selectedIntent}
          onApprove={actions.approve}
          onReject={actions.reject}
          panelState={selectedIntentPanel}
        />
      </Main>
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
