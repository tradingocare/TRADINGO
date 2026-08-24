import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';

describe('MembershipController getInvoice — F3 Invoice IDOR remediation', () => {
  let controller: MembershipController;
  const membershipServiceMock = { getInvoice: jest.fn() };
  const prismaMock = {
    companyOwner: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [MembershipController],
      providers: [
        { provide: MembershipService, useValue: membershipServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    controller = moduleRef.get(MembershipController);
  });

  it('owner requests own invoice → returns invoice (200 payload)', async () => {
    prismaMock.companyOwner.findFirst.mockResolvedValue({
      company: { id: 'company-A' },
    });
    const invoice = { id: 'inv-1', companyId: 'company-A', invoiceNumber: 'TRD-INV-1' };
    membershipServiceMock.getInvoice.mockResolvedValue(invoice);

    await expect(controller.getInvoice('user-A', 'inv-1')).resolves.toBe(invoice);
    expect(membershipServiceMock.getInvoice).toHaveBeenCalledWith('inv-1');
  });

  it('user A requests user B invoice → 404 NotFound, no data returned', async () => {
    prismaMock.companyOwner.findFirst.mockResolvedValue({
      company: { id: 'company-A' },
    });
    membershipServiceMock.getInvoice.mockResolvedValue({
      id: 'inv-B',
      companyId: 'company-B',
      company: { gstNumber: '27AAECB1111B2Z6', panNumber: 'AAECB1111B' },
    });

    await expect(controller.getInvoice('user-A', 'inv-B')).rejects.toThrow(NotFoundException);
  });

  it('unknown invoice id → 404 NotFound (no existence disclosure)', async () => {
    prismaMock.companyOwner.findFirst.mockResolvedValue({
      company: { id: 'company-A' },
    });
    membershipServiceMock.getInvoice.mockResolvedValue(null);

    await expect(controller.getInvoice('user-A', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('user with no owned company → 404 via resolveCompany before any disclosure', async () => {
    prismaMock.companyOwner.findFirst.mockResolvedValue(null);

    await expect(controller.getInvoice('user-X', 'inv-1')).rejects.toThrow(NotFoundException);
    expect(membershipServiceMock.getInvoice).not.toHaveBeenCalled();
  });
});
