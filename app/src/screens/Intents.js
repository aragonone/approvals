import React from 'react'
import IntentRow from '../components/IntentsTable/IntentRow'
import IntentsTable from '../components/IntentsTable/IntentsTable'

const Intents = React.memo(({ intents, onSelectIntent }) => {
  const sortedIntents = intents.sort((a, b) => {
    // Order by descending intent id
    return b.intentId - a.intentId
  })

  const pendingIntents = sortedIntents.filter(intent => intent.data.status === 'pending')
  const closedIntents = sortedIntents.filter(intent => !pendingIntents.includes(intent))
  const intentGroups = [['Pending intents', pendingIntents], ['Past intents', closedIntents]]
  return (
    <React.Fragment>
      {intentGroups.map(([groupName, intents]) =>
        intents.length ? (
          <IntentsTable
            title={groupName}
            count={intents.length}
            key={groupName}
          >
            {intents.map(intent => (
              <IntentRow key={intent.intentId} intent={intent} onOpen={onSelectIntent} />
            ))}
          </IntentsTable>
        ) : null
      )}
    </React.Fragment>
  )
})

export default Intents
