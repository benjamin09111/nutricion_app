import { SetMetadata } from '@nestjs/common';
import { REQUIRED_FEATURES_KEY } from './permissions.constants';

export const RequireFeatures = (...features: string[]) =>
  SetMetadata(REQUIRED_FEATURES_KEY, features);
