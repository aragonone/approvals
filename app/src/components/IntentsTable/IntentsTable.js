import React from 'react'
import styled from 'styled-components'
import { Badge, Text, Table, TableRow, TableHeader, unselectable } from '@aragon/ui'

const IntentsTable = ({ title, count, children }) => (
  <Main>
    <Title>
      <Text size="large" weight="bold">
        {title}
      </Text>
      <TitleBadge>
        <Badge.Info>{count}</Badge.Info>
      </TitleBadge>
    </Title>
    <Table
      header={
        <TableRow>
          <TableHeader title="ID" />
          <TableHeader title="Description" />
          <TableHeader title="Status" />
          <TableHeader title="Detail" />
          <TableHeader />
        </TableRow>
      }
    >
      {children}
    </Table>
  </Main>
)

const Main = styled.section`
  & + & {
    padding-top: 35px;
  }
`

const Title = styled.h1`
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  ${unselectable};
`

const TitleBadge = styled.span`
  margin-left: 10px;
  display: flex;
  align-items: center;
`

export default IntentsTable
