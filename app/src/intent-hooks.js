import { useMemo } from 'react'
import { useAppState } from '@aragon/api-react'
import { isIntentPending } from './intent-utils'

// Get the intents array ready to be used in the app.
export function useIntents() {
  const { intents } = useAppState()
  const pendingStates = (intents || []).map(i => isIntentPending(i))
  const pendingStatesKey = pendingStates.join('')
  return useMemo(() => intents || [], [intents, pendingStatesKey])
}
