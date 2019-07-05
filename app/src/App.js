import React from 'react'
import { SyncIndicator, Main } from '@aragon/ui'

import EmptyState from './screens/EmptyState'
import IntentsScreen from './screens/Intents'
import IntentPanel from './components/IntentPanel'
import AppLayout from './components/AppLayout'

import { IdentityProvider } from './identity-manager'
import { AppLogicProvider, useAppLogic } from './app-logic'

function App() {
  const {
    isSyncing,
    intents,
    selectedIntent,
    actions,
    selectIntent,
    selectedIntentPanel,
  } = useAppLogic()

  return (
    <div css="min-width: 320px">
      <Main assetsUrl="./aragon-ui">
        <SyncIndicator visible={isSyncing} />
        <AppLayout title="Approvals">
          {intents.length > 0 ? (
            <IntentsScreen intents={intents} onSelectIntent={selectIntent} />
          ) : (
            !isSyncing && <EmptyState />
          )}
        </AppLayout>

        <IntentPanel
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
      <App />
    </IdentityProvider>
  </AppLogicProvider>
)
