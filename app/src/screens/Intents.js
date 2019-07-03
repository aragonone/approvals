import React from 'react'
import VotingCard from '../components/VotingCard/VotingCard'
import VotingCardGroup from '../components/VotingCard/VotingCardGroup'

const Intents = React.memo(({ intents, onSelectIntent }) => {
  const sortedIntents = intents.sort((a, b) => {
    // Order by descending intent id
    return b.intentId - a.intentId
  })

  const pendingIntents = sortedIntents.filter(intent => intent.data.status === 'pending')
  const closedIntents = sortedIntents.filter(intent => !pendingIntents.includes(intent))
  const intentGroups = [['Pending intents', pendingIntents], ['Past intents', closedIntents]]
  console.log("VVVVVVVVVVVVVVV", intents, intentGroups);
  return (
    <React.Fragment>
      {intentGroups.map(([groupName, intents]) =>
        intents.length ? (
          <VotingCardGroup
            title={groupName}
            count={intents.length}
            key={groupName}
          >
            {intents.map(intent => (
              <VotingCard key={intent.intentId} intent={intent} onOpen={onSelectIntent} />
            ))}
          </VotingCardGroup>
        ) : null
      )}
    </React.Fragment>
  )
})

export default Intents
