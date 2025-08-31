import { defineStorage, defineFunction } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'photos',
    isDefault: true,
    access: (allow) => ({
      'protected/profile-pictures/{entity_id}/*': [
        allow.authenticated.to(['read']),
        allow.entity('identity').to(['read', 'write', 'delete'])
      ],
      'public/*': [
        allow.guest.to(['read']),
        allow.authenticated.to(['read']),
        allow.groups(['ADMIN', 'MODERATOR']).to(['read', 'write', 'delete'])
      ],
    }),
    triggers: {
      onUpload: defineFunction({
        entry: './storage-triggers/validate-upload.ts'
      }),
    }
});