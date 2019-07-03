// Because these are passed between the background script and the app, we don't use symbols
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#Supported_types
export const INTENT_PENDING = 'INTENT_PENDING'
export const INTENT_APPROVE = 'INTENT_APPROVE'
export const INTENT_REJECT = 'INTENT_REJECT'

export const INTENT_STATUS_PENDING = Symbol('INTENT_STATUS_PENDING')
export const INTENT_STATUS_REJECTED = Symbol('INTENT_STATUS_REJECTED')
export const INTENT_STATUS_APPROVED = Symbol('INTENT_STATUS_APPROVED')
