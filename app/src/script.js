import Aragon, { events } from '@aragon/api'
import { EMPTY_CALLSCRIPT } from './evmscript-utils'

const app = new Aragon()

let connectedAccount

/*
 * Calls `callback` exponentially, everytime `retry()` is called.
 *
 * Usage:
 *
 * retryEvery(retry => {
 *  // do something
 *
 *  if (condition) {
 *    // retry in 1, 2, 4, 8 seconds… as long as the condition passes.
 *    retry()
 *  }
 * }, 1000, 2)
 *
 */
const retryEvery = (callback, initialRetryTimer = 1000, increaseFactor = 5) => {
  const attempt = (retryTimer = initialRetryTimer) => {
    // eslint-disable-next-line standard/no-callback-literal
    callback(() => {
      console.error(`Retrying in ${retryTimer / 1000}s...`)

      // Exponentially backoff attempts
      setTimeout(() => attempt(retryTimer * increaseFactor), retryTimer)
    })
  }
  attempt()
}

// Get the token address to initialize ourselves
retryEvery(retry => {
  app
    .call('isForwarder') // TODO: I think we don't need this
    .toPromise()
    .then(initialize)
    .catch(err => {
      console.error('Could not start background script execution due to the contract not loading the token:', err)
      retry()
    })
})

async function initialize() {
  return app.store(
    (state, { event, returnValues }) => {
      const nextState = { ...state }

      switch (event) {
        case events.ACCOUNTS_TRIGGER:
          return updateConnectedAccount(nextState, returnValues)
        case events.SYNC_STATUS_SYNCING:
          return { ...nextState, isSyncing: true }
        case events.SYNC_STATUS_SYNCED:
          return { ...nextState, isSyncing: false }
        case 'IntentRejected':
          return rejectIntent(nextState, returnValues)
        case 'IntentApproved':
          return approveIntent(nextState, returnValues)
        case 'IntentSubmitted':
          return submitIntent(nextState, returnValues)
        default:
          return nextState
      }
    },
    { init: initState }
  )
}

const initState = async cachedState => {
  return {
    ...cachedState,
    isSyncing: true
  }
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function updateConnectedAccount(state, { account }) {
  connectedAccount = account
  return {
    ...state,
    // fetch all the intents casted by the connected account
    connectedAccountIntents: state.intents ? await getAccountIntents({ connectedAccount: account, intents: state.intents }) : {},
  }
}

async function approveIntent(state, { intentId, moderator }) {
  const transform = ({ data, ...intent }) => ({ ...intent, data: { ...data, status: 'approved', moderator }})
  return updateState(state, intentId, transform)
}

async function rejectIntent(state, { intentId, moderator }) {
  const transform = ({ data, ...intent }) => ({ ...intent, data: { ...data, status: 'rejected', moderator }})
  return updateState(state, intentId, transform)
}

async function submitIntent(state, { intentId, submitter }) {
  const transform = ({ data, ...intent }) => ({ ...intent, data: { ...data, status: 'pending', submitter }})
  return updateState(state, intentId, transform)
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

// Default intents to an empty array to prevent errors on initial load
async function getAccountIntents({ connectedAccount, intents = [] }) {
  return intents.filter(({ submitter }) => submitter === connectedAccount)
}

async function loadIntentDescription(intent) {
  if (!intent.script || intent.script === EMPTY_CALLSCRIPT) {
    return intent
  }

  try {
    const path = await app.describeScript(intent.script).toPromise()

    intent.description = path
      ? path
        .map(step => {
          const identifier = step.identifier ? ` (${step.identifier})` : ''
          const app = step.name ? `${step.name}${identifier}` : `${step.to}`
          return `${app}: ${step.description || 'No description'}`
        })
        .join('\n')
      : ''
  } catch (error) {
    console.error('Error describing intent script', error)
    intent.description = 'Invalid script. The result cannot be executed.'
  }

  return intent
}

function loadIntentData(intentId) {
  return app
    .call('getIntent', intentId)
    .toPromise()
    .then(intent => loadIntentDescription(marshallIntent(intent)))
}

async function updateIntents(intents, intentId, transform) {
  const intentIndex = intents.findIndex(intent => intent.intentId === intentId)

  if (intentIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    return intents.concat(
      await transform({ intentId, data: await loadIntentData(intentId) })
    )
  } else {
    const nextIntents = Array.from(intents)
    nextIntents[intentIndex] = await transform(nextIntents[intentIndex])
    return nextIntents
  }
}

async function updateState(state, intentId, transform) {
  const { intents = [] } = state

  return {
    ...state,
    intents: await updateIntents(intents, intentId, transform),
  }
}

// Apply transformations to an intent received from web3
function marshallIntent({ state, script }) {
  return { state, script }
}
