import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './auth/post-confirmation/resource';

const backend = defineBackend({
  auth,
  data,
  postConfirmation,
});

// Grant the post-confirmation function access to the data resource
backend.data.resources.graphqlApi.grantMutation(backend.postConfirmation.resources.lambda, "UserProfile");
backend.data.resources.graphqlApi.grantQuery(backend.postConfirmation.resources.lambda, "UserProfile");
