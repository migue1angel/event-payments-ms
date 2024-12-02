import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrderRequest,
  OrdersController,
} from '@paypal/paypal-server-sdk';
import { envs } from 'src/config/envs';
import { PaymentSessionDto } from './dto/payment.dto';
import { CapturedOrder } from './interfaces/capture-order.interface';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentService {
  @Inject(NATS_SERVICE)
  private readonly client: ClientProxy;
  private readonly paypalClient = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: envs.PAYPAL_CLIENT_ID,
      oAuthClientSecret: envs.PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment: Environment.Sandbox,
  });
  private readonly ordersController = new OrdersController(this.paypalClient);

  async createOrder(payment: PaymentSessionDto) {
    try {
      const orderRequest: OrderRequest = {
        payer: {
          emailAddress: 'correoTest@gmail.com',
          name: {
            givenName: 'nameTest',
            surname: 'surnameTest',
          },
        },
        intent: CheckoutPaymentIntent.Capture,

        purchaseUnits: [
          {
            referenceId: payment.orderId,
            customId: payment.orderId,
            amount: {
              value: this.calculateTotalAmount(payment),
              currencyCode: 'USD',
              breakdown: {
                itemTotal: {
                  value: this.calculateTotalAmount(payment),
                  currencyCode: 'USD',
                },
              },
            },
            items: this.getItems(payment),
          },
        ],
      };
      const { body } = await this.ordersController.ordersCreate({
        body: orderRequest,
      });
      if (typeof body === 'string') {
        return JSON.parse(body);
      }

      return body;
    } catch (error) {
      if (error instanceof ApiError) {
        // const { statusCode, headers } = error;
        throw new Error(error.message);
      }
    }
  }

  async captureOrder(orderId: string) {
    try {
      const { body } = await this.ordersController.ordersCapture({
        id: orderId,
      });
      let parseBody: CapturedOrder;
      if (typeof body === 'string') {
        parseBody = JSON.parse(body);
        if (parseBody.status === 'COMPLETED') {
          const orderId = parseBody.purchase_units[0].reference_id;
          this.updateOrder(orderId);
        }
        return parseBody;
      }
      return body;
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw new BadRequestException(`Failed to capture order`);
      }
      throw new BadRequestException(
        'Error inesperado al capturar la orden de PayPal',
      );
    }
  }

  async updateOrder(orderId: string) {
    const updatedOrder = await firstValueFrom(
      this.client.send('updateOrder', orderId),
    );
    return updatedOrder;
  }

  private getItems(payment: PaymentSessionDto) {
    return payment.items.map((item) => ({
      name: item.name,
      quantity: item.quantity.toString(),
      unitAmount: {
        value: item.price.toString(),
        currencyCode: 'USD',
      },
    }));
  }
  private calculateTotalAmount(payment: PaymentSessionDto): string {
    const total = payment.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return total.toFixed(2);
  }
}
