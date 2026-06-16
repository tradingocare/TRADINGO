import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

export default {
  schema: path.resolve(__dirname, '../../prisma/schema.prisma'),
}
