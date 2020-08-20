import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';

import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const existentCustomer = await this.customersRepository.findById(
      customer_id,
    );

    if (!existentCustomer) {
      throw new AppError('This customer does not exists');
    }

    const productsExistentInDatabase = await this.productsRepository.findAllById(
      products,
    );

    if (productsExistentInDatabase.length < products.length) {
      throw new AppError('This products does not exists');
    }

    const findProductsWithNotQuantityAvailable = products.filter(
      product =>
        productsExistentInDatabase.filter(p => p.id === product.id)[0]
          .quantity < product.quantity,
    );

    if (findProductsWithNotQuantityAvailable.length) {
      throw new AppError(`This Products does have quantity`);
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsExistentInDatabase.filter(
        prod => prod.id === product.id,
      )[0].price,
    }));

    const order = this.ordersRepository.create({
      customer: existentCustomer,
      products: serializedProducts,
    });

    const orderedProductsQuantity = products.map(product => ({
      id: product.id,
      quantity:
        productsExistentInDatabase.filter(p => p.id === product.id)[0]
          .quantity - product.quantity,
    }));

    this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
