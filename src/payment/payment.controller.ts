import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentSessionDto } from './dto/payment.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // @Post('create-order')
  @MessagePattern('createOrder')
  async createOrder(@Payload() paymentSessionDto: PaymentSessionDto) {
    return this.paymentService.createOrder(paymentSessionDto);
  }

  @MessagePattern('captureOrder')
  async captureOrder(@Payload() id: string) {
    return this.paymentService.captureOrder(id);
  }

  @Get('success')
  async successOrder() {
    return 'successed';
  }
  @Get('cancell')
  async cancellOrder() {
    return 'cancelled';
  }
}
