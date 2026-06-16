import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';

const createPrismaMock = () => ({
  appointmentCalendar: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  appointmentTimeSlot: {
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  appointment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  patient: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
});

const createMailMock = () => ({
  sendAppointmentRequestEmail: jest.fn(),
  sendAppointmentRequestReceivedEmail: jest.fn(),
  sendAppointmentConfirmedEmail: jest.fn(),
  sendAppointmentRejectedEmail: jest.fn(),
});

describe('AppointmentsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let mail: ReturnType<typeof createMailMock>;
  let service: AppointmentsService;

  const calendar = {
    id: 'calendar-1',
    nutritionistId: 'nutri-1',
    name: 'Mi Agenda',
    title: 'Calendario de Citas',
    description: null,
    timeZone: 'America/Santiago',
    metadata: {},
    nutritionist: {
      fullName: 'Nutri Uno',
      account: {
        email: 'nutri@example.com',
      },
    },
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    mail = createMailMock();
    service = new AppointmentsService(prisma as any, mail as any);
  });

  it('creates a requested appointment and notifies both parties', async () => {
    prisma.appointmentCalendar.findFirst.mockResolvedValue(calendar);
    prisma.patient.findFirst.mockResolvedValue({
      id: 'patient-1',
      fullName: 'Paciente Uno',
      email: 'paciente@example.com',
      phone: '+56911111111',
    });
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointment.create.mockResolvedValue({
      id: 'apt-1',
      calendarId: 'calendar-1',
      patientId: 'patient-1',
      patientName: 'Paciente Uno',
      title: 'Solicitud de cita - Paciente Uno',
      description: 'Primera consulta',
      metadata: { source: 'public-profile' },
      startTime: new Date('2099-06-16T15:00:00.000Z'),
      endTime: new Date('2099-06-16T16:00:00.000Z'),
      status: AppointmentStatus.REQUESTED,
      notes: 'Primera consulta',
      meetingUrl: null,
      createdAt: new Date('2026-06-16T14:00:00.000Z'),
      updatedAt: new Date('2026-06-16T14:00:00.000Z'),
    });

    const result = await service.requestAppointment('nutri-1', {
      calendarId: 'calendar-1',
      nutritionistId: 'nutri-1',
      patientId: 'patient-1',
      guestName: 'Paciente Uno',
      guestEmail: 'paciente@example.com',
      guestPhone: '+56911111111',
      message: 'Primera consulta',
      start: '2099-06-16T15:00:00.000Z',
      end: '2099-06-16T16:00:00.000Z',
      source: 'public-profile',
    });

    expect(result.status).toBe(AppointmentStatus.REQUESTED);
    expect(prisma.appointment.create).toHaveBeenCalled();
    expect(mail.sendAppointmentRequestEmail).toHaveBeenCalledWith(
      expect.objectContaining({ nutritionistEmail: 'nutri@example.com' }),
    );
    expect(mail.sendAppointmentRequestReceivedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: 'paciente@example.com' }),
    );
  });

  it('rejects a conflicting appointment request', async () => {
    prisma.appointmentCalendar.findFirst.mockResolvedValue(calendar);
    prisma.patient.findFirst.mockResolvedValue({
      id: 'patient-1',
      fullName: 'Paciente Uno',
      email: 'paciente@example.com',
      phone: null,
    });
    prisma.appointment.findFirst.mockResolvedValue({ id: 'busy-1' });

    await expect(
      service.requestAppointment('nutri-1', {
        calendarId: 'calendar-1',
        nutritionistId: 'nutri-1',
        patientId: 'patient-1',
        guestName: 'Paciente Uno',
        guestEmail: 'paciente@example.com',
        start: '2099-06-16T15:00:00.000Z',
        end: '2099-06-16T16:00:00.000Z',
        source: 'public-profile',
      }),
    ).rejects.toThrow('Ese horario ya no está disponible');
  });

  it('confirms a requested appointment', async () => {
    prisma.appointmentCalendar.findFirst.mockResolvedValue(calendar);
    const requestedAppointment = {
      id: 'apt-1',
      patientName: 'Paciente Uno',
      description: 'Primera consulta',
      startTime: new Date('2099-06-16T15:00:00.000Z'),
      endTime: new Date('2099-06-16T16:00:00.000Z'),
      metadata: { guestEmail: 'paciente@example.com' },
      patient: {
        id: 'patient-1',
        fullName: 'Paciente Uno',
        email: 'paciente@example.com',
      },
    };
    const transactionTx = {
      appointment: {
        findFirst: jest.fn().mockResolvedValueOnce(requestedAppointment).mockResolvedValueOnce(null),
        update: jest.fn().mockResolvedValue({
          id: 'apt-1',
          calendarId: 'calendar-1',
          patientId: 'patient-1',
          patientName: 'Paciente Uno',
          title: 'Solicitud de cita - Paciente Uno',
          description: 'Primera consulta',
          metadata: { confirmedAt: '2099-06-16T14:00:00.000Z' },
          startTime: new Date('2099-06-16T15:00:00.000Z'),
          endTime: new Date('2099-06-16T16:00:00.000Z'),
          status: AppointmentStatus.CONFIRMED,
          notes: 'Primera consulta',
          meetingUrl: null,
          createdAt: new Date('2099-06-16T14:00:00.000Z'),
          updatedAt: new Date('2099-06-16T14:00:00.000Z'),
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: any) => callback(transactionTx as any));

    const result = await service.approveAppointment('nutri-1', 'apt-1');

    expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    expect(mail.sendAppointmentConfirmedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: 'paciente@example.com' }),
    );
  });

  it('rejects a requested appointment and notifies the patient', async () => {
    prisma.appointmentCalendar.findFirst.mockResolvedValue(calendar);
    prisma.appointment.findFirst.mockResolvedValue({
      id: 'apt-1',
      patientName: 'Paciente Uno',
      description: 'Primera consulta',
      startTime: new Date('2099-06-16T15:00:00.000Z'),
      endTime: new Date('2099-06-16T16:00:00.000Z'),
      metadata: { guestEmail: 'paciente@example.com' },
      patient: {
        id: 'patient-1',
        fullName: 'Paciente Uno',
        email: 'paciente@example.com',
      },
    });
    prisma.appointment.update.mockResolvedValue({
      id: 'apt-1',
      calendarId: 'calendar-1',
      patientId: 'patient-1',
      patientName: 'Paciente Uno',
      title: 'Solicitud de cita - Paciente Uno',
      description: 'Primera consulta',
      metadata: { rejectedAt: '2026-06-16T14:00:00.000Z' },
      startTime: new Date('2099-06-16T15:00:00.000Z'),
      endTime: new Date('2099-06-16T16:00:00.000Z'),
      status: AppointmentStatus.REJECTED,
      notes: 'Primera consulta',
      meetingUrl: null,
      createdAt: new Date('2026-06-16T14:00:00.000Z'),
      updatedAt: new Date('2026-06-16T14:00:00.000Z'),
    });

    const result = await service.rejectAppointment('nutri-1', 'apt-1', 'Sin cupo');

    expect(result.status).toBe(AppointmentStatus.REJECTED);
    expect(mail.sendAppointmentRejectedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'paciente@example.com',
        reason: 'Sin cupo',
      }),
    );
  });
});
