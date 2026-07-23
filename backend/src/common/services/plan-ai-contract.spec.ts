import {
  buildPlanAiRequest,
  compactPlanPatientContext,
} from './plan-ai-contract';

describe('plan-ai-contract', () => {
  it('keeps relevant patient context and omits personal identifiers', () => {
    const context = compactPlanPatientContext({
      fullName: 'Paciente de prueba',
      email: 'paciente@example.com',
      gender: 'Femenino',
      weight: 70,
      height: 170,
      likes: 'comidas caseras',
      dislikedFoods: ['pescado'],
      dietRestrictions: ['sin lactosa'],
      clinicalSummary: 'Control metabólico',
    });

    expect(context).toMatchObject({
      sexo: 'Femenino',
      pesoKg: 70,
      tallaCm: 170,
      imc: 24.2,
      alimentosNoConsume: ['pescado'],
    });
    expect(context).not.toHaveProperty('fullName');
    expect(context).not.toHaveProperty('email');
  });

  it('adds explicit allowlist and optional condiment rules', () => {
    const request = buildPlanAiRequest({
      availableFoods: ['pollo', 'arroz'],
      objective: 'Pérdida de grasa',
      instruction: 'Genera una preparación simple.',
      allowExternalFoods: false,
      outputSchema: { dishes: [] },
    });

    expect(request.contexto.alimentosDisponibles).toEqual(['pollo', 'arroz']);
    expect(request.pedido.permitirAlimentosFueraDeLista).toBe(false);
    expect(request.pedido.reglas).toEqual(
      expect.arrayContaining([
        'Usa exclusivamente los alimentos de alimentosDisponibles.',
        'Los condimentos básicos pueden agregarse solo como ingredientes opcionales con optional=true.',
      ]),
    );
    expect(request.output.soloJson).toBe(true);
  });
});
