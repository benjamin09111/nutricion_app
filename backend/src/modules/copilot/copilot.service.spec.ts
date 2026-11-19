import 'reflect-metadata';

jest.mock('ai', () => ({
  ToolLoopAgent: jest.fn().mockImplementation((config) => ({
    tools: config.tools,
    stream: jest.fn(),
  })),
  tool: jest.fn().mockImplementation((def) => def),
  isStepCount: jest.fn(),
  generateObject: jest.fn(),
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(),
}));

import { CopilotService } from './copilot.service';

describe('CopilotService - Tenant Isolation & IDOR Protection', () => {
  let service: CopilotService;
  let mockPrisma: any;
  let mockAiService: any;
  let mockAiUsageService: any;

  beforeEach(() => {
    mockPrisma = {
      patient: {
        findFirst: jest.fn(),
      },
      ingredient: {
        findMany: jest.fn(),
      },
    };

    mockAiService = {
      resolvePreferredModelConfig: jest.fn().mockReturnValue({
        provider: 'gemini',
        model: {} as any,
        modelId: 'gemini-test',
      }),
      formatPatientContext: jest.fn().mockReturnValue('Contexto simulado de paciente'),
    };

    mockAiUsageService = {
      logUsage: jest.fn().mockResolvedValue(undefined),
    };

    service = new CopilotService(mockPrisma, mockAiService, mockAiUsageService);
  });

  describe('IDOR Protection in obtenerPaciente tool', () => {
    const targetPatientId = 'patient-uuid-123';
    const legitimateNutritionistId = 'nutri-owner-aaa';
    const attackerNutritionistId = 'nutri-attacker-bbb';

    it('allows a nutritionist to access their own patient profile', async () => {
      const mockPatientData = {
        id: targetPatientId,
        fullName: 'Juan Pérez',
        age: 32,
        gender: 'Masculino',
        weight: 78,
        height: 175,
        nutritionalFocus: 'Hipertrofia',
        fitnessGoals: 'Aumento de masa muscular',
        activityLevel: 'moderado',
        dietRestrictions: ['sin mariscos'],
        likes: 'avena, pollo',
        clinicalSummary: 'Paciente sano sin patologías',
      };

      mockPrisma.patient.findFirst.mockResolvedValue(mockPatientData);

      const agent = service.getAgent('acc-1', legitimateNutritionistId);
      const tool = (agent as any).tools.obtenerPaciente;

      const result = await tool.execute({ pacienteId: targetPatientId });

      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith({
        where: {
          id: targetPatientId,
          nutritionistId: legitimateNutritionistId,
        },
        select: expect.any(Object),
      });

      expect(result.nombre).toBe('Juan Pérez');
      expect(result.resumenClinico).toBe('Paciente sano sin patologías');
      expect(result.error).toBeUndefined();
    });

    it('blocks a nutritionist from reading another nutritionist patient (IDOR rejection)', async () => {
      // Prisma findFirst returns null because the patient belongs to another nutritionist
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      const agent = service.getAgent('acc-attacker', attackerNutritionistId);
      const tool = (agent as any).tools.obtenerPaciente;

      const result = await tool.execute({ pacienteId: targetPatientId });

      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith({
        where: {
          id: targetPatientId,
          nutritionistId: attackerNutritionistId,
        },
        select: expect.any(Object),
      });

      expect(result.error).toContain('no tienes permiso para acceder a esta ficha clínica');
      expect(result.nombre).toBeUndefined();
      expect(result.clinicalSummary).toBeUndefined();
    });

    it('rejects access when nutritionistId is missing or empty', async () => {
      const agent = service.getAgent('acc-anon', undefined);
      const tool = (agent as any).tools.obtenerPaciente;

      const result = await tool.execute({ pacienteId: targetPatientId });

      expect(mockPrisma.patient.findFirst).not.toHaveBeenCalled();
      expect(result.error).toContain('No autorizado');
    });
  });

  describe('Multi-tenant Memory Scoping (recordar & evocar)', () => {
    it('isolates memory between different tenants', async () => {
      const agentTenantA = service.getAgent('account-A', 'nutri-A');
      const agentTenantB = service.getAgent('account-B', 'nutri-B');

      const toolRememberA = (agentTenantA as any).tools.recordar;
      const toolEvokeA = (agentTenantA as any).tools.evocar;
      const toolEvokeB = (agentTenantB as any).tools.evocar;

      // Tenant A stores a secret clinical note
      await toolRememberA.execute({
        clave: 'meta_clinica',
        valor: 'Reducir sodio a 1500mg',
      });

      // Tenant B tries to evoke the same key
      const resultB = await toolEvokeB.execute({ clave: 'meta_clinica' });
      expect(resultB.encontrado).toBe(false);
      expect(resultB.valor).toBeUndefined();

      // Tenant A evokes their own key and retrieves it
      const resultA = await toolEvokeA.execute({ clave: 'meta_clinica' });
      expect(resultA.encontrado).toBe(true);
      expect(resultA.valor).toBe('Reducir sodio a 1500mg');
    });
  });

  describe('Ingredient Search Security & Limits (buscarAlimentos)', () => {
    it('enforces safe upper limit on search results to prevent mass dumping', async () => {
      mockPrisma.ingredient.findMany.mockResolvedValue([]);

      const agent = service.getAgent('acc-1', 'nutri-1');
      const tool = (agent as any).tools.buscarAlimentos;

      await tool.execute({ query: 'pan', limite: 9999 });

      expect(mockPrisma.ingredient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20, // Capped to max 20
          where: expect.objectContaining({
            OR: [
              { isPublic: true },
              { nutritionistId: 'nutri-1' },
            ],
          }),
        }),
      );
    });
  });
});
