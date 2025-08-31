import { defineFunction } from '@aws-amplify/backend';
import { DEFAULT_USER_ROLE } from "../../shared/constants/groups";

export const postConfirmation = defineFunction({
  name: 'post-confirmation',
  // Default group for new users - matches the groups defined in auth config
  environment: {
    GROUP_NAME: DEFAULT_USER_ROLE
  },
  // Timeout increased to accommodate database operations
  timeoutSeconds: 30
});