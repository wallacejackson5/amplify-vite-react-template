import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './auth/post-confirmation/resource';

const backend = defineBackend({
  auth,
  data,
});

// Grant the post-confirmation function access to the data resource
backend.data.resources.graphqlApi.grantQuery(backend.auth.resources.userPoolPostConfirmationTrigger, "UserProfile");
backend.data.resources.graphqlApi.grantMutation(backend.auth.resources.userPoolPostConfirmationTrigger, "UserProfile");
