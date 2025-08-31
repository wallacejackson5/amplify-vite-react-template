import type { S3Handler } from 'aws-lambda';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validates file size against the 200MB limit
 */
function validateFileSize(size: number): ValidationResult {
  if (size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds the 200MB limit`
    };
  }
  return { isValid: true };
}

/**
 * Validates file extension for JPEG/PNG only
 */
function validateFileExtension(filename: string): ValidationResult {
  const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension '${fileExtension}' is not allowed. Only JPEG and PNG files are permitted (.jpg, .jpeg, .png)`
    };
  }
  return { isValid: true };
}

/**
 * Validates MIME type by reading file headers
 */
async function validateMimeType(bucket: string, key: string): Promise<ValidationResult> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: 'bytes=0-11' // Read first 12 bytes for file signature
    });
    
    const response = await s3Client.send(command);
    const body = await response.Body?.transformToByteArray();
    
    if (!body || body.length < 2) {
      return {
        isValid: true,
        warnings: ['Could not read file headers for MIME type validation']
      };
    }

    // Check file signatures (magic numbers)
    const bytes = Array.from(body);
    
    // JPEG signatures: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { isValid: true };
    }
    
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: 'File does not appear to be a valid JPEG or PNG image based on file headers'
    };
    
  } catch (error) {
    console.warn('Could not validate MIME type:', error);
    return {
      isValid: true,
      warnings: ['MIME type validation skipped due to read error']
    };
  }
}

/**
 * Removes invalid files from S3
 */
async function removeInvalidFile(bucket: string, key: string): Promise<void> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });
    await s3Client.send(deleteCommand);
    console.log(`Removed invalid file: ${key}`);
  } catch (error) {
    console.error(`Failed to remove invalid file ${key}:`, error);
  }
}

export const handler: S3Handler = async (event) => {
  console.log('Storage validation triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName.startsWith('ObjectCreated')) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const size = record.s3.object.size;

      console.log(`Processing file: ${key}, Size: ${(size / 1024 / 1024).toFixed(2)}MB`);

      let isValid = true;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate file size
      const sizeValidation = validateFileSize(size);
      if (!sizeValidation.isValid) {
        isValid = false;
        errors.push(sizeValidation.error!);
      }

      // Validate file extension
      const extensionValidation = validateFileExtension(key);
      if (!extensionValidation.isValid) {
        isValid = false;
        errors.push(extensionValidation.error!);
      }

      // Validate MIME type (only if other validations pass)
      if (isValid) {
        const mimeValidation = await validateMimeType(bucket, key);
        if (!mimeValidation.isValid) {
          isValid = false;
          errors.push(mimeValidation.error!);
        }
        if (mimeValidation.warnings) {
          warnings.push(...mimeValidation.warnings);
        }
      }

      // Handle validation results
      if (!isValid) {
        console.error(`File validation failed for ${key}:`, errors);
        
        // Remove the invalid file
        await removeInvalidFile(bucket, key);
        
        // Throw error to trigger any downstream error handling
        throw new Error(`File validation failed: ${errors.join('; ')}`);
      }

      // Log warnings if any
      if (warnings.length > 0) {
        console.warn(`Validation warnings for ${key}:`, warnings);
      }

      console.log(`✅ File ${key} passed all validation checks`);
    }
  }

  console.log('✅ All files processed successfully');
};
