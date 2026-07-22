import { IsObject, IsOptional } from 'class-validator';

export class UpdateClinicalRecordDto {
  @IsOptional()
  @IsObject()
  vitalHistory?: {
    occupation?: string;
    workSchedule?: string;
    medications?: string;
    supplementsOrDrugs?: string;
    diagnosedPathologies?: string;
  };

  @IsOptional()
  @IsObject()
  gynecoObstetric?: {
    isPregnant?: boolean;
    pregnancyWeeks?: number;
    pregestationalWeight?: number;
  };

  @IsOptional()
  @IsObject()
  nutritionalAnamnesis?: {
    foodFrequency?: string;
    recall24h?: string;
    eatingPreferences?: string;
    clinicalObservations?: string;
  };

  @IsOptional()
  @IsObject()
  anthropometry?: {
    skinfolds?: {
      tricipital?: number;
      bicipital?: number;
      subescapular?: number;
      suprailiac?: number;
    };
    circumferences?: {
      kneeHeight?: number;
      calfCircumference?: number;
      armCircumference?: number;
      waistCircumference?: number;
      hipCircumference?: number;
    };
  };

  @IsOptional()
  @IsObject()
  dataSources?: Record<string, 'patient' | 'nutritionist' | 'calculated'>;
}
