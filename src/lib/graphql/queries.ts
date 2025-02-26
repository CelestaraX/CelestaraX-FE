import { gql } from '@apollo/client';

export const GET_PAGE_CREATEDS = gql`
  query {
    pageCreateds(first: 50, orderBy: pageId, orderDirection: asc) {
      id
      pageId
      creator
      ownershipType
      updateFee
      imt
      blockNumber
      blockTimestamp
    }
  }
`;
