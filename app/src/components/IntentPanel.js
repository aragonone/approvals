import React, { useCallback } from 'react'
import styled from 'styled-components'
import { Button, Info, SafeLink, SidePanelSeparator, SidePanel, Text, theme } from '@aragon/ui'
import { useConnectedAccount } from '@aragon/api-react'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'

import IntentStatus from './IntentStatus'
import IntentText from './IntentText'

// styled-component `css` transform doesn’t play well with attached components.
const Action = Info.Action

const IntentPanel = React.memo(({ panelState, intent, onApprove, onReject }) => (
  <SidePanel
    title={ intent ? `Intent #${intent.intentId} ` : '' }
    opened={panelState.visible}
    onClose={panelState.requestClose}
    onTransitionEnd={panelState.onTransitionEnd}
  >
    {intent && (
      <IntentPanelContent
        intent={intent}
        onApprove={onApprove}
        onReject={onReject}
        panelOpened={panelState.didOpen}
      />
    )}
  </SidePanel>
))

const IntentPanelContent = React.memo(
  ({ onReject, onApprove, panelOpened, intent }) => {

    const handleReject = useCallback(() => {
      onReject(intent.intentId)
    }, [onReject, intent.intentId])

    const handleApprove = useCallback(() => {
      onApprove(intent.intentId)
    }, [onApprove, intent.intentId])

    if (!intent) {
      return null
    }

    const { submitter, description } = intent.data
    return (
      <React.Fragment>
        <IntentStatus intent={intent}/>
        <br/>
        <SidePanelSeparator />
        <Part>
          {description && (
            <React.Fragment>
              <h2>
                <Label>Description</Label>
              </h2>
              <p>
                <IntentText text={description} />
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

        <IntentPanelContentActions
          onReject={handleReject}
          onApprove={handleApprove}
          intent={intent}
        />
      </React.Fragment>
    )
  }
)

const IntentPanelContentActions = React.memo(
  ({ intent, onApprove, onReject }) => {
    const connectedAccount = useConnectedAccount()

    if (intent.data.status === 'pending') {
      return (
        <div>
          <SidePanelSeparator />
          <ButtonsContainer>
            <IntentButton
              mode="strong"
              emphasis="positive"
              wide
              onClick={onApprove}
            >
              Approve
            </IntentButton>
            <IntentButton
              mode="strong"
              emphasis="negative"
              wide
              onClick={onReject}
            >
              Reject
            </IntentButton>
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

const IntentButton = styled(Button)`
  width: 50%;
  &:first-child {
    margin-right: 10px;
  }
`

export default IntentPanel
