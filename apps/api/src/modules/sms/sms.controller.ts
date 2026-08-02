import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SmsService } from './sms.service';
import { SendTestSmsDto, SmsQueryDto } from './dto/send-sms.dto';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get SMS statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    return this.smsService.getStats();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get SMS logs' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getLogs(@Query() query: SmsQueryDto) {
    return this.smsService.getLogs({
      phoneNumber: query.phoneNumber,
      status: query.status,
      template: query.template,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    });
  }

  @Post('send-test')
  @ApiOperation({ summary: 'Send test SMS' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async sendTest(@Body() body: SendTestSmsDto) {
    const template = body.template as keyof typeof import('./sms.constants').SMS_TEMPLATES | undefined;
    if (template) {
      return this.smsService.sendTransactional(body.phoneNumber, template, body.phoneNumber);
    }
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return this.smsService.sendOtp(body.phoneNumber, testOtp, 'OTP_LOGIN');
  }
}
