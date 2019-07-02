import Aragon, { events } from '@aragon/api'	import Aragon from '@aragon/api'
import { addressesEqual } from './web3-utils'
import voteSettings from './vote-settings'
import { voteTypeFromContractEnum } from './vote-utils'
import { EMPTY_CALLSCRIPT } from './evmscript-utils'
import tokenDecimalsAbi from './abi/token-decimals.json'
import tokenSymbolAbi from './abi/token-symbol.json'

const tokenAbi = [].concat(tokenDecimalsAbi, tokenSymbolAbi)

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
