// Screening Tests Feature Module
export type {
  ScreeningTestType,
  ScreeningTestDefinition,
  ScreeningTestAnswers,
  ScreeningTestResult,
  ScreeningTestCreationContent,
  PatientAutoFillData,
} from './types';

export {
  ALL_SCREENING_TESTS,
  getTestDefinition,
  MNA_DEFINITION,
  NRS_2002_DEFINITION,
  MUST_DEFINITION,
  STRONGKIDS_DEFINITION,
  ATALAH_DEFINITION,
} from './definitions';

export { calculateTestResult, buildDefaultAnswers } from './utils/scoring';
export { autoFillAnswers, suggestTestType } from './utils/auto-fill';
