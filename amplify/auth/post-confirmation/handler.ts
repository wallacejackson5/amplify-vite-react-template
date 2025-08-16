import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { type Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient();

// Load configuration - works both locally and in production
let amplifyConfig: ResourcesConfig;
if (process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT) {
  // Production: Use environment variables
  amplifyConfig = {
    API: {
      GraphQL: {
        endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
        region: process.env.AWS_REGION || 'us-east-1',
        defaultAuthMode: 'apiKey' as const,
        apiKey: process.env.AMPLIFY_DATA_API_KEY
      }
    }
  };
} else {
  // Local development: Use amplify_outputs.json
  const outputs = require('../../amplify_outputs.json');
  amplifyConfig = {
    API: {
      GraphQL: {
        endpoint: outputs.data.url,
        region: outputs.data.aws_region,
        defaultAuthMode: 'apiKey' as const,
        apiKey: outputs.data.api_key
      }
    }
  };
}

// Configure Amplify
Amplify.configure(amplifyConfig);

// Initialize Amplify data client for Lambda function
const dataClient = generateClient<Schema>({
  authMode: 'apiKey'
});

/**
 * Interface for user data extracted from Cognito event
 */
interface UserData {
  userName: string;
  userPoolId: string;
  email: string;
}

/**
 * Adds a user to the specified Cognito group
 */
async function addUserToGroup(userData: UserData, groupName: string): Promise<void> {
  console.log(`Adding user ${userData.userName} to group ${groupName}`);
  
  const command = new AdminAddUserToGroupCommand({
    GroupName: groupName,
    Username: userData.userName,
    UserPoolId: userData.userPoolId
  });
  
  const response = await cognitoClient.send(command);
  console.log(`✅ User ${userData.userName} successfully added to group ${groupName}`, {
    requestId: response.$metadata.requestId
  });
}

/**
 * Creates a UserProfile record in the database
 */
async function createUserProfile(userData: UserData, groupName: string): Promise<void> {
  console.log(`Creating UserProfile for user ${userData.userName}`);
  
  const userProfile = {
    userId: userData.userName,
    email: userData.email,
    plan: groupName === 'PREMIUM' ? 'PREMIUM' as const : 'BASIC' as const,
    language: 'en'
  };

  console.log(`--> Testing userProfile: ${userProfile}`);
  const profileResponse = await dataClient.models.UserProfile.create(userProfile);
  console.log(`--> Profile response: ${profileResponse}`);
  
  if (profileResponse.data) {
    console.log(`✅ UserProfile created successfully for user ${userData.userName}`, {
      profileId: profileResponse.data.id,
      email: profileResponse.data.email
    });
  } else {
    console.error(`❌ Failed to create UserProfile for user ${userData.userName}:`, {
      errors: profileResponse.errors
    });
    throw new Error(`Failed to create user profile: ${profileResponse.errors?.map((e: any) => e.message).join(', ')}`);
  }
}

/**
 * Extracts and validates user data from the Cognito event
 */
function extractUserData(event: Parameters<PostConfirmationTriggerHandler>[0]): UserData {
  const { userName, userPoolId, request } = event;
  const userAttributes = request.userAttributes;
  
  return {
    userName,
    userPoolId,
    email: userAttributes.email || '',
  };
}

/**
 * Handles a single operation with error logging
 */
async function handleOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  userData: UserData
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error(`❌ ${operationName} failed for user ${userData.userName}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userName: userData.userName
    });
    return null;
  }
}

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const userData = extractUserData(event);
  console.log(`Starting post-confirmation process for user: ${userData.userName}`);
  
  // Execute both operations, logging failures but not blocking user registration
  const groupResult = await handleOperation(
    'Group assignment',
    () => addUserToGroup(userData, process.env.GROUP_NAME || 'BASIC'),
    userData
  );
  
  const profileResult = await handleOperation(
    'Profile creation',
    () => createUserProfile(userData, process.env.GROUP_NAME || 'BASIC'),
    userData
  );
  
  // Log overall completion status
  if (groupResult !== null && profileResult !== null) {
    console.log(`✅ Post-confirmation completed successfully for user ${userData.userName}`);
  } else {
    console.warn(`⚠️ Post-confirmation completed with some failures for user ${userData.userName}`, {
      groupAssignmentSuccess: groupResult !== null,
      profileCreationSuccess: profileResult !== null
    });
  }
  
  return event;
};