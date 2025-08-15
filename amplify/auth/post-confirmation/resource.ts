import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'post-confirmation',
  // Default group for new users - matches the groups defined in auth config
  environment: {
    GROUP_NAME: 'USERS'
  },
  resourceGroupName: 'auth',
  // Timeout increased to accommodate database operations
  timeoutSeconds: 30
});