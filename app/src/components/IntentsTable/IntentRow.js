import React, { useCallback } from 'react'
import { TableCell, TableRow, Text, Button, theme } from '@aragon/ui'
import IntentText from '../IntentText'
import IntentStatus from '../IntentStatus'

const IntentRow = React.memo(
  ({ intent, onOpen }) => {
    const { intentId } = intent
    const { description } = intent.data

    const handleOpen = useCallback(() => onOpen(intentId), [intentId, onOpen])

    // TODO: On IntentText: change string for description variable when ready
    return (
      <TableRow onClick={handleOpen}>
        <TableCell>
            <span color={theme.textTertiary}>#{intentId}</span>
        </TableCell>
        <TableCell>
            <IntentText text={description} />
        </TableCell>
        <TableCell>
          <IntentStatus intent={intent} />
        </TableCell>
        <TableCell>
          <Button compact mode="outline">
            View intent
          </Button>
        </TableCell>
      </TableRow>
    )
  },
  (prevProps, nextProps) => {
    const prevIntent = prevProps.intent
    const nextIntent = nextProps.intent
    return (
      prevProps.onIntent === nextProps.onIntent &&
      prevIntent.intentId === nextIntent.intentId
    )
  }
)

IntentRow.defaultProps = {
  onOpen: () => {},
}

export default IntentRow
