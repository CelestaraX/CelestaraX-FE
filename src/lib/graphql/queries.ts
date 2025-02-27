import { gql } from '@apollo/client';

export const GET_PAGE_CREATEDS = gql`
  query GetAllPages {
    pages(first: 1000, orderBy: pageId, orderDirection: asc) {
      id
      pageId
      creator
      name
      thumbnail
      ownershipType
      updateFee
      imt
      currentHtml
      totalLikes
      totalDislikes
      balance
      multiSigOwners
      multiSigThreshold
    }
  }
`;
