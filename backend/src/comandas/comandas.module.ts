import { Module } from '@nestjs/common';
import { ComandasService } from './comandas.service';
import { ComandasController } from './comandas.controller';

@Module({
  controllers: [ComandasController],
  providers: [ComandasService],
})
export class ComandasModule {}
