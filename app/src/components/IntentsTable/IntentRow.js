import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import {
  TableCell,
  TableRow,
  Text,
  Viewport,
  Badge,
  Timer,
  Button,
  theme
} from "@aragon/ui";
import { INTENT_APPROVE, INTENT_REJECT } from "../../intent-types";
import IntentText from "../IntentText";
import IntentStatus from "../IntentStatus";
import { isVoteAction } from "../../vote-utils";

function getOptions(yea, nay, connectedAccountVote) {
  return [
    {
      label: (
        <OptionLabel
          label="Yes"
          isConnectedAccount={connectedAccountVote === INTENT_APPROVE}
        />
      ),
      power: yea
    },
    {
      label: (
        <OptionLabel
          label="No"
          isConnectedAccount={connectedAccountVote === INTENT_REJECT}
        />
      ),
      power: nay,
      color: theme.negative
    }
  ];
}

const IntentRow = React.memo(
  ({ intent, onOpen }) => {
    const { intentId, connectedAccountIntent } = intent;
    const { description } = intent.data;

    const handleOpen = useCallback(
      () => {
        onOpen(intentId);
      },
      [intentId, onOpen]
    );

    const action = isVoteAction(intent);
    //TODO: On IntentText: change string for description variable when ready
    return (
      <TableRow onClick={handleOpen}>
        <TableCell>
          <Text>
            <span color={theme.textTertiary}>#{intentId} </span>
            <span>
              <IntentText text={"Intent description"} />
            </span>
          </Text>
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
    );
  },
  (prevProps, nextProps) => {
    const prevIntent = prevProps.intent;
    const nextIntent = nextProps.intent;
    return (
      prevProps.onVote === nextProps.onVote &&
      prevIntent.intentId === nextIntent.intentId &&
      prevIntent.connectedAccountIntent === nextIntent.connectedAccountIntent
    );
  }
);

IntentRow.defaultProps = {
  onOpen: () => {}
};

const OptionLabel = ({ label, isConnectedAccount }) => (
  <span>
    <span>{label}</span>
    {isConnectedAccount && <You />}
  </span>
);

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-left: 5px;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 30px;
  background: #ffffff;
  border: 1px solid rgba(209, 209, 209, 0.5);
  border-radius: 3px;
`;

const Content = styled.div`
  height: 100%;
`;

const Label = styled.h1`
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 25px;
  height: 50px;
  margin-bottom: 10px;
`;

const PastDate = styled.time`
  font-size: 13px;
  color: #98a0a2;
`;

const You = styled(Badge.Identity).attrs({ children: "Your vote" })`
  margin-left: 5px;
  font-size: 9px;
  text-transform: uppercase;
`;

export default IntentRow;
