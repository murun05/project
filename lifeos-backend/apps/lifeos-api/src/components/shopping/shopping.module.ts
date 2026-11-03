import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ShoppingResolver } from './shopping.resolver';
import { ShoppingService } from './shopping.service';

@Module({ imports: [AuthModule], providers: [ShoppingService, ShoppingResolver] })
export class ShoppingModule {}
