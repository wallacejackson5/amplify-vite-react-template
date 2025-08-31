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

async function createUserProfile(event: any) {
  try {    
    const userProfile = await clientData.models.UserProfile.create({
      sub: event.request.userAttributes.sub,
      email: event.request.userAttributes.email,
      birthdate: event.request.userAttributes.birthdate
    });
    
    if (userProfile.errors && userProfile.errors.length > 0) {
      console.error('❌ UserProfile creation failed with errors:', JSON.stringify(userProfile.errors, null, 2));
      throw new Error(`UserProfile creation failed: ${userProfile.errors.map(e => e.message).join(', ')}`);
    }
    
    console.log('✅ UserProfile created successfully:', JSON.stringify(userProfile.data, null, 2));
    return userProfile;
  } catch (error) {
    console.error('❌ Error creating UserProfile:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    console.error('❌ Event data:', JSON.stringify(event.request.userAttributes, null, 2));
    throw error;
  }
}

async function addUserToGroup(event: any) {
  try {
    const command = new AdminAddUserToGroupCommand({
      GroupName: env.GROUP_NAME,
      Username: event.userName,
      UserPoolId: event.userPoolId
    });
    const response = await client.send(command);
    console.log('✅ User added to group successfully', response.$metadata.requestId);
    return response;
  } catch (error) {
    console.error('❌ Error adding user to group:', error);
    throw error;
  }
}

export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    console.log('🚀 Starting post-confirmation process');
    console.log('Internal Username (UUID):', event.userName);
    console.log('User Attributes:', JSON.stringify(event.request.userAttributes, null, 2));
    
    await Promise.all([
      addUserToGroup(event),
      createUserProfile(event)
    ]);
    
    console.log('✅ Post-confirmation process completed successfully');
    return event;
  } catch (error) {
    console.error('❌ Post-confirmation process failed:', error);
    return event;
  }
};