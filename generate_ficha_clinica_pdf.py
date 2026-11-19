import os
import base64
import subprocess
from io import BytesIO
from PIL import Image

# 1. Base64 Assets
def get_clean_b64(path, size=None, crop_bbox=None):
    im = Image.open(path)
    if crop_bbox:
        im = im.crop(crop_bbox)
    if size:
        im = im.resize(size, Image.Resampling.LANCZOS)
    buf = BytesIO()
    fmt = 'PNG' if path.lower().endswith('.png') or im.mode == 'RGBA' else 'JPEG'
    if fmt == 'PNG' and im.mode != 'RGBA':
        im = im.convert('RGBA')
    elif fmt == 'JPEG' and im.mode != 'RGB':
        im = im.convert('RGB')
    im.save(buf, format=fmt, quality=95 if fmt == 'JPEG' else None)
    prefix = 'data:image/png;base64,' if fmt == 'PNG' else 'data:image/jpeg;base64,'
    return prefix + base64.b64encode(buf.getvalue()).decode('ascii')

logo_b64 = get_clean_b64('frontend/public/logo_2.webp', size=(580, 136), crop_bbox=(606, 988, 5426, 2118))
nutria_im = Image.open('frontend/public/nutria.webp')
nutria_b64 = get_clean_b64('frontend/public/nutria.webp', size=(460, 310), crop_bbox=nutria_im.getbbox())

lacteos_b64 = get_clean_b64('frontend/public/imag_categories/lacteos.png', size=(120, 120))
azucares_b64 = get_clean_b64('frontend/public/imag_categories/azucares_miel.png', size=(120, 120))
frituras_b64 = get_clean_b64('frontend/public/imag_categories/grasas_aceites.png', size=(120, 120))

