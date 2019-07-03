import { useEffect, useMemo, useState } from 'react'
import { useAragonApi, useAppState } from '@aragon/api-react'
import {
  getCanExecute,
  getCanVote,
  getUserBalance,
  isIntentPending,
} from './vote-utils'
import { usePromise } from './utils-hooks'
import { VOTE_ABSENT } from './vote-types'


// Get the votes array ready to be used in the app.
export function useIntents() {
  const { intents, connectedAccountIntents } = useAppState()
  const pendingStates = (intents || []).map(i => isIntentPending(i))
  const pendingStatesKey = pendingStates.join('')

  return useMemo(() => {
    if (!intents) return []
    return intents.map((intent, i) => ({
      ...intent,
      data: {
        ...intent.data,

        metadata: intent.data.metadata || '',
        description: intent.data.description || '',
        open: pendingStates[i],
      },
      connectedAccountIntents: connectedAccountIntents[intent.intentId] || VOTE_ABSENT,
    }))
  }, [intents, connectedAccountIntents, pendingStatesKey])
}

// Load and returns the token contract, or null if not loaded yet.
export function useTokenContract() {
  const { api, appState } = useAragonApi()
  const { tokenAddress } = appState
  const [contract, setContract] = useState(null)

  useEffect(() => {
    // We assume there is never any reason to set the contract back to null.
    if (api && tokenAddress) {
      setContract(api.external(tokenAddress, {}))
    }
  }, [api, tokenAddress])

  return contract
}

// Get the extended data related to a vote
export function useExtendedVoteData(vote) {
  const {
    api,
    connectedAccount,
    appState: { tokenDecimals },
  } = useAragonApi()

  const tokenContract = useTokenContract()

  const canExecute = usePromise(
    () => getCanExecute(vote, api),
    [vote && vote.voteId, api],
    false
  )

  const canUserVote = usePromise(
    () => getCanVote(vote, connectedAccount, api),
    [vote && vote.voteId, connectedAccount, api],
    false
  )

  const userBalance = usePromise(
    () => getUserBalance(vote, connectedAccount, tokenContract, tokenDecimals),
    [vote && vote.voteId, connectedAccount, tokenContract, tokenDecimals],
    -1
  )

  return { canExecute, canUserVote, userBalance }
}
