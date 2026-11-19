import os
import base64
import subprocess
from io import BytesIO
from PIL import Image

def get_square_b64(path, size=(200, 200), crop_bbox=None):
    im = Image.open(path)
    if crop_bbox:
        im = im.crop(crop_bbox)
    else:
        # Crop to square center if not square
        w, h = im.size
        if w != h:
            min_side = min(w, h)
            left = (w - min_side) // 2
            top = (h - min_side) // 2
            im = im.crop((left, top, left + min_side, top + min_side))
    
    if size:
        im = im.resize(size, Image.Resampling.LANCZOS)
        
    buf = BytesIO()
    fmt = 'JPEG' if path.lower().endswith(('.jpg', '.jpeg')) else 'PNG'
    if fmt == 'PNG' and im.mode != 'RGBA':
        im = im.convert('RGBA')
    elif fmt == 'JPEG' and im.mode != 'RGB':
        im = im.convert('RGB')
    im.save(buf, format=fmt, quality=95 if fmt == 'JPEG' else None)
    prefix = 'data:image/jpeg;base64,' if fmt == 'JPEG' else 'data:image/png;base64,'
    return prefix + base64.b64encode(buf.getvalue()).decode('ascii')

# 1. Prepare Logos & Mascot
logo_b64 = get_square_b64('frontend/public/logo_2.webp', size=(580, 136), crop_bbox=(606, 988, 5426, 2118))
nutria_im = Image.open('frontend/public/nutria.webp')
nutria_b64 = get_square_b64('frontend/public/nutria.webp', size=(460, 310), crop_bbox=nutria_im.getbbox())

# 2. Food images for the 4 meals
desayuno_b64 = get_square_b64('frontend/public/imag_categories/platos_preparados.png', size=(200, 200))
almuerzo_b64 = get_square_b64('frontend/public/imag_categories/carnes_visceras.png', size=(200, 200))
once_b64 = get_square_b64('frontend/public/imag_categories/postres_leche.png', size=(200, 200))
cena_b64 = get_square_b64('frontend/public/salmon_bowl.jpg', size=(200, 200))

# 3. Alimentos a evitar images
lacteos_b64 = get_square_b64('frontend/public/imag_categories/lacteos.png', size=(140, 140))
bebidas_b64 = get_square_b64('frontend/public/imag_categories/bebidas.png', size=(140, 140))
frituras_b64 = get_square_b64('frontend/public/imag_categories/grasas_aceites.png', size=(140, 140))
azucares_b64 = get_square_b64('frontend/public/imag_categories/azucares_miel.png', size=(140, 140))
cereales_b64 = get_square_b64('frontend/public/imag_categories/cereales.png', size=(140, 140))

