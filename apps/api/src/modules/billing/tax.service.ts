import { Injectable } from '@nestjs/common';

export interface TaxResult {
  taxableAmount: number;
  taxType: 'CGST_SGST' | 'IGST' | 'EXEMPT';
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

@Injectable()
export class TaxService {
  calculateGst(amount: number, isIntraState: boolean, isExempt = false): TaxResult {
    if (isExempt) {
      return {
        taxableAmount: amount, taxType: 'EXEMPT',
        cgstRate: 0, sgstRate: 0, igstRate: 0,
        cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0,
      };
    }

    if (isIntraState) {
      const cgst = this.roundOff(amount * 0.09);
      const sgst = this.roundOff(amount * 0.09);
      return {
        taxableAmount: amount, taxType: 'CGST_SGST',
        cgstRate: 9, sgstRate: 9, igstRate: 0,
        cgstAmount: cgst, sgstAmount: sgst, igstAmount: 0,
        totalTax: cgst + sgst,
      };
    }

    const igst = this.roundOff(amount * 0.18);
    return {
      taxableAmount: amount, taxType: 'IGST',
      cgstRate: 0, sgstRate: 0, igstRate: 18,
      cgstAmount: 0, sgstAmount: 0, igstAmount: igst,
      totalTax: igst,
    };
  }

  roundOff(value: number): number {
    return Math.round(value * 100) / 100;
  }

  getHsnSacForPlan(planId: string): string {
    const hsnMap: Record<string, string> = {
      trade_start: '998311',
      trade_smart: '998311',
      trade_plus: '998311',
      trade_pro: '998311',
      trade_premium: '998311',
      trade_elite: '998311',
    };
    return hsnMap[planId] || '998311';
  }

  getPlanDescription(planId: string): string {
    const descMap: Record<string, string> = {
      trade_start: 'Trade Start Membership Plan',
      trade_smart: 'Trade Smart Membership Plan',
      trade_plus: 'Trade Plus Membership Plan',
      trade_pro: 'Trade Pro Membership Plan',
      trade_premium: 'Trade Premium Membership Plan',
      trade_elite: 'Trade Elite Membership Plan',
    };
    return descMap[planId] || 'Membership Plan';
  }
}
