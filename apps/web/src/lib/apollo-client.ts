import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

export const wsEventTarget: EventTarget | null = typeof window !== 'undefined' ? new EventTarget() : null;

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql',
});

// Only create WebSocket link on client side
const wsLink = typeof window !== 'undefined' 
  ? new GraphQLWsLink(
      createClient({
        url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/graphql',
        connectionParams: {
          // Add auth headers if needed
        },
        on: {
          connected: () => {
            console.log('✅ WebSocket Connected');
            wsEventTarget?.dispatchEvent(new Event('ws:connected'));
          },
          error: (error) => {
            console.error('❌ WebSocket Error:', error);
            wsEventTarget?.dispatchEvent(new Event('ws:error'));
          },
          closed: () => {
            console.log('🔌 WebSocket Disconnected');
            wsEventTarget?.dispatchEvent(new Event('ws:closed'));
          },
        },
        shouldRetry: () => true,
        retryAttempts: 5,
        retryWait: async function waitForSocketToReconnect(retries) {
          return new Promise(resolve => {
            setTimeout(() => {
              console.log(`🔄 WebSocket retry attempt ${retries + 1}/5`);
              wsEventTarget?.dispatchEvent(new CustomEvent('ws:retry', { detail: { attempt: retries + 1 } }));
              resolve();
            }, 1000 * Math.pow(2, retries));
          });
        },
      })
    )
  : null;

// Split links - use WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          jobs: {
            merge(existing = { edges: [] }, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});