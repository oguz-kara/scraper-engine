import { getSdk } from '@/graphql/generated/sdk';
import { apolloClient } from './apollo-client';

// Create a single reusable SDK instance
export const sdk = getSdk(apolloClient);