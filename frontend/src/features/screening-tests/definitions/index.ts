export { MNA_DEFINITION } from './mna';
export { NRS_2002_DEFINITION } from './nrs-2002';
export { MUST_DEFINITION } from './must';
export { STRONGKIDS_DEFINITION } from './strongkids';
export { ATALAH_DEFINITION, ATALAH_TABLE } from './atalah';

import type { ScreeningTestDefinition, ScreeningTestType } from '../types';
import { MNA_DEFINITION } from './mna';
import { NRS_2002_DEFINITION } from './nrs-2002';
import { MUST_DEFINITION } from './must';
import { STRONGKIDS_DEFINITION } from './strongkids';
import { ATALAH_DEFINITION } from './atalah';

export const ALL_SCREENING_TESTS: ScreeningTestDefinition[] = [
  MNA_DEFINITION,
  NRS_2002_DEFINITION,
  MUST_DEFINITION,
  STRONGKIDS_DEFINITION,
  ATALAH_DEFINITION,
];

export const getTestDefinition = (type: ScreeningTestType): ScreeningTestDefinition | undefined =>
  ALL_SCREENING_TESTS.find((t) => t.type === type);
