import os
import subprocess
from PIL import Image

# High-fidelity HTML matching NutriNet's REAL portal styling (Emerald + Indigo + Slate)
html_content = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=446, initial-scale=1.0">
  <title>NutriNet · Mi Seguimiento</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      width: 446px;
      height: 796px;
      background: #F8FAFC;
      color: #0F172A;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    /* 1. Status Bar */
    .status-bar {
      height: 26px;
      padding: 5px 20px 0 20px;
      display: flex;
      justifyContent: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      color: #0F172A;
      background: #FFFFFF;
      flex-shrink: 0;
    }
    .status-icons {
      display: flex;
      gap: 5px;
      align-items: center;
    }
    
    /* 2. Top App Header (NutriNet Official) */
    .app-header {
      height: 54px;
      background: #FFFFFF;
      padding: 0 16px;
      display: flex;
      justifyContent: space-between;
      align-items: center;
      border-bottom: 1px solid #F1F5F9;
      flex-shrink: 0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .portal-icon-badge {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: #4F46E5;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .portal-tag {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #4F46E5;
      line-height: 1;
      margin-bottom: 3px;
    }
    .patient-name {
      font-size: 13px;
      font-weight: 800;
      color: #1E293B;
      line-height: 1.1;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nutri-pill {
      background: #F1F5F9;
      padding: 4px 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .nutri-name {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
    }
    
    /* 3. Main Content */
    .main-scroll {
      flex: 1;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow: hidden;
    }
    
    /* Card A: Meta Semanal & Racha (NutriNet Deep Indigo) */
    .streak-card {
      background: #1E1B4B;
      color: #FFFFFF;
      border-radius: 16px;
      padding: 12px 14px;
      box-shadow: 0 2px 8px rgba(30, 27, 75, 0.08);
    }
    .streak-top {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .streak-tag {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #A5B4FC;
    }
    .streak-flame-badge {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid #F59E0B;
      color: #FCD34D;
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .streak-stats {
      display: flex;
      justifyContent: space-between;
      align-items: flex-end;
      margin-bottom: 10px;
    }
    .adherence-val {
      font-size: 22px;
      font-weight: 800;
      line-height: 1;
      color: #FFFFFF;
    }
    .adherence-sub {
      font-size: 9px;
      color: #CBD5E1;
      margin-top: 2px;
    }
    .points-box {
      text-align: right;
    }
    .points-lbl {
      font-size: 8.5px;
      color: #A5B4FC;
    }
    .points-val {
      font-size: 13px;
      font-weight: 800;
      color: #FEF08A;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 3px;
    }
    .days-strip {
      display: flex;
      gap: 5px;
    }
    .day-box {
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 4px 0;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .day-box.done {
      background: #059669;
      color: #FFFFFF;
    }
    .day-box.today {
      background: rgba(245, 158, 11, 0.2);
      border: 1px dashed #F59E0B;
      color: #FCD34D;
    }
    .day-title {
      font-size: 8px;
      font-weight: 700;
      opacity: 0.9;
    }
    
    /* Card B: Comida Actual / Check-in ("¿Cumplí o no cumplí?") */
    .meal-checkin-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 12px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .meal-checkin-header {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    .time-badge {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 9px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .status-tag {
      font-size: 8.5px;
      font-weight: 700;
      color: #059669;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      padding: 2px 7px;
      border-radius: 6px;
    }
    .meal-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #1E293B;
      margin-bottom: 2px;
    }
    .meal-desc {
      font-size: 10px;
      color: #64748B;
      line-height: 1.35;
      margin-bottom: 10px;
    }
    .action-row {
      display: flex;
      gap: 8px;
    }
    .btn-done {
      flex: 1;
      background: #059669;
      color: #FFFFFF;
      font-size: 10.5px;
      font-weight: 700;
      padding: 7px 0;
      border-radius: 10px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.2);
    }
    .btn-edit {
      background: #F8FAFC;
      color: #475569;
      font-size: 10px;
      font-weight: 600;
      padding: 7px 12px;
      border-radius: 10px;
      border: 1px solid #CBD5E1;
    }

    /* Card C: Mi Diario de Hábitos */
    .diary-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 12px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .card-label-row {
      display: flex;
      justifyContent: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .card-label {
      font-size: 10.5px;
      font-weight: 800;
      color: #1E293B;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .diary-note {
      background: #F8FAFC;
      border: 1px solid #F1F5F9;
      border-radius: 10px;
      padding: 7px 10px;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.35;
      margin-bottom: 7px;
    }
    .chips-row {
      display: flex;
      gap: 6px;
    }
    .metric-chip {
      background: #F1F5F9;
      color: #334155;
      font-size: 8.5px;
      font-weight: 700;
      padding: 4px 7px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .metric-chip.active {
      background: #EEF2FF;
      color: #4338CA;
      border: 1px solid #C7D2FE;
    }

    /* Card D: Consultas con la Nutri */
    .qa-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 12px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .question-bubble {
      background: #EEF2FF;
      color: #3730A3;
      border-radius: 10px 10px 2px 10px;
      padding: 7px 10px;
      font-size: 9.5px;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .answer-box {
      background: #F8FAFC;
      border-left: 3px solid #059669;
      border-radius: 4px 10px 10px 10px;
      padding: 7px 10px;
    }
    .answer-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 8.5px;
      font-weight: 800;
      color: #1E293B;
      margin-bottom: 2px;
    }
    .badge-nutri {
      background: #059669;
      color: #FFFFFF;
      font-size: 7px;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .answer-text {
      font-size: 9px;
      color: #334155;
      line-height: 1.35;
    }

    /* 4. Bottom Navigation Bar */
    .bottom-nav {
      height: 58px;
      background: #FFFFFF;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justifyContent: space-around;
      align-items: center;
      padding: 0 10px;
      flex-shrink: 0;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.02);
    }
    .nav-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 8.5px;
      font-weight: 600;
      color: #94A3B8;
      position: relative;
    }
    .nav-tab.active {
      color: #4F46E5;
      font-weight: 800;
    }
    .nav-tab svg {
      width: 18px;
      height: 18px;
    }
    .badge-dot {
      position: absolute;
      top: -1px;
      right: 2px;
      background: #EF4444;
      color: #FFFFFF;
      font-size: 7px;
      font-weight: 800;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <!-- 1. Status bar -->
  <div class="status-bar">
    <span>09:41</span>
    <div class="status-icons">
      <!-- Signal -->
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 20h20L12 4z"/>
      </svg>
      <!-- WiFi -->
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
      <!-- Battery -->
      <svg width="16" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="6" width="17" height="12" rx="2"></rect>
        <path d="M6 10h9v4H6z" fill="currentColor"></path>
        <path d="M22 10v4"></path>
      </svg>
    </div>
  </div>

  <!-- 2. NutriNet Portal Header -->
  <div class="app-header">
    <div class="header-left">
      <div class="portal-icon-badge">
        <!-- Lucide ShieldCheck -->
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      </div>
      <div class="user-info">
        <span class="portal-tag">Mi Portal NutriNet</span>
        <span class="patient-name">Camila Paz Silva</span>
      </div>
    </div>
    <div class="header-right">
      <div class="nutri-pill">
        <!-- Lucide User -->
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span class="nutri-name">Dra. Valeria Soto</span>
      </div>
    </div>
  </div>

  <!-- 3. Main Scroll Content -->
  <div class="main-scroll">
    <!-- Card A: Meta & Racha -->
    <div class="streak-card">
      <div class="streak-top">
        <span class="streak-tag">Adherencia al Plan</span>
        <div class="streak-flame-badge">
          <!-- Lucide Flame -->
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
          <span>Racha 4 días</span>
        </div>
      </div>
      <div class="streak-stats">
        <div>
          <div class="adherence-val">88%</div>
          <div class="adherence-sub">Cumplimiento semanal de pauta</div>
        </div>
        <div class="points-box">
          <span class="points-lbl">Puntos acumulados</span>
          <div class="points-val">
            <!-- Lucide Sparkles -->
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FEF08A" stroke-width="2">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            240 pts
          </div>
        </div>
      </div>
      <div class="days-strip">
        <div class="day-box done">
          <span class="day-title">LUN</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="day-box done">
          <span class="day-title">MAR</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="day-box done">
          <span class="day-title">MIÉ</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="day-box done">
          <span class="day-title">JUE</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="day-box today">
          <span class="day-title">HOY</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="day-box">
          <span class="day-title">SÁB</span>
          <span style="font-size: 9px; line-height: 9px; opacity: 0.4;">·</span>
        </div>
        <div class="day-box">
          <span class="day-title">DOM</span>
          <span style="font-size: 9px; line-height: 9px; opacity: 0.4;">·</span>
        </div>
      </div>
    </div>

    <!-- Card B: Comida actual (Check-in) -->
    <div class="meal-checkin-card">
      <div class="meal-checkin-header">
        <div class="time-badge">
          <!-- Lucide Utensils -->
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5">
            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v19"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
          13:30 · Almuerzo
        </div>
        <span class="status-tag">Opción A recomendada</span>
      </div>
      <div class="meal-name">Pechuga a la plancha + Ensalada verde</div>
      <div class="meal-desc">150g pechuga, 3/4 taza arroz integral, mix verde con 1 cdta. aceite de oliva.</div>
      <div class="action-row">
        <button class="btn-done">
          <!-- Lucide Check -->
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          ¡Cumplí con mi porción!
        </button>
        <button class="btn-edit">Hice cambios</button>
      </div>
    </div>

    <!-- Card C: Mi Diario de Hábitos -->
    <div class="diary-card">
      <div class="card-label-row">
        <span class="card-label">
          <!-- Lucide BookOpen -->
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Mi Diario de Hábitos
        </span>
        <span style="font-size: 8px; font-weight: 700; color: #4F46E5;">+ Nueva nota</span>
      </div>
      <div class="diary-note">
        "Almuerzo completado a la hora. Me sentí saciada y con excelente energía para entrenar. Cero antojos hoy."
      </div>
      <div class="chips-row">
        <div class="metric-chip active">
          <!-- Lucide Droplets -->
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4338CA" stroke-width="2.5">
            <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
          </svg>
          2.0 / 2.5 L Agua
        </div>
        <div class="metric-chip">
          <!-- Lucide Activity -->
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Energía Alta
        </div>
        <div class="metric-chip">
          <!-- Lucide Apple -->
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>
          </svg>
          100% Pauta
        </div>
      </div>
    </div>

    <!-- Card D: Consultas con la Nutricionista -->
    <div class="qa-card">
      <div class="card-label-row">
        <span class="card-label">
          <!-- Lucide MessageSquare -->
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Consultas con tu Nutri
        </span>
        <span style="font-size: 8px; font-weight: 700; color: #059669;">Respondida</span>
      </div>
      <div class="question-bubble">
        ¿Puedo cambiar la colación por frutos secos antes de trotar?
      </div>
      <div class="answer-box">
        <div class="answer-meta">
          <span>Dra. Valeria Soto</span>
          <span class="badge-nutri">Nutricionista</span>
          <span style="font-size: 7px; color: #94A3B8; margin-left: auto;">Hace 20m</span>
        </div>
        <div class="answer-text">
          ¡Hola Camila! Sí, 20g de nueces o almendras es ideal 30 minutos antes. ¡Vas súper bien con tu constancia!
        </div>
      </div>
    </div>
  </div>

  <!-- 4. Bottom Navigation Bar -->
  <div class="bottom-nav">
    <div class="nav-tab active">
      <!-- Lucide BookOpen -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
      <span>Diario</span>
    </div>
    <div class="nav-tab">
      <!-- Lucide Sparkles -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
      <span>Mi Pauta</span>
    </div>
    <div class="nav-tab">
      <!-- Lucide MessageSquare with badge -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <div class="badge-dot">1</div>
      <span>Consultas</span>
    </div>
    <div class="nav-tab">
      <!-- Lucide Award -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
      <span>Logros</span>
    </div>
  </div>
</body>
</html>
"""

temp_html = os.path.abspath('temp_mobile_screen.html')
with open(temp_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print('HTML created at:', temp_html)

# Take screenshot at exact 2x ratio: 446 * 2 = 892, 796 * 2 = 1592
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
mobile_screen_png = os.path.abspath('seguimiento_paciente_movil.png')

cmd = [
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--force-device-scale-factor=2",
    "--window-size=446,796",
    f"--screenshot={mobile_screen_png}",
    temp_html
]
subprocess.run(cmd, check=True)
print('Mobile screen screenshot saved at:', mobile_screen_png)

# Composite inside phone frame
frame_path = r"C:/Users/Benjamin/.gemini/antigravity/brain/725a971e-5042-4266-a494-8412703d449b/.user_uploaded/media_1794319888199_6559909f.png"
phone_frame = Image.open(frame_path).convert('RGBA')

# Upscale frame by 4x: (252*4 = 1008, 492*4 = 1968)
scale = 4
w_scaled = phone_frame.width * scale
h_scaled = phone_frame.height * scale
phone_frame_hq = phone_frame.resize((w_scaled, h_scaled), Image.Resampling.LANCZOS)

# Coordinates for 4x:
# Original box: x=14..236 (width=223), y=41..438 (height=398)
screen_x = 14 * scale # 56
screen_y = 41 * scale # 164
screen_w = 223 * scale # 892
screen_h = 398 * scale # 1592

screen_img = Image.open(mobile_screen_png).convert('RGBA')
screen_resized = screen_img.resize((screen_w, screen_h), Image.Resampling.LANCZOS)

composite = phone_frame_hq.copy()
composite.paste(screen_resized, (screen_x, screen_y))

mockup_out = os.path.abspath('seguimiento_pitch_mockup.png')
composite.save(mockup_out, format='PNG')
print('Pitch mockup composite saved successfully at:', mockup_out)

if os.path.exists(temp_html):
    os.remove(temp_html)

print('All Done!')
