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
    const now = new Date().toISOString();
    
    const userProfile = await clientData.models.UserProfile.create({
      sub: event.request.userAttributes.sub,
      email: event.request.userAttributes.email,
      birthdate: event.request.userAttributes.birthdate,
      plan: 'BASIC',
      createdAt: now,
      updatedAt: now,
    });
    console.log('✅ UserProfile created successfully for user', userProfile.data?.id);
    return userProfile;
  } catch (error) {
    console.error('❌ Error creating UserProfile:', error);
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
    // Log the full event structure for debugging
    console.log('🚀 Starting post-confirmation process');
    console.log('Internal Username (UUID):', event.userName);
    console.log('User Attributes:', JSON.stringify(event.request.userAttributes, null, 2));
    
    // Execute both operations
    await Promise.all([
      addUserToGroup(event),
      createUserProfile(event)
    ]);
    
    console.log('✅ Post-confirmation process completed successfully');
    return event;
  } catch (error) {
    console.error('❌ Post-confirmation process failed:', error);
    // Don't throw - return event to prevent blocking user confirmation
    return event;
  }
};