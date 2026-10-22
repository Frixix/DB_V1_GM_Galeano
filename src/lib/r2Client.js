import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const accountId = env.VITE_R2_ACCOUNT_ID || '';
const accessKeyId = env.VITE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = env.VITE_R2_SECRET_ACCESS_KEY || '';
export const R2_BUCKET_NAME = env.VITE_R2_BUCKET_NAME || 'documentos-galeano';
export const R2_PUBLIC_DOMAIN = env.VITE_R2_PUBLIC_DOMAIN || '';

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
