import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  
  UserProfile: a
    .model({
      sub: a.string().required(),
      email: a.string().required(),
      birthdate: a.date().required(),
      profileCompleted: a.boolean().default(false),
      createdAt: a.datetime().default(new Date().toISOString()),
      updatedAt: a.datetime().default(new Date().toISOString()),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey()
    ]),
}).authorization((allow) => [allow.resource(postConfirmation)]);

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