html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pauta Nutricional Express · NutriNet</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {{
      size: A4 portrait;
      margin: 0;
    }}
    *, *::before, *::after {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    html, body {{
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #FFFFFF;
      color: #1E293B;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: hidden;
    }}
    .page {{
      width: 210mm;
      height: 297mm;
      padding: 26px 32px 16px 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #FFFFFF;
    }}

    /* Top Header */
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      position: relative;
    }}
    .header-left {{
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }}
    .logo-img {{
      height: 38px;
      width: auto;
      object-fit: contain;
      align-self: flex-start;
      margin-bottom: 2px;
    }}
    .main-title {{
      font-size: 26.5px;
      font-weight: 800;
      color: #1E1B4B;
      letter-spacing: -0.6px;
      line-height: 1.15;
      font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
    }}
    .subtitle-wrapper {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 1px;
    }}
    .subtitle-pill {{
      background: #FEF08A;
      color: #1E1B4B;
      font-size: 19px;
      font-weight: 800;
      padding: 2.5px 16px;
      border-radius: 12px;
      display: inline-block;
      letter-spacing: -0.2px;
      font-family: 'Outfit', sans-serif;
    }}
    .sparks {{
      color: #84CC16;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 2px;
    }}
    .objective-banner {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }}
    .objective-icon {{
      width: 17px;
      height: 17px;
      color: #7C3AED;
      flex-shrink: 0;
    }}
    .objective-text {{
      font-size: 11.5px;
      font-weight: 600;
      color: #334155;
      line-height: 1.35;
    }}
    .objective-text strong {{
      color: #1E1B4B;
      font-weight: 700;
    }}
    .meta-row {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 5px;
    }}
    .meta-pill {{
      background: #F3EDFF;
      border: 1px solid #EDE9FE;
      border-radius: 9999px;
      padding: 4.5px 13px;
      font-size: 11px;
      font-weight: 700;
      color: #4338CA;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}
    .meta-icon {{
      width: 13px;
      height: 13px;
      color: #6D28D9;
    }}

    /* Header Right (Badge + Mascot) */
    .header-right {{
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      position: relative;
    }}
    .type-badge {{
      background: #EDE9FE;
      color: #5B21B6;
      font-size: 11.5px;
      font-weight: 700;
      border-radius: 10px;
      padding: 5.5px 14px;
      border: 1px solid #DDD6FE;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }}
    .mascot-container {{
      position: relative;
      width: 155px;
      height: 106px;
      margin-right: 4px;
    }}
    .mascot-img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(109, 40, 217, 0.12));
    }}
    .sparkle-star {{
      position: absolute;
      color: #EAB308;
      font-size: 15px;
    }}

    /* Plan de Comidas Table Container */
    .plan-section {{
      margin-top: 2px;
      margin-bottom: 10px;
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(109, 40, 217, 0.04);
    }}
    .plan-header-bar {{
      height: 40px;
      background: linear-gradient(90deg, #7C3AED 0%, #6D28D9 100%);
      border-radius: 20px 20px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      color: #FFFFFF;
    }}
    .plan-header-title {{
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.2px;
      font-family: 'Outfit', sans-serif;
    }}
    .plan-header-icon {{
      width: 22px;
      height: 22px;
      background: rgba(255, 255, 255, 0.22);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }}
    .leaf-badge {{
      width: 24px;
      height: 24px;
      color: #BEF264;
    }}
    .plan-card {{
      background: #FFFFFF;
      border: 1.5px solid #EDE9FE;
      border-top: none;
      border-radius: 0 0 20px 20px;
      overflow: hidden;
    }}
    .table-head {{
      height: 29px;
      background: #FAF5FF;
      display: grid;
      grid-template-columns: 88px 125px 1fr 75px;
      align-items: center;
      padding: 0 16px;
      font-size: 11px;
      font-weight: 700;
      color: #6B21A8;
      border-bottom: 1px solid #F3E8FF;
    }}
    .col-center {{
      text-align: center;
    }}
    .col-left {{
      text-align: left;
      padding-left: 14px;
    }}

    /* Meal Row */
    .meal-row {{
      display: grid;
      grid-template-columns: 88px 125px 1fr 75px;
      align-items: center;
      padding: 9.5px 16px;
      border-bottom: 1px solid #F1F5F9;
    }}
    .meal-row:last-child {{
      border-bottom: none;
    }}
    .time-pill {{
      background: #FEF9C3;
      border: 1px solid #FEF08A;
      border-radius: 9999px;
      padding: 4px 9px;
      font-weight: 800;
      font-size: 11.5px;
      color: #1E1B4B;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      margin: 0 auto;
    }}
    .time-icon {{
      width: 12px;
      height: 12px;
      color: #854D0E;
    }}
    .section-card {{
      background: #F5F3FF;
      border: 1px solid #EDE9FE;
      border-radius: 13px;
      padding: 7px 5px;
      text-align: center;
      width: 108px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }}
    .section-card-icon {{
      width: 16px;
      height: 16px;
      color: #7C3AED;
    }}
    .section-card-title {{
      font-size: 11px;
      font-weight: 700;
      color: #312E81;
      line-height: 1.25;
    }}
    .meal-content {{
      display: flex;
      align-items: center;
      gap: 14px;
      padding-left: 6px;
    }}
    .food-thumb {{
      width: 58px;
      height: 58px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #FFFFFF;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
      background: #F8FAFC;
    }}
    .options-list {{
      display: flex;
      flex-direction: column;
      gap: 4px;
    }}
    .option-item {{
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 10.2px;
      color: #1E293B;
      line-height: 1.34;
    }}
    .option-badge {{
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: #84CC16;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.5px;
    }}
    .portion-text {{
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #64748B;
    }}

    /* Alimentos a evitar */
    .avoid-section {{
      margin-top: 2px;
      margin-bottom: 8px;
    }}
    .avoid-header {{
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 5px;
    }}
    .avoid-icon {{
      width: 17px;
      height: 17px;
      color: #EF4444;
    }}
    .avoid-title {{
      font-size: 15px;
      font-weight: 800;
      color: #1E1B4B;
      letter-spacing: -0.2px;
      font-family: 'Outfit', sans-serif;
    }}
    .avoid-card-container {{
      background: #FFFBEB;
      border: 1.5px solid #FEF3C7;
      border-radius: 20px;
      padding: 10px 12px;
      display: flex;
      gap: 9px;
      box-shadow: 0 3px 12px rgba(245, 158, 11, 0.04);
    }}
    .avoid-item-card {{
      background: #FFFFFF;
      border: 1px solid #FDE68A;
      border-radius: 14px;
      padding: 7px 5px;
      text-align: center;
      flex: 1;
      height: 92px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
    }}
    .avoid-item-img {{
      width: 38px;
      height: 38px;
      object-fit: contain;
    }}
    .avoid-item-text {{
      font-size: 9px;
      font-weight: 700;
      color: #1E1B4B;
      line-height: 1.25;
      text-align: center;
    }}

    /* Aesthetic Bottom Wave Footer */
    .footer-wave {{
      width: calc(100% + 64px);
      margin-left: -32px;
      margin-right: -32px;
      margin-bottom: -16px;
      height: 32px;
      background: linear-gradient(90deg, #F3EDFF 0%, #ECFCCB 100%);
      border-radius: 18px 18px 0 0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 32px;
    }}
    .footer-leaf {{
      width: 22px;
      height: 22px;
      color: #94B83D;
    }}
  </style>
</head>
<body>
  <div class="page">
    <div>
      <!-- TOP HEADER -->
      <header class="header">
        <div class="header-left">
          <img src="{logo_b64}" alt="NutriNet" class="logo-img" />
          <h1 class="main-title">Pauta Nutricional Express</h1>
          <div class="subtitle-wrapper">
            <span class="subtitle-pill">Recomposición Corporal</span>
            <span class="sparks">✦ ✦</span>
          </div>
          <div class="objective-banner">
            <svg class="objective-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
            <p class="objective-text">
              <strong>Objetivo:</strong> Déficit moderado de 300 kcal con 1,9 g de proteína por kg y alta densidad de micronutrientes.
            </p>
          </div>
          <div class="meta-row">
            <div class="meta-pill">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Paciente: Camila Paz Silva Contreras</span>
            </div>
            <div class="meta-pill">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Fecha: 04-11-2026</span>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="type-badge">
            <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Pauta Alimentaria</span>
          </div>
          <div class="mascot-container">
            <span class="sparkle-star" style="top: -2px; left: 10px;">✦</span>
            <span class="sparkle-star" style="top: 18px; right: 2px; font-size: 12px; color: #84CC16;">✧</span>
            <img src="{nutria_b64}" alt="Naty la Nutria" class="mascot-img" />
          </div>
        </div>
      </header>

      <!-- PLAN DE COMIDAS SECTION -->
      <section class="plan-section">
        <div class="plan-header-bar">
          <div class="plan-header-title">
            <div class="plan-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path>
                <path d="M15 11v11"></path>
                <path d="M6 2v20"></path>
                <path d="M9 2v4a3 3 0 0 1-6 0V2"></path>
              </svg>
            </div>
            <span>Plan de comidas</span>
          </div>
          <svg class="leaf-badge" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"></path>
          </svg>
        </div>

        <div class="plan-card">
          <!-- Table Header -->
          <div class="table-head">
            <span class="col-center">Hora</span>
            <span class="col-center">Sección</span>
            <span class="col-left">Indicaciones / Alimentos</span>
            <span class="col-center">Porción</span>
          </div>

          <!-- ROW 1: DESAYUNO -->
          <div class="meal-row">
            <div class="time-pill">
              <svg class="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>08:00</span>
            </div>
            <div class="section-card">
              <svg class="section-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
              <span class="section-card-title">Desayuno<br>Proteico</span>
            </div>
            <div class="meal-content">
              <img src="{desayuno_b64}" alt="Desayuno" class="food-thumb" />
              <div class="options-list">
                <div class="option-item">
                  <span class="option-badge">A</span>
                  <span><strong>Porridge de avena (50 g)</strong> cocida en agua con scoop de proteína sin lactosa + 2 huevos pochados.</span>
                </div>
                <div class="option-item">
                  <span class="option-badge">B</span>
                  <span><strong>2 rebanadas pan integral</strong> con pasta de huevo duro y 1/4 palta Hass.</span>
                </div>
              </div>
            </div>
            <div class="portion-text">-</div>
          </div>

          <!-- ROW 2: ALMUERZO -->
          <div class="meal-row">
            <div class="time-pill">
              <svg class="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>13:30</span>
            </div>
            <div class="section-card">
              <svg class="section-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path>
                <path d="M7 12V8a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span class="section-card-title">Almuerzo<br>Equilibrado</span>
            </div>
            <div class="meal-content">
              <img src="{almuerzo_b64}" alt="Almuerzo" class="food-thumb" />
              <div class="options-list">
                <div class="option-item">
                  <span class="option-badge">A</span>
                  <span><strong>Pechuga a la plancha (150 g)</strong> + 3/4 taza de arroz integral + ensalada verde generosa con aceite de oliva (1 cdta).</span>
                </div>
                <div class="option-item">
                  <span class="option-badge">B</span>
                  <span><strong>Filete de reineta o merluza al horno</strong> con papas cocidas al vapor (1 unidad regular) + tomate y pepino.</span>
                </div>
              </div>
            </div>
            <div class="portion-text">-</div>
          </div>

          <!-- ROW 3: ONCE / COLACION -->
          <div class="meal-row">
            <div class="time-pill">
              <svg class="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>17:30</span>
            </div>
            <div class="section-card">
              <svg class="section-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"></path>
                <path d="M10 2c1 .5 2 2 2 5"></path>
              </svg>
              <span class="section-card-title">Once / Colación<br>Media Tarde</span>
            </div>
            <div class="meal-content">
              <img src="{once_b64}" alt="Colación" class="food-thumb" />
              <div class="options-list">
                <div class="option-item">
                  <span class="option-badge">A</span>
                  <span><strong>Yogurt batido proteico sin lactosa</strong> + 4 mitades de nueces + té verde o café sin azúcar.</span>
                </div>
                <div class="option-item">
                  <span class="option-badge">B</span>
                  <span><strong>1 manzana verde en gajos</strong> con 1 cucharada sopera de mantequilla de maní 100% natural.</span>
                </div>
              </div>
            </div>
            <div class="portion-text">-</div>
          </div>

          <!-- ROW 4: CENA -->
          <div class="meal-row">
            <div class="time-pill">
              <svg class="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>20:30</span>
            </div>
            <div class="section-card">
              <svg class="section-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 4v4"></path>
                <path d="M4 18h16"></path>
                <path d="M4 14a8 8 0 0 1 16 0"></path>
              </svg>
              <span class="section-card-title">Cena Liviana<br>y Reparadora</span>
            </div>
            <div class="meal-content">
              <img src="{cena_b64}" alt="Cena" class="food-thumb" />
              <div class="options-list">
                <div class="option-item">
                  <span class="option-badge">A</span>
                  <span><strong>Filete de salmón a la plancha (140 g)</strong> con 1/2 taza de quinoa y salteado de verduras (champiñones y zapallito).</span>
                </div>
                <div class="option-item">
                  <span class="option-badge">B</span>
                  <span><strong>Tortilla de 3 claras y 1 huevo</strong> con espinacas y zanahoria rallada + ensalada mixta.</span>
                </div>
              </div>
            </div>
            <div class="portion-text">-</div>
          </div>
        </div>
      </section>

      <!-- ALIMENTOS A EVITAR SECTION -->
      <section class="avoid-section">
        <div class="avoid-header">
          <svg class="avoid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
          <h2 class="avoid-title">Alimentos a evitar</h2>
        </div>
        <div class="avoid-card-container">
          <!-- Card 1 -->
          <div class="avoid-item-card">
            <img src="{lacteos_b64}" alt="Lácteos" class="avoid-item-img" />
            <p class="avoid-item-text">Lácteos enteros<br>o quesos altos<br>en grasa</p>
          </div>
          <!-- Card 2 -->
          <div class="avoid-item-card">
            <img src="{bebidas_b64}" alt="Bebidas" class="avoid-item-img" />
            <p class="avoid-item-text">Bebidas gaseosas,<br>jugos envasados<br>y alcohol</p>
          </div>
          <!-- Card 3 -->
          <div class="avoid-item-card">
            <img src="{frituras_b64}" alt="Frituras" class="avoid-item-img" />
            <p class="avoid-item-text">Frituras,<br>embutidos y<br>ultraprocesados</p>
          </div>
          <!-- Card 4 -->
          <div class="avoid-item-card">
            <img src="{azucares_b64}" alt="Azúcares" class="avoid-item-img" />
            <p class="avoid-item-text">Azúcares<br>simples y<br>repostería</p>
          </div>
          <!-- Card 5 -->
          <div class="avoid-item-card">
            <img src="{cereales_b64}" alt="Harinas" class="avoid-item-img" />
            <p class="avoid-item-text">Harinas blancas<br>de rápida<br>absorción</p>
          </div>
        </div>
      </section>
    </div>

    <!-- AESTHETIC FOOTER -->
    <div class="footer-wave">
      <svg class="footer-leaf" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"></path>
      </svg>
    </div>
  </div>
</body>
</html>"""

# Write HTML file
temp_html = os.path.abspath('temp_pauta.html')
with open(temp_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print('HTML generated at:', temp_html)

# Paths for output PDF and PNG in the root
pdf_path = os.path.abspath('pauta_nutricional_express.pdf')
pdf_alias = os.path.abspath('pauta_nutrinet.pdf')
png_path = os.path.abspath('pauta_nutricional_express.png')

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Generate PDF with Edge headless
cmd_pdf = [
    edge_exe,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    temp_html
]
subprocess.run(cmd_pdf, check=True)
print('PDF created successfully at:', pdf_path)

# Copy to pauta_nutrinet.pdf
with open(pdf_path, 'rb') as f_in, open(pdf_alias, 'wb') as f_out:
    f_out.write(f_in.read())
print('PDF alias created at:', pdf_alias)

# Use pypdfium2 to render the PDF to a high-DPI image (2x = 1190 x 1684)
import pypdfium2 as pdfium
pdf = pdfium.PdfDocument(pdf_path)
page = pdf[0]
image = page.render(scale=2.0).to_pil()
image.save(png_path)
print('High-DPI preview screenshot saved at:', png_path)

# Clean up temp html
if os.path.exists(temp_html):
    os.remove(temp_html)
print('All Done!')
