import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const STATE_CODE_MAP: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  Assam: 'AS',
  Bihar: 'BR',
  Chhattisgarh: 'CG',
  Goa: 'GA',
  Gujarat: 'GJ',
  Haryana: 'HR',
  'Himachal Pradesh': 'HP',
  'Jammu and Kashmir': 'JK',
  Jharkhand: 'JH',
  Karnataka: 'KA',
  Kerala: 'KL',
  'Madhya Pradesh': 'MP',
  Maharashtra: 'MH',
  Manipur: 'MN',
  Meghalaya: 'ML',
  Mizoram: 'MZ',
  Nagaland: 'NL',
  Odisha: 'OD',
  Punjab: 'PB',
  Rajasthan: 'RJ',
  Sikkim: 'SK',
  'Tamil Nadu': 'TN',
  Telangana: 'TS',
  Tripura: 'TR',
  'Uttar Pradesh': 'UP',
  Uttarakhand: 'UK',
  'West Bengal': 'WB',
  'Andaman and Nicobar Islands': 'AN',
  Chandigarh: 'CH',
  'Dadra and Nagar Haveli and Daman and Diu': 'DD',
  Delhi: 'DL',
  Lakshadweep: 'LD',
  Puducherry: 'PY',
};

function stateToCode(state: string | null | undefined): string {
  if (!state) return 'XX';
  return STATE_CODE_MAP[state] || state.substring(0, 2).toUpperCase();
}

@Injectable()
export class OrderNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(state: string | null | undefined): Promise<string> {
    const now = new Date();
    const yymmdd =
      now.getFullYear().toString().slice(2) +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const sc = stateToCode(state);

    const counter = await this.prisma.orderNumberCounter.upsert({
      where: { id: `${sc}-${yymmdd}` },
      create: { id: `${sc}-${yymmdd}`, stateCode: sc, date: yymmdd, seq: 1 },
      update: { seq: { increment: 1 } },
    });

    const seq = counter.seq.toString().padStart(4, '0');
    return `TRD-${sc}-${yymmdd}-${seq}`;
  }
}
