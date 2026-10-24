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
    const invoice = { id: 'inv-1', companyId: 'company-A', invoiceNumber: 'TRD/26-27/000001' };
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

describe('MembershipController confirmPayment - P0-8 remediation', () => {
  let controller: MembershipController;
  const membershipServiceMock = { confirmPayment: jest.fn() };
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
    controller = moduleRef.get<MembershipController>(MembershipController);
  });

  it('routes confirmation with the caller-resolved company (tenant scoping)', async () => {
    prismaMock.companyOwner.findFirst.mockResolvedValue({ company: { id: 'company-A' } });
    membershipServiceMock.confirmPayment.mockResolvedValue({ success: true, paymentId: 'pay-1' });

    const body = { paymentId: 'pay-1', gatewayPaymentId: 'pay_test_abc', gatewaySignature: 'valid_sig' };
    await expect(controller.confirmPayment('user-A', body)).resolves.toEqual({ success: true, paymentId: 'pay-1' });
    // companyId is passed FIRST - the service scopes the payment lookup to the caller's tenant
    expect(membershipServiceMock.confirmPayment).toHaveBeenCalledWith('company-A', 'pay-1', 'pay_test_abc', 'valid_sig');
  });

  it('user with no owned company -> 404 before the service is ever called', async () => {
    prismaMock.companyOwner.findFirst.mockResolvedValue(null);
    const body = { paymentId: 'pay-1', gatewayPaymentId: 'pay_test_abc', gatewaySignature: 'sig' };
    await expect(controller.confirmPayment('user-X', body)).rejects.toThrow(NotFoundException);
    expect(membershipServiceMock.confirmPayment).not.toHaveBeenCalled();
  });

  it('never trusts a client-supplied companyId - ownership comes from the JWT only', async () => {
    prismaMock.companyOwner.findFirst.mockResolvedValue({ company: { id: 'company-A' } });
    membershipServiceMock.confirmPayment.mockResolvedValue({ success: true });
    const body: any = { paymentId: 'pay-1', gatewayPaymentId: 'pay_test_abc', gatewaySignature: 'sig', companyId: 'company-VICTIM' };
    await controller.confirmPayment('user-A', body);
    expect(membershipServiceMock.confirmPayment).toHaveBeenCalledWith('company-A', 'pay-1', 'pay_test_abc', 'sig');
  });
});
