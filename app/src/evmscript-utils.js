export const EMPTY_CALLSCRIPT = '0x00000001'

export function describeForwardingPath(path) {
  return path.map(describeNestedForwardingStep)
}

function describeNestedForwardingStep(step) {
  step.description = describeForwardingStep(step)
  step.children = (step.children || []).map(describeNestedForwardingStep)
  return step
}

function describeForwardingStep(step) {
  const identifier = step.identifier ? ` (${step.identifier})` : ''
  const app = step.name ? `${step.name}${identifier}` : `${step.to}`
  return `${app}: ${step.description || 'No description'}`
}
