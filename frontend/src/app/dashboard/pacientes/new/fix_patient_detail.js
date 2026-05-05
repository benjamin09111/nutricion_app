const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/Benjamin/Desktop/nutricion_app/frontend/src/app/dashboard/pacientes/[id]/PatientDetailClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// I'll use very specific lines from the current corrupted state
const antropometriaEndLine = '{patient.height ?? "---"}';
const nextLines = '</div>\n                  </div>\n                </div>';

const estadoPacienteStartLine = ': "Tratamiento pausado"}';

const startIdx = content.indexOf(antropometriaEndLine);
const endIdx = content.indexOf(estadoPacienteStartLine);

if (startIdx !== -1 && endIdx !== -1) {
    // Find the end of the antropometria container
    const searchPart = content.substring(startIdx);
    const endContainerIdx = searchPart.indexOf('</div>\n                  </div>\n                </div>');
    
    if (endContainerIdx === -1) {
        console.error('Could not find end container relative to startIdx');
        process.exit(1);
    }
    
    const splitPoint = startIdx + endContainerIdx + '</div>\n                  </div>\n                </div>'.length;
    
    const before = content.substring(0, splitPoint);
    const after = content.substring(endIdx);

    const fixedMiddle = `
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex-1 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <h2 className="text-lg font-bold text-slate-800">Metas nutricionales</h2>
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-5">
                  {(() => {
                    const dataSource = isEditing ? editForm.customVariables : patient.customVariables;
                    const vars = Array.isArray(dataSource) ? dataSource as any[] : [];
                    const getCV = (key: string) => vars.find(v => v.key === key)?.value || "";
                    const updateCV = (key: string, label: string, value: string, unit: string) => {
                      if (!isEditing) return;
                      const prev = Array.isArray(editForm.customVariables) ? [...editForm.customVariables as any[]] : [];
                      const idx = prev.findIndex(v => v.key === key);
                      if (idx >= 0) prev[idx] = { key, label, value, unit };
                      else prev.push({ key, label, value, unit });
                      updateField("customVariables", prev);
                    };

                    return (
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { id: "Calories", label: "Calorías", unit: "kcal", color: "text-indigo-600", bg: "bg-indigo-50" },
                          { id: "Protein", label: "Proteína", unit: "g", color: "text-emerald-600", bg: "bg-emerald-50" }
                        ].map((f) => (
                          <div key={f.id} className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{f.label}</label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={getCV(\`target\${f.id}\`)}
                                onChange={e => updateCV(\`target\${f.id}\`, \`\${f.label} Meta\`, e.target.value, f.unit)}
                                className={cn("h-10 font-bold bg-white rounded-xl text-sm border-transparent focus:ring-2 focus:ring-slate-200 transition-all", f.color)}
                                placeholder="0"
                              />
                            ) : (
                              <div className={cn("h-10 flex items-center justify-center rounded-xl font-bold text-sm border border-transparent", f.bg, f.color)}>
                                {getCV(\`target\${f.id}\`) || "---"}
                                <span className="text-[8px] ml-1 opacity-60">{f.unit}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Column 3: Estado del Paciente */}
            <div className="flex flex-col">
              <div
                className={cn(
                  "bg-white rounded-3xl p-6 border transition-all duration-500 hover:shadow-md",
                  patient.status === "Inactive"
                    ? "border-slate-200 bg-slate-50/50"
                    : "border-slate-100",
                )}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={cn(
                      "p-2 rounded-xl",
                      patient.status === "Inactive"
                        ? "bg-slate-200 text-slate-500"
                        : "bg-emerald-100 text-emerald-600",
                    )}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
                      Estado del Paciente
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {patient.status === "Active"
                        ? "Actualmente en tratamiento"
                        `;

    fs.writeFileSync(filePath, before + fixedMiddle + after, 'utf8');
    console.log('Successfully fixed the file structure.');
} else {
    console.error('Could not find markers:', { startIdx, endIdx });
}
