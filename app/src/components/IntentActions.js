import React from 'react'
import PropTypes from 'prop-types'
import AutoLink from '../components/AutoLink'
import { transformAddresses } from '../web3-utils'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'

// Render the set of actions associated to an intent.
const IntentActions = React.memo(
  ({ actions = [] }) => {
    // If there is no actions, the component doesn’t render anything.
    if (actions.length === 0) {
      return null
    }

    return (
      <AutoLink>
        <ul>
          {actions.map((action, i) => (
            <li>
              <IntentAction action={action} key={i} />
            </li>
          ))}
        </ul>
      </AutoLink>
    )
  },
  (prevProps, nextProps) => prevProps.actions === nextProps.actions
)

const IntentAction = React.memo(
  ({ action: { description = '', children = [] } }) => {
    // If there is no description, the component doesn’t render anything.
    if (!description.trim()) {
      return null
    }

    return (
      <AutoLink>
        <React.Fragment>
          {transformAddresses(description, (part, isAddress, index) =>
            isAddress ? (
              <span title={part} key={index}>
                {' '}
                <LocalIdentityBadge entity={part} compact />{' '}
              </span>
            ) : (
              <span key={index}>{part}</span>
            )
          )}
          <br />
          {children.length > 0 && (
            <ul>
              {children.map((child, i) => (
                <li>
                  <IntentAction action={child} key={i} />
                </li>
              ))}
            </ul>
          )}
        </React.Fragment>
      </AutoLink>
    )
  },
  (prevProps, nextProps) => prevProps.action === nextProps.action
)

IntentAction.propTypes = {
  action: PropTypes.shape({
    description: PropTypes.string,
    children: PropTypes.array,
  }),
}

IntentActions.propTypes = {
  actions: PropTypes.arrayOf(IntentAction),
}

export default IntentActions
