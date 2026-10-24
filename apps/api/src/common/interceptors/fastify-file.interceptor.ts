import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Fastify-compatible replacement for the Express `FileInterceptor` /
 * `FilesInterceptor` from `@nestjs/platform-express`.
 *
 * Background: the API runs on the Fastify adapter and registers
 * `@fastify/multipart` in `main.ts`. The Express multer interceptors
 * cannot run on Fastify (every multipart request died with a
 * Fastify-native HTTP 415 before any controller code executed).
 *
 * Installed v9 behavior (verified against its source): the plugin's
 * preValidation hook consumes the stream before interceptors run, and
 * with `attachFieldsToBody: 'keyValues'` file bytes land on
 * `request.body[field]` while text fields land as strings
 * (multer-identical body shape). Filename/mimetype metadata is stashed
 * by the `onFile` hook in `main.ts` as `request.savedUploads` because
 * keyValues mode keeps only the buffer.
 *
 * This layer keeps the existing controller contracts byte-identical:
 * - single-file routes keep `@UploadedFile()` (reads `request.file`)
 * - multi-file routes keep `@UploadedFiles()` (reads `request.files`)
 * - each file object carries the `Express.Multer.File` shape the
 *   controllers already validate (`originalname`, `mimetype`, `size`,
 *   `buffer`) plus the existing guards / throttles / ClamAV scan
 *   downstream, which are all untouched.
 *
 * Size/count caps mirror the per-controller limits that already exist
 * (catalog: 50 MB × 1 file; storage: 100 MB × MAX_FILES) so no existing
 * limit is raised or lowered by the transport change.
 */
export interface FastifyMulterCompatibleFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination: string;
  filename: string;
  path: string;
}

interface SavedUploadMeta {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
}

function toMulterFile(fieldname: string, meta: SavedUploadMeta, buffer: Buffer): FastifyMulterCompatibleFile {
  return {
    fieldname,
    originalname: meta.filename || '',
    encoding: meta.encoding || '7bit',
    mimetype: meta.mimetype || 'application/octet-stream',
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
  };
}

function filePartsFor(request: any, fieldName: string): Array<{ meta: SavedUploadMeta; buffer: Buffer }> {
  const saved: SavedUploadMeta[] = Array.isArray(request?.savedUploads) ? request.savedUploads : [];
  const body = request?.body && typeof request.body === 'object' ? request.body : {};
  const raw = body[fieldName];
  const buffers: Buffer[] = Buffer.isBuffer(raw) ? [raw] : Array.isArray(raw) ? raw.filter((b) => Buffer.isBuffer(b)) : [];
  const out: Array<{ meta: SavedUploadMeta; buffer: Buffer }> = [];
  const metas = saved.filter((meta) => meta.fieldname === fieldName);
  // Pair metadata with buffers by arrival order; ignore any surplus on
  // either side (a mismatch can only come from a malformed stream).
  const count = Math.min(metas.length, buffers.length);
  for (let i = 0; i < count; i++) {
    out.push({ meta: metas[i], buffer: buffers[i] });
  }
  return out;
}

/**
 * Single-file equivalent of `FileInterceptor(fieldName)`.
 * Populates `request.file`. When no matching part is present the
 * request passes through untouched so the controller's own
 * "File is required" validation still fires (same as multer).
 * More than one file part behaves like multer `.single()`: rejected.
 */
export function FastifyFileInterceptor(fieldName: string, maxFileSizeBytes = 50 * 1024 * 1024) {
  @Injectable()
  class FastifyFileInterceptorMixin implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
      const saved: SavedUploadMeta[] = Array.isArray(request?.savedUploads) ? request.savedUploads : [];
      const parts = filePartsFor(request, fieldName);
      // multer `.single()` rejects any unexpected file part, whether under
      // the expected field or another one.
      if (saved.length > 1 || parts.length > 1) {
        throw new BadRequestException('Too many files uploaded');
      }
      if (parts.length === 1) {
        const { meta, buffer } = parts[0];
        if (buffer.length > maxFileSizeBytes) {
          throw new BadRequestException('File exceeds maximum size');
        }
        request.file = toMulterFile(fieldName, meta, buffer);
      }
      return next.handle();
    }
  }
  return FastifyFileInterceptorMixin;
}

/**
 * Multi-file equivalent of `FilesInterceptor(fieldName, maxCount)`.
 * Populates `request.files` (array, possibly empty — the controller's
 * own "No file(s) provided" validation still fires, same as multer).
 */
export function FastifyFilesInterceptor(
  fieldName: string,
  maxCount = 20,
  maxFileSizeBytes = 100 * 1024 * 1024,
) {
  @Injectable()
  class FastifyFilesInterceptorMixin implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
      const parts = filePartsFor(request, fieldName);
      if (parts.length > maxCount) {
        throw new BadRequestException(`Maximum ${maxCount} files allowed`);
      }
      request.files = parts.map(({ meta, buffer }) => {
        if (buffer.length > maxFileSizeBytes) {
          throw new BadRequestException('File exceeds maximum size');
        }
        return toMulterFile(fieldName, meta, buffer);
      });
      return next.handle();
    }
  }
  return FastifyFilesInterceptorMixin;
}
