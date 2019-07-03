// Because these are passed between the background script and the app, we don't use symbols
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#Supported_types
export const VOTE_ABSENT = 'VOTE_ABSENT'
export const VOTE_YEA = 'VOTE_YEA'
export const VOTE_NAY = 'VOTE_NAY'

export const INTENT_STATUS_PENDING = Symbol('INTENT_STATUS_PENDING')
export const INTENT_STATUS_REJECTED = Symbol('INTENT_STATUS_REJECTED')
export const INTENT_STATUS_APPROVED = Symbol('INTENT_STATUS_APPROVED')