# 2. HTML Layout for Clinical Record (A4 1-page Canva design)
html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha Clínica Nutricional · NutriNet</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {{
      size: A4 portrait;
      margin: 0;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    body {{
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      background: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #0F172A;
      padding: 24px 30px 18px 30px;
      display: flex;
      flex-direction: column;
      justifyContent: space-between;
      overflow: hidden;
      position: relative;
    }}

    /* Top decorative gradient bar */
    .top-accent-bar {{
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #4F46E5 0%, #7C3AED 50%, #059669 100%);
    }}

    /* Header */
    .header {{
      display: flex;
      justifyContent: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      position: relative;
    }}
    .header-left {{
      flex: 1;
      padding-right: 14px;
    }}
    .logo-row {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }}
    .logo-img {{
      height: 27px;
      object-fit: contain;
    }}
    .category-badge {{
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 9px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.3px;
    }}
    .doc-title {{
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #1E1B4B;
      letter-spacing: -0.5px;
      line-height: 1.15;
      margin-bottom: 3px;
    }}
    .subtitle-pill {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ECFDF5;
      color: #047857;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 8px;
      margin-bottom: 8px;
    }}
    .patient-bar {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }}
    .pill-meta {{
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 3px 9px;
      font-size: 8.5px;
      color: #334155;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }}
    .pill-meta strong {{
      color: #1E1B4B;
      font-weight: 700;
    }}

    /* Mascot Header Right */
    .header-right {{
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      position: relative;
    }}
    .mascot-container {{
      width: 82px;
      height: 62px;
      position: relative;
    }}
    .mascot-img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }}
    .folio-badge {{
      font-size: 8px;
      font-weight: 700;
      color: #64748B;
      margin-top: 2px;
    }}

    /* 4 Stats Cards */
    .stats-row {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }}
    .stat-card {{
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
    }}
    .stat-card.highlight {{
      background: #EEF2FF;
      border-color: #C7D2FE;
    }}
    .stat-card.emerald {{
      background: #ECFDF5;
      border-color: #A7F3D0;
    }}
    .stat-label {{
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748B;
      margin-bottom: 2px;
    }}
    .stat-val {{
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #1E1B4B;
      line-height: 1;
      margin-bottom: 3px;
    }}
    .stat-pill {{
      font-size: 7.5px;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 6px;
    }}
    .pill-green {{
      background: #D1FAE5;
      color: #065F46;
    }}
    .pill-indigo {{
      background: #E0E7FF;
      color: #3730A3;
    }}
    .pill-amber {{
      background: #FEF3C7;
      color: #92400E;
    }}

    /* Section Bar (Official Canva styling) */
    .section-bar {{
      background: #4F46E5;
      color: #FFFFFF;
      border-radius: 10px;
      padding: 5px 10px;
      display: flex;
      justifyContent: space-between;
      align-items: center;
      margin-bottom: 6px;
    }}
    .section-bar-left {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }}
    .section-badge {{
      background: #ECFDF5;
      color: #047857;
      font-size: 7.5px;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 6px;
    }}

    /* 2 Columns Body */
    .grid-2col {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
      flex: 1;
    }}
    .col-left, .col-right {{
      display: flex;
      flex-direction: column;
      gap: 9px;
    }}

    /* Content Cards */
    .card {{
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 9px 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }}
    .card-title {{
      font-size: 9.5px;
      font-weight: 800;
      color: #1E1B4B;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #F1F5F9;
    }}
    .data-table {{
      width: 100%;
      border-collapse: collapse;
    }}
    .data-table tr {{
      border-bottom: 1px solid #F8FAFC;
    }}
    .data-table tr:last-child {{
      border-bottom: none;
    }}
    .data-table td {{
      padding: 2.5px 0;
      font-size: 8px;
      line-height: 1.35;
    }}
    .td-label {{
      color: #64748B;
      font-weight: 600;
      width: 48%;
    }}
    .td-val {{
      color: #0F172A;
      font-weight: 700;
      text-align: right;
    }}

    /* Diagnosis Highlight Box */
    .diag-box {{
      background: #F5F3FF;
      border-left: 3px solid #7C3AED;
      border-radius: 4px 8px 8px 4px;
      padding: 6px 8px;
      font-size: 8px;
      color: #3730A3;
      line-height: 1.35;
      margin-bottom: 6px;
    }}
    .diag-box strong {{
      color: #1E1B4B;
      font-weight: 800;
    }}

    /* Avoid Foods Box (matching Pauta Express) */
    .avoid-box {{
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 10px;
      padding: 7px 10px;
    }}
    .avoid-header {{
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 9px;
      font-weight: 800;
      color: #92400E;
      margin-bottom: 5px;
    }}
    .avoid-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }}
    .avoid-item {{
      background: #FFFFFF;
      border: 1px solid #FDE68A;
      border-radius: 6px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }}
    .avoid-img {{
      width: 18px;
      height: 18px;
      object-fit: contain;
      margin-bottom: 2px;
    }}
    .avoid-lbl {{
      font-size: 6.5px;
      font-weight: 600;
      color: #78350F;
      line-height: 1.1;
    }}

    /* Habits Chips */
    .chips-grid {{
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }}
    .habit-chip {{
      background: #F1F5F9;
      padding: 3px 7px;
      border-radius: 6px;
      font-size: 7.5px;
      font-weight: 600;
      color: #334155;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }}

    /* Treatment Plan Box */
    .plan-box {{
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 10px;
      padding: 8px 10px;
    }}
    .plan-header {{
      display: flex;
      justifyContent: space-between;
      align-items: center;
      font-size: 9px;
      font-weight: 800;
      color: #065F46;
      margin-bottom: 5px;
    }}
    .plan-points {{
      list-style: none;
      padding-left: 0;
    }}
    .plan-points li {{
      font-size: 8px;
      color: #047857;
      line-height: 1.35;
      margin-bottom: 3px;
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }}
    .plan-points li::before {{
      content: "•";
      font-weight: 800;
      color: #059669;
    }}

    /* Footer wave bar */
    .footer {{
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justifyContent: space-between;
      align-items: center;
    }}
    .footer-left {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 7.5px;
      color: #64748B;
    }}
    .footer-brand {{
      font-weight: 800;
      color: #4F46E5;
    }}
    .footer-right {{
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 7.5px;
      color: #475569;
    }}
    .signature-badge {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #EEF2FF;
      color: #3730A3;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <div class="top-accent-bar"></div>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="logo-row">
        <img src="{logo_b64}" class="logo-img" alt="NutriNet">
        <div class="category-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          FICHA CLÍNICA OFICIAL
        </div>
      </div>
      <h1 class="doc-title">Ficha de Evaluación Nutricional</h1>
      <div class="subtitle-pill">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        Control Clínico · Adulto & Recomposición Corporal
      </div>
      
      <div class="patient-bar">
        <div class="pill-meta">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#4F46E5"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          Paciente: <strong>Camila Paz Silva Contreras</strong>
        </div>
        <div class="pill-meta">RUT: <strong>19.482.301-4</strong></div>
        <div class="pill-meta">Edad: <strong>28 años</strong> (14-03-1998)</div>
        <div class="pill-meta">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#059669"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
          Fecha: <strong>10-11-2026</strong>
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="mascot-container">
        <img src="{nutria_b64}" class="mascot-img" alt="Naty Mascot">
      </div>
      <span class="folio-badge">Folio: NN-2026-0842</span>
    </div>
  </div>

  <!-- 4 Stats Cards -->
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-label">Peso Actual</span>
      <span class="stat-val">62.4 <small style="font-size: 11px;">kg</small></span>
      <span class="stat-pill pill-indigo">Habitual: 63.0 kg</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Estatura</span>
      <span class="stat-val">164 <small style="font-size: 11px;">cm</small></span>
      <span class="stat-pill pill-indigo">Talla adulto</span>
    </div>
    <div class="stat-card emerald">
      <span class="stat-label">IMC</span>
      <span class="stat-val">23.2</span>
      <span class="stat-pill pill-green">Normopeso (Óptimo)</span>
    </div>
    <div class="stat-card highlight">
      <span class="stat-label">Gasto Calórico (GET)</span>
      <span class="stat-val">1.950 <small style="font-size: 10px;">kcal</small></span>
      <span class="stat-pill pill-amber">Meta: Déficit -250</span>
    </div>
  </div>

  <!-- Section Bar -->
  <div class="section-bar">
    <div class="section-bar-left">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      EXPEDIENTE CLÍNICO & PARÁMETROS ANTROPOMÉTRICOS
    </div>
    <div class="section-badge">NutriNet Protocol v2.6</div>
  </div>

  <!-- 2 Columns Grid -->
  <div class="grid-2col">
    <!-- Columna Izquierda -->
    <div class="col-left">
      <!-- Card: Diagnóstico & Motivo -->
      <div class="card">
        <div class="card-title">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Diagnóstico Nutricional Integrado
        </div>
        <div class="diag-box">
          <strong>Diagnóstico:</strong> Paciente femenina de 28 años, estado nutricional normopeso (IMC 23.2), con distribución adiposa ginecoide y masa muscular en rango regular. Buen pronóstico de recomposición corporal con entrenamiento de fuerza.
        </div>
        <table class="data-table">
          <tr>
            <td class="td-label">Motivo de consulta:</td>
            <td class="td-val">Recomposición corporal y energía</td>
          </tr>
          <tr>
            <td class="td-label">Enfoque clínico:</td>
            <td class="td-val">Hipertrofia magra + control ansiedad</td>
          </tr>
          <tr>
            <td class="td-label">Peso Objetivo:</td>
            <td class="td-val" style="color: #059669;">60.0 kg (-2.4 kg grasa)</td>
          </tr>
        </table>
      </div>

      <!-- Card: Pliegues y Circunferencias -->
      <div class="card">
        <div class="card-title">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Antropometría & Composición Corporal
        </div>
        <table class="data-table">
          <tr>
            <td class="td-label">% Grasa estimada:</td>
            <td class="td-val">27.5% (Bioimpedancia)</td>
          </tr>
          <tr>
            <td class="td-label">Masa muscular esquelética:</td>
            <td class="td-val">24.1 kg</td>
          </tr>
          <tr>
            <td class="td-label">Pliegue Tricipital / Bicipital:</td>
            <td class="td-val">14 mm / 8 mm</td>
          </tr>
          <tr>
            <td class="td-label">Pliegue Subescapular / Suprailiaco:</td>
            <td class="td-val">12 mm / 15 mm</td>
          </tr>
          <tr>
            <td class="td-label">Circunferencia de cintura:</td>
            <td class="td-val">68 cm (Sin riesgo metabólico)</td>
          </tr>
          <tr>
            <td class="td-label">Circunferencia de cadera:</td>
            <td class="td-val">96 cm</td>
          </tr>
          <tr>
            <td class="td-label">Índice Cintura / Cadera (ICC):</td>
            <td class="td-val" style="color: #059669;">0.71 (Riesgo bajo &lt; 0.85)</td>
          </tr>
        </table>
      </div>

      <!-- Card: Hábitos & Estilo de Vida -->
      <div class="card">
        <div class="card-title">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>
          Hábitos & Anamnesis General
        </div>
        <div class="chips-grid">
          <div class="habit-chip">🏃 Fuerza 4x / semana</div>
          <div class="habit-chip">💧 2.2 L agua / día</div>
          <div class="habit-chip">😴 7.5 hrs sueño profundo</div>
          <div class="habit-chip">💼 Trabajo de oficina sedentario</div>
          <div class="habit-chip">🚭 No fuma / Alcohol ocasional</div>
        </div>
      </div>
    </div>

    <!-- Columna Derecha -->
    <div class="col-right">
      <!-- Card: Perfil Bioquímico -->
      <div class="card">
        <div class="card-title">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          Laboratorio Clínico (Últimos exámenes)
        </div>
        <table class="data-table">
          <tr>
            <td class="td-label">Glicemia en ayunas:</td>
            <td class="td-val" style="color: #059669;">86 mg/dL (Normal: 70-100)</td>
          </tr>
          <tr>
            <td class="td-label">Colesterol Total:</td>
            <td class="td-val">178 mg/dL (&lt; 200 mg/dL)</td>
          </tr>
          <tr>
            <td class="td-label">Colesterol LDL / HDL:</td>
            <td class="td-val">98 mg/dL / 56 mg/dL</td>
          </tr>
          <tr>
            <td class="td-label">Triglicéridos:</td>
            <td class="td-val" style="color: #059669;">92 mg/dL (&lt; 150 mg/dL)</td>
          </tr>
          <tr>
            <td class="td-label">Presión Arterial:</td>
            <td class="td-val">115 / 75 mmHg (Normotensa)</td>
          </tr>
        </table>
      </div>

      <!-- Card: Alimentos a Restringir / Alergias -->
      <div class="avoid-box">
        <div class="avoid-header">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#EF4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>
          Restricciones Alimentarias Clínicas
        </div>
        <div class="avoid-grid">
          <div class="avoid-item">
            <img src="{lacteos_b64}" class="avoid-img" alt="Lácteos">
            <span class="avoid-lbl">Lácteos con lactosa (intolerancia)</span>
          </div>
          <div class="avoid-item">
            <img src="{azucares_b64}" class="avoid-img" alt="Azúcares">
            <span class="avoid-lbl">Azúcares refinados vespertinos</span>
          </div>
          <div class="avoid-item">
            <img src="{frituras_b64}" class="avoid-img" alt="Frituras">
            <span class="avoid-lbl">Grasas saturadas y embutidos</span>
          </div>
        </div>
      </div>

      <!-- Card: Plan de Intervención -->
      <div class="plan-box">
        <div class="plan-header">
          <span>Plan Terapéutico NutriNet</span>
          <span style="font-size: 7.5px; background: #D1FAE5; padding: 1.5px 5px; border-radius: 4px;">Paso 1 / 3</span>
        </div>
        <ul class="plan-points">
          <li>Aporte proteico objetivo de <strong>1,8 g/kg</strong> (112 g proteína total al día).</li>
          <li>Distribución en 4 tiempos de comida con énfasis en once proteica para evitar atracón nocturno.</li>
          <li>Suplementación con Creatina monohidratada 5g/día post-entreno.</li>
          <li>Próximo control presencial: <strong>08-12-2026 (en 4 semanas)</strong>.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#059669"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>
      <span class="footer-brand">NutriNet</span>
      <span>· Ficha Clínica Oficial · Documento Médico Electrónico</span>
    </div>
    <div class="footer-right">
      <div class="signature-badge">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#3730A3" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Dra. Valeria Soto · Col. Nutricionistas N° 4812
      </div>
      <span>Pág. 1 / 1</span>
    </div>
  </div>
</body>
</html>
"""

temp_html = os.path.abspath('temp_ficha_clinica.html')
with open(temp_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print('HTML saved at:', temp_html)

# 3. Print to PDF via Headless Edge
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_out = os.path.abspath('ficha_clinica_nutrinet.pdf')

cmd_pdf = [
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_out}",
    temp_html
]
subprocess.run(cmd_pdf, check=True)
print('PDF generated at:', pdf_out)

# 4. Render High-DPI PNG Preview with pypdfium2
import pypdfium2 as pdfium
pdf = pdfium.PdfDocument(pdf_out)
page = pdf[0]
bitmap = page.render(scale=2.0)
pil_image = bitmap.to_pil()

png_out = os.path.abspath('ficha_clinica_nutrinet.png')
pil_image.save(png_out, format='PNG')
print('High-DPI PNG preview generated at:', png_out)

if os.path.exists(temp_html):
    os.remove(temp_html)

print('All Done!')

