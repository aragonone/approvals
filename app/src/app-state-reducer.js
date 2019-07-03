function appStateReducer(state) {
  console.log(state) // TODO: remove afterwards

  if (!state) {
    return { ...state, ready: false }
  }

  const { intents, connectedAccountIntents } = state

  return {
    ...state,
    ready: true,
    intents: intents ? intents : [],
    connectedAccountIntents: connectedAccountIntents || {},
  }
}

export default appStateReducer
