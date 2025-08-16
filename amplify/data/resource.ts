import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

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
      plan: a.enum(['BASIC', 'PREMIUM']),
      language: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
