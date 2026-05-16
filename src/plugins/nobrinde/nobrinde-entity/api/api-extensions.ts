import { gql } from 'graphql-tag';
import { budgetApiExtensions } from './budget/api-extensions';
import { channelApiExtensions } from './channel/api-extensions';
import { orderApiExtensions } from './order/api-extensions';
import { saleUserApiExtensions } from './sale-user/api-extensions';

const adminApiExtensions = gql`
  ${budgetApiExtensions}
  ${channelApiExtensions}
  ${orderApiExtensions}
  ${saleUserApiExtensions}
`;

export { adminApiExtensions };
