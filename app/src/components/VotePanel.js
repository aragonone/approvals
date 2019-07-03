import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import {
  Button,
  Timer,
  Info,
  SafeLink,
  SidePanelSeparator,
  SidePanelSplit,
  SidePanel,
  Text,
  theme,
} from '@aragon/ui'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'
import { format } from 'date-fns'
import { VOTE_NAY, VOTE_YEA } from '../vote-types'
import { pluralize } from '../utils'
import { useExtendedVoteData } from '../vote-hooks'
import VoteSummary from './VoteSummary'
import VoteStatus from './VoteStatus'
import VoteSuccess from './VoteSuccess'
import VoteText from './VoteText'
import SummaryBar from './SummaryBar'

const formatDate = date =>
  `${format(date, 'dd/MM/yy')} at ${format(date, 'HH:mm')} UTC`

// styled-component `css` transform doesn’t play well with attached components.
const Action = Info.Action

const VotePanel = React.memo(({ panelState, vote, onApprove, onReject }) => (
  <SidePanel
    title={
      vote ? `Vote #${vote.voteId} (${vote.data.open ? 'Open' : 'Closed'})` : ''
    }
    opened={panelState.visible}
    onClose={panelState.requestClose}
    onTransitionEnd={panelState.onTransitionEnd}
  >
    {vote && (
      <VotePanelContent
        vote={vote}
        onApprove={onApprove}
        onReject={onReject}
        panelOpened={panelState.didOpen}
      />
    )}
  </SidePanel>
))

const VotePanelContent = React.memo(
  ({ onReject, onApprove, panelOpened, vote: intent }) => {
    const { tokenDecimals, tokenSymbol } = useAppState()

    const handleReject = useCallback(() => {
      onReject(intent.voteId)
    }, [onReject, intent.voteId])

    const handleApprove = useCallback(() => {
      onApprove(intent.voteId)
    }, [onApprove, intent.voteId])

    if (!intent) {
      return null
    }

    const { submitter, description } = intent.data

    return (
      <React.Fragment>
        <SidePanelSplit>
          <div>
            <h2>
              <Label>{open ? 'Time Remaining' : 'Status'}</Label>
            </h2>
            {/*<VoteSuccess vote={intent} css="margin-top: 10px" />*/}
          </div>
          <div>
            <h2>
              <Label>Quorum progress</Label>
            </h2>
            <div></div>
            {/*<SummaryBar*/}
            {/*  css="margin-top: 10px"*/}
            {/*  positiveSize={quorumProgress}*/}
            {/*  requiredSize={minAcceptQuorum}*/}
            {/*  show={panelOpened}*/}
            {/*  compact*/}
            {/*/>*/}
          </div>
        </SidePanelSplit>
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
          {metadata && (
            <React.Fragment>
              <h2>
                <Label>Question</Label>
              </h2>
              <p
                css={`
                  max-width: 100%;
                  overflow: hidden;
                  word-break: break-all;
                  hyphens: auto;
                `}
              >
                {/*<VoteText text={metadata} />*/}
              </p>
            </React.Fragment>
          )}
        </Part>
        <SidePanelSeparator />
        <Part>
          <h2>
            <Label>Created By</Label>
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

        <VoteSummary
          vote={intent}
          tokenSymbol={tokenSymbol}
          tokenDecimals={tokenDecimals}
          ready={panelOpened}
        />

        <VotePanelContentActions
          onReject={handleReject}
          onApprove={handleApprove}
          vote={intent}
        />
      </React.Fragment>
    )
  }
)

const VotePanelContentActions = React.memo(
  ({ vote, onApprove, onReject }) => {
    const connectedAccount = useConnectedAccount()
    const { canUserVote, userBalance } = useExtendedVoteData(vote)
    const [changeVote, setChangeVote] = useState(false)

    const handleChangeVote = useCallback(() => setChangeVote(true), [])

    const hasVoted = [VOTE_YEA, VOTE_NAY].includes(vote.connectedAccountVote)

    if (canUserVote && hasVoted && !changeVote) {
      return (
        <div>
          <SidePanelSeparator />
          <ButtonsContainer>
            <Button mode="strong" wide onClick={handleChangeVote}>
              Change my vote
            </Button>
          </ButtonsContainer>
          <Action>
            <p>
              You voted {vote.connectedAccountVote === VOTE_YEA ? 'yes' : 'no'}{' '}
              with{' '}
              {userBalance === -1
                ? '…'
                : pluralize(userBalance, '$ token', '$ tokens')}
              , since it was your balance when the vote was created (
              {formatDate(vote.data.startDate)}
              ).
            </p>
          </Action>
        </div>
      )
    }

    if (canUserVote) {
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
                <p>
                  You will cast your vote with{' '}
                  {userBalance === -1
                    ? '… tokens'
                    : pluralize(userBalance, '$ token', '$ tokens')}
                  , since it was your balance when the vote was created (
                  {formatDate(vote.data.startDate)}
                  ).
                </p>
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
