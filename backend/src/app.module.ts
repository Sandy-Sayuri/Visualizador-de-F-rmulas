import { Module } from '@nestjs/common';

import { SimulationsModule } from './modules/simulations/simulations.module';

@Module({
  imports: [SimulationsModule],
})
export class AppModule {}
