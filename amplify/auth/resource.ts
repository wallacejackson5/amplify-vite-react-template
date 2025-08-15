import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from "./post-confirmation/resource"

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // Maps to Cognito standard attribute 'birthdate'
    birthdate: {
      mutable: true,
      required: true,
    },
    // Maps to Cognito standard attribute 'email'
    email: {
      mutable: true,
      required: true,
    },
    // Maps to Cognito standard attribute 'family_name'
    familyName: {
      mutable: true,
      required: false,
    },
    // Maps to Cognito standard attribute 'gender'
    gender: {
      mutable: true,
      required: true,
    },
    // Maps to Cognito standard attribute 'given_name'
    givenName: {
      mutable: true,
      required: true,
    },
    // Maps to Cognito standard attribute 'phone_number'
    phoneNumber: {
      mutable: true,
      required: false,
    },
  },
  groups: ['USERS', 'ADMINS', 'PREMIUM_USERS'],
  triggers: {
    postConfirmation,
  },
  access: (allow) => [allow.resource(postConfirmation).to(["addUserToGroup"])],
});
