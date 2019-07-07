export const EMPTY_CALLSCRIPT = '0x00000001'

export function stringifyForwardingPath(path) {
  return path ? path.map((step, index) => stringifyForwardingStep(step, [index + 1])).join('\n') : ''
}

function stringifyForwardingStep(step, depth) {
  const identifier = step.identifier ? ` (${step.identifier})` : ''
  const app = step.name ? `${step.name}${identifier}` : `${step.to}`
  let description = `${depth.join('.')}. ${app}: ${step.description || 'No description'}`

  if (step.children) {
    const childrenDescriptions = step.children.map((child, index) => stringifyForwardingStep(child, depth.concat(index + 1)))
    description = `${description}\n${childrenDescriptions.join('\n')}`
  }

  return description
}
