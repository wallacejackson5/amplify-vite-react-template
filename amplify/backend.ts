import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './auth/post-confirmation/resource';

const backend = defineBackend({
  auth,
  data,
  postConfirmation,
});

backend.postConfirmation.addEnvironment("AMPLIFY_DATA_GRAPHQL_ENDPOINT", backend.data.graphqlUrl);
