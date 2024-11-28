import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class PaymentService {
  private readonly client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: envs.PAYPAL_CLIENT_ID,
      oAuthClientSecret: envs.PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment: Environment.Sandbox,
  });
  private readonly ordersController = new OrdersController(this.client);

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

  parseBody: any;

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
      const { body, ...httpResponse } =
        await this.ordersController.ordersCreate({ body: orderRequest });
      if (typeof body === 'string') {
        this.parseBody = JSON.parse(body);
      }

      return this.parseBody;
    } catch (error) {
      if (error instanceof ApiError) {
        // const { statusCode, headers } = error;
        throw new Error(error.message);
      }
    }
  }

  async captureOrder(orderId: string) {
    try {
      const { body, ...httpResponse } =
        await this.ordersController.ordersCapture({ id: orderId });
      let parseBody;
      if (httpResponse.statusCode === 201) {
        console.log('Aqui actualizaría la orden');
      }
      if (typeof body === 'string') {
        parseBody = JSON.parse(body);
        console.log(parseBody.status);
        return parseBody;
      }
      if (parseBody.status === 'COMPLETED') {
        //todo: actualizar la orden
      }

      return {
        body,
      };
    } catch (error) {
      console.log(error);

      if (error instanceof ApiError) {
        throw new BadRequestException(
          `Failed to capture order: ${error.message}`,
        );
      }

      throw new BadRequestException(
        'Error inesperado al capturar la orden de PayPal',
      );
    }
  }
}
