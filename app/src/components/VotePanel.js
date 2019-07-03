import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import {
  Button,
  Timer,
  Info,
  SafeLink,
  SidePanelSeparator,
  SidePanel,
  Text,
  theme,
} from '@aragon/ui'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'
import { format } from 'date-fns'
import { INTENT_REJECT, INTENT_APPROVE } from '../intent-types'
import { pluralize } from '../utils'
import { useExtendedVoteData } from '../vote-hooks'
import VoteStatus from './VoteStatus'
import VoteSuccess from './VoteSuccess'
import VoteText from './VoteText'
import SummaryBar from './SummaryBar'

const formatDate = date =>
  `${format(date, 'dd/MM/yy')} at ${format(date, 'HH:mm')} UTC`

// styled-component `css` transform doesn’t play well with attached components.
const Action = Info.Action

const VotePanel = React.memo(({ panelState, intent, onApprove, onReject }) => (
  <SidePanel
    title={
      intent ? `Intent #${intent.intentId} ` : ''
    }
    opened={panelState.visible}
    onClose={panelState.requestClose}
    onTransitionEnd={panelState.onTransitionEnd}
  >
    {intent && (
      <VotePanelContent
        intent={intent}
        onApprove={onApprove}
        onReject={onReject}
        panelOpened={panelState.didOpen}
      />
    )}
  </SidePanel>
))

const VotePanelContent = React.memo(
  ({ onReject, onApprove, panelOpened, intent: intent }) => {
    const { tokenDecimals, tokenSymbol } = useAppState()

    const handleReject = useCallback(() => {
      onReject(intent.intentId)
    }, [onReject, intent.intentId])

    const handleApprove = useCallback(() => {
      onApprove(intent.intentId)
    }, [onApprove, intent.intentId])

    if (!intent) {
      return null
    }

    const { submitter } = intent.data
    const description = "Intent description"
    return (
      <React.Fragment>
        <VoteStatus intent={intent}/><br/>
        <SidePanelSeparator />
        <Part>
          {description && (
            <React.Fragment>
              <h2>
                <Label>Description</Label>
              </h2>
              <p>
                <VoteText text={description} />
              </p>
            </React.Fragment>
          )}
        </Part>
        <Part>
          <h2>
            <Label>Submitted By</Label>
          </h2>
          <div
            css={`
              display: flex;
              align-items: center;
            `}
          >
            <LocalIdentityBadge entity={submitter} />
          </div>
        </Part>
        <SidePanelSeparator />

        <VotePanelContentActions
          onReject={handleReject}
          onApprove={handleApprove}
          intent={intent}
        />
      </React.Fragment>
    )
  }
)

const VotePanelContentActions = React.memo(
  ({ intent, onApprove, onReject }) => {
    const connectedAccount = useConnectedAccount()

    if (intent.data.status === 'pending') {
      return (
        <div>
          <SidePanelSeparator />
          <ButtonsContainer>
            <VotingButton
              mode="strong"
              emphasis="positive"
              wide
              onClick={onApprove}
            >
              Approve
            </VotingButton>
            <VotingButton
              mode="strong"
              emphasis="negative"
              wide
              onClick={onReject}
            >
              Reject
            </VotingButton>
          </ButtonsContainer>
          <Action
            css={`
              & > div {
                align-items: flex-start;
              }
            `}
          >
            {connectedAccount ? (
              <div>
                <NoTokenCost />
              </div>
            ) : (
              <p>You will need to connect your account in the next screen.</p>
            )}
          </Action>
        </div>
      )
    }

    return null
  }
)

const NoTokenCost = () => (
  <p css="margin-top: 10px">
    Performing this action will{' '}
    <span css="font-weight: bold">not transfer out</span> any of your tokens.
    You’ll only have to pay for the{' '}
    <SafeLink href="https://ethgas.io/" target="_blank">
      ETH fee
    </SafeLink>{' '}
    when signing the transaction.
  </p>
)

const Label = styled(Text).attrs({
  smallcaps: true,
  color: theme.textSecondary,
})`
  display: block;
  margin-bottom: 10px;
`

const Part = styled.div`
  padding: 20px 0;
  h2 {
    margin-top: 20px;
    &:first-child {
      margin-top: 0;
    }
  }
`

const ButtonsContainer = styled.div`
  display: flex;
  padding: 30px 0 20px;
`

const VotingButton = styled(Button)`
  width: 50%;
  &:first-child {
    margin-right: 10px;
  }
`

export default VotePanel
