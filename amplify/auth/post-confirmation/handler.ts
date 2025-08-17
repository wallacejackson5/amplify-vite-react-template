import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { env } from '$amplify/env/post-confirmation';
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';

const client = new CognitoIdentityProviderClient();
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env as any
);

Amplify.configure(resourceConfig, libraryOptions);
const clientData = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  await addUserToGroup();
  await createUserProfile();
  
  return event;

  async function createUserProfile() {
    const userProfile = await clientData.models.UserProfile.create({
      sub: event.request.userAttributes.sub,
      email: event.request.userAttributes.email,
      userName: event.request.userAttributes.preferred_username,
      plan: env.GROUP_NAME as 'BASIC' | 'PREMIUM',
      language: 'en-US',
    });
    console.log('✅ UserProfile created successfully for user', userProfile.data?.id);
  }

  async function addUserToGroup() {
    const command = new AdminAddUserToGroupCommand({
      GroupName: env.GROUP_NAME,
      Username: event.userName,
      UserPoolId: event.userPoolId
    });
    const response = await client.send(command);
    console.log('✅ Processed', response.$metadata.requestId);
  }
};