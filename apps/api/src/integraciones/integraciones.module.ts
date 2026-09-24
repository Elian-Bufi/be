import { Module } from '@nestjs/common';
import { OpenFoodFacts } from './open-food-facts';
import { Wger } from './wger';

/**
 * WP-08 · los adaptadores de los dos proveedores del compromiso académico (Q-API-001). Los servicios que los usan
 * viven en su dominio —nutrición y entrenamiento—, porque el contrato, los permisos y la revisión son de cada uno
 * (09v12 §8).
 */
@Module({
  providers: [OpenFoodFacts, Wger],
  exports: [OpenFoodFacts, Wger],
})
export class IntegracionesModule {}
