import {
  INTENT_PENDING,
  INTENT_APPROVE,
  INTENT_REJECT,
  INTENT_STATUS_PENDING,
  INTENT_STATUS_REJECTED,
  INTENT_STATUS_APPROVED,
} from './intent-types'

const EMPTY_SCRIPT = '0x00000001'

export function isVoteAction(vote) {
  return vote.data && vote.data.script && vote.data.script !== EMPTY_SCRIPT
}

export function getAccountVote(account, voters) {
  return voters[account] || INTENT_PENDING
}

export function isIntentPending(intent) {
  const { data: { status } } = intent
  return status === 'pending'
}

export function getIntentStatus(intent) {
  if (intent.data.status === 'approved') return INTENT_STATUS_APPROVED
  if (intent.data.status === 'rejected') return INTENT_STATUS_REJECTED
  return INTENT_STATUS_PENDING
}

export function getVoteSuccess(vote, pctBase) {
  const { yea, minAcceptQuorum, nay, supportRequired, votingPower } = vote.data

  const totalVotes = yea.add(nay)
  if (totalVotes.isZero()) {
    return false
  }
  const yeaPct = yea.mul(pctBase).div(totalVotes)
  const yeaOfTotalPowerPct = yea.mul(pctBase).div(votingPower)

  // Mirror on-chain calculation
  // yea / votingPower > supportRequired ||
  //   (yea / totalVotes > supportRequired &&
  //    yea / votingPower > minAcceptQuorum)
  return (
    yeaOfTotalPowerPct.gt(supportRequired) ||
    (yeaPct.gt(supportRequired) && yeaOfTotalPowerPct.gt(minAcceptQuorum))
  )
}

// Enums are not supported by the ABI yet:
// https://solidity.readthedocs.io/en/latest/frequently-asked-questions.html#if-i-return-an-enum-i-only-get-integer-values-in-web3-js-how-to-get-the-named-values
export function voteTypeFromContractEnum(value) {
  if (value === '1') {
    return INTENT_APPROVE
  }
  if (value === '2') {
    return INTENT_REJECT
  }
  return INTENT_PENDING
}

// Get the user balance that can be used on a given vote.
export async function getUserBalance(
  vote,
  connectedAccount,
  tokenContract,
  tokenDecimals
) {
  if (!vote || !tokenContract || !connectedAccount) {
    return -1
  }

  const balance = await tokenContract
    .balanceOfAt(connectedAccount, vote.data.snapshotBlock)
    .toPromise()

  return Math.floor(parseInt(balance, 10) / Math.pow(10, tokenDecimals))
}

export async function getCanVote(vote, connectedAccount, api) {
  if (!vote) {
    return false
  }

  // If the account is not present, we assume the account is not connected.
  if (!connectedAccount) {
    return vote.data.open
  }

  return api.call('canVote', vote.voteId, connectedAccount).toPromise()
}

export async function getCanExecute(vote, api) {
  if (!vote) {
    return false
  }
  return api.call('canExecute', vote.voteId).toPromise()
}
