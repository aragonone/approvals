import appStateReducer from './app-state-reducer'
import { useIntents } from './intent-hooks'
import { usePanelState } from './utils-hooks'
import { AragonApi, useApi, useAppState } from '@aragon/api-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

// Get the intent currently selected, or null otherwise.
export function useSelectedIntent(intents) {
  const [selectedIntentId, setSelectedIntentId] = useState('-1')
  const { ready } = useAppState()

  // The memoized intent currently selected.
  const selectedIntent = useMemo(() => {
    // The `ready` check prevents a intent to be selected
    // until the app state is fully ready.
    if (!ready || selectedIntentId === '-1') {
      return null
    }
    return intents.find(intent => intent.intentId === selectedIntentId) || null
  }, [selectedIntentId, intents, ready])

  return [
    selectedIntent,

    // setSelectedIntentId() is exported directly: since `selectedIntentId` is
    // set in the `selectedIntent` dependencies, it means that the useMemo()
    // will be updated every time `selectedIntentId` changes.
    setSelectedIntentId,
  ]
}

// Approve an intent
export function useApproveAction(onDone) {
  const api = useApi()
  return useCallback(
    intentId => {
      // Don't care about response
      api.approve(intentId).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

// Reject an intent
export function useRejectAction(onDone) {
  const api = useApi()
  return useCallback(
    intentId => {
      // Don't care about response
      api.reject(intentId).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

// Handles the state of the selected intent panel.
export function useSelectedIntentPanel(selectedIntent, selectIntent) {
  const selectedIntentId = selectedIntent ? selectedIntent.intentId : '-1'

  // Only deselect the current intent when the panel is fully closed, so that
  // the panel doesn’t appear empty while being closed.
  const onDidClose = useCallback(() => {
    selectIntent('-1')
  }, [selectIntent])

  const selectedIntentPanel = usePanelState({ onDidClose })

  // This is to help the React Hooks linter.
  const { requestOpen, didOpen } = selectedIntentPanel

  // When the selected intent changes, open the selected intent panel.
  useEffect(() => {
    if (selectedIntentId !== '-1' && !didOpen) {
      requestOpen()
    }
  }, [selectedIntentId, requestOpen, didOpen])

  return selectedIntentPanel
}

// Handles the main logic of the app.
export function useAppLogic() {
  const { isSyncing, ready } = useAppState()

  const intents = useIntents()
  const [selectedIntent, selectIntent] = useSelectedIntent(intents)
  const newIntentPanel = usePanelState()
  const selectedIntentPanel = useSelectedIntentPanel(selectedIntent, selectIntent)

  const actions = {
    approve: useApproveAction(selectedIntentPanel.requestClose),
    reject: useRejectAction(selectedIntentPanel.requestClose),
  }

  return {
    isSyncing: isSyncing || !ready,
    intents,
    selectIntent,
    selectedIntent,
    actions,
    newIntentPanel: useMemo(
      () => ({
        ...newIntentPanel,
        // ensure there is only one panel opened at a time
        visible: newIntentPanel.visible && !selectedIntentPanel.visible,
      }),
      [newIntentPanel, selectedIntentPanel.visible]
    ),
    selectedIntentPanel: useMemo(
      () => ({
        ...selectedIntentPanel,
        visible: selectedIntentPanel.visible && !newIntentPanel.visible,
      }),
      [selectedIntentPanel, newIntentPanel.visible]
    ),
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
