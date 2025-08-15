import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  
  UserProfile: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      givenName: a.string(),
      plan: a.enum(['FREE', 'PREMIUM']),
      visibilityBoost: a.boolean(),
      language: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.custom()
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
    // Lambda authorization for Lambda functions
    lambdaAuthorizationMode: {
      function: postConfirmation,
    },
  },
});
