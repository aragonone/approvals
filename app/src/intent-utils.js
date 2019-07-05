import { INTENT_STATUS_PENDING, INTENT_STATUS_REJECTED, INTENT_STATUS_APPROVED } from './intent-types'

export function isIntentPending(intent) {
  const { data: { status } } = intent
  return status === 'pending'
}

export function getIntentStatus(intent) {
  if (intent.data.status === 'approved') return INTENT_STATUS_APPROVED
  if (intent.data.status === 'rejected') return INTENT_STATUS_REJECTED
  return INTENT_STATUS_PENDING
}
