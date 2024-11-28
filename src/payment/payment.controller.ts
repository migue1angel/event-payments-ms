import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentSessionDto } from './dto/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  async createOrder(@Body() paymentSessionDto: PaymentSessionDto) {
    return this.paymentService.createOrder(paymentSessionDto);
  }

  @Post(':orderId/capture-order')
  async captureOrder(@Param('orderId') orderId: string) {
    return this.paymentService.captureOrder(orderId);
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
