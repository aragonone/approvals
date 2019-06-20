import Aragon from '@aragon/api'

const app = new Aragon()

async function initialize(tokenAddr) {
  return app.store(
    (state, { event, returnValues }) => {
      const nextState = {
        ...state,
      }

      switch (event) {
        case '':
          return nextState
        default:
          return nextState
      }
    },
    { init: initState(tokenAddr) }
  )
}

const initState = tokenAddr => async cachedState => {
  return {
    ...cachedState,
    isSyncing: true,
  }
}
