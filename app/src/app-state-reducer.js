function appStateReducer(state) {
  if (!state) {
    return { ...state, ready: false }
  }

  const { intents } = state

  return {
    ...state,
    ready: true,
    intents: intents || [],
  }
}

export default appStateReducer
