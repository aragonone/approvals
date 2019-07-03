import React from 'react'
import styled from 'styled-components'
import { theme, IconTime, IconCross, IconCheck } from '@aragon/ui'
import { getIntentStatus } from '../vote-utils'
import { INTENT_STATUS_PENDING, INTENT_STATUS_REJECTED, INTENT_STATUS_APPROVED } from '../intent-types'

const ATTRIBUTES = {
  [INTENT_STATUS_PENDING]: {
    label: 'Pending',
    Icon: IconTime,
    color: theme.textTertiary,
    bold: false,
  },
  [INTENT_STATUS_APPROVED]: {
    label: 'Approved',
    Icon: IconCheck,
    color: theme.textTertiary,
    bold: true,
  },
  [INTENT_STATUS_REJECTED]: {
    label: 'Rejected',
    Icon: IconCross,
    color: theme.negative,
    bold: true,
  },
}

const VoteStatus = ({ cardStyle, intent }) => {
  const status = getIntentStatus(intent)
  const { Icon, color, bold } = ATTRIBUTES[status]
  const label = ATTRIBUTES[status].label

  return (
    <Main
      fontSize={cardStyle ? 13 : 15}
      fontWeight={cardStyle || !bold ? 400 : 600}
      color={cardStyle ? theme.textTertiary : color}
    >
      {Icon && <Icon />}
      <StatusLabel spaced={Boolean(Icon)}>{label}</StatusLabel>
    </Main>
  )
}

const Main = styled.span`
  white-space: nowrap;
  color: ${({ color }) => color};
  font-size: ${({ fontSize }) => fontSize}px;
  font-weight: ${({ fontWeight }) => fontWeight};
`

const StatusLabel = styled.span`
  margin-left: ${({ spaced }) => (spaced ? '5px' : '0')};
`

export default VoteStatus
