import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from "./post-confirmation/resource";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // Maps to Cognito standard attribute 'email'
    email: {
      mutable: true,
      required: true,
    },
  },
  groups: ['BASIC', 'ADMINS', 'PREMIUM'],
  triggers: {
    postConfirmation,
  },
  access: (allow) => [
    allow.resource(postConfirmation).to(["addUserToGroup"]),
  ],
});
