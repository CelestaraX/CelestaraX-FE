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

export const GET_PAGE_UPDATES = gql`
  query GetPageUpdates($pageId: String!) {
    pages(where: { pageId: $pageId }) {
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
      updateRequests {
        requestId
        requester
      }
    }
  }
`;

export const GET_PAGES_BY_OWNER = gql`
  query GetPagesByOwner($ownerAddress: String!) {
    pages(where: { creator: $ownerAddress }) {
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
