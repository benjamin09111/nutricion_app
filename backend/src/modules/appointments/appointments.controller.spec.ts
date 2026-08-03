import { Reflector } from '@nestjs/core';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';
import { REQUIRED_FEATURES_KEY } from '../permissions/permissions.constants';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsPublicController } from './appointments.public.controller';
import { AppointmentsRecordsController } from './appointments.records.controller';

const requiredFeatures = (controller: object, method: string) =>
  Reflect.getMetadata(
    REQUIRED_FEATURES_KEY,
    (controller as Record<string, unknown>)[method],
  );

describe('Appointment entitlement protection', () => {
  it('protects authenticated calendar and appointment management routes', () => {
    expect(requiredFeatures(AppointmentsController.prototype, 'getMyCalendar')).toEqual([
      PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS,
    ]);
    expect(requiredFeatures(AppointmentsController.prototype, 'createAppointment')).toEqual([
      PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS,
    ]);
    expect(requiredFeatures(AppointmentsController.prototype, 'approveAppointment')).toEqual([
      PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS,
    ]);
    expect(requiredFeatures(AppointmentsRecordsController.prototype, 'listAppointments')).toEqual([
      PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS,
    ]);
  });

  it('requires both entitlements for Google Calendar integration routes', () => {
    expect(requiredFeatures(AppointmentsController.prototype, 'connectGoogleCalendar')).toEqual([
      PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS,
      PLAN_ENTITLEMENT_KEYS.GOOGLE_CALENDAR_SYNC,
    ]);
    expect(requiredFeatures(AppointmentsController.prototype, 'updateGoogleIntegration')).toEqual([
      PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS,
      PLAN_ENTITLEMENT_KEYS.GOOGLE_CALENDAR_SYNC,
    ]);
  });

  it('does not add entitlement protection to public booking endpoints', () => {
    expect(
      requiredFeatures(AppointmentsPublicController.prototype, 'getBookingLink'),
    ).toBeUndefined();
    expect(
      requiredFeatures(
        AppointmentsPublicController.prototype,
        'createBookingLinkRequest',
      ),
    ).toBeUndefined();
  });
});
