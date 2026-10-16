import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = import.meta.env.VITE_R2_ACCOUNT_ID || '';
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '';
export const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME || 'documentos-galeano';
export const R2_PUBLIC_DOMAIN = import.meta.env.VITE_R2_PUBLIC_DOMAIN || '';

export const isR2Configured = Boolean(
  accountId &&
  accessKeyId &&
  secretAccessKey &&
  !accountId.includes('tu-account-id')
);

export const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export { PutObjectCommand, GetObjectCommand, DeleteObjectCommand };
