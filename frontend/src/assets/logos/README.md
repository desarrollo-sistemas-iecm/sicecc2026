# Logos — SISEC CC 2026 / IECM

## Archivos en esta carpeta

| Archivo | Descripción | Dónde se usa |
|---|---|---|
| `logo-iecm-color.png` | Logo IECM horizontal a color (morado + dorado) | Pantalla de login (fondo claro) |
| `logo-iecm-blanco.png` | Logo IECM blanco (sin color, para fondos oscuros) | Sidebar (fondo morado oscuro) |
| `logo-iecm-isotipo.png` | Solo el escudo/isotipo IECM | Favicon, estado cargando |

## Dimensiones recomendadas

| Variante | Ancho recomendado | Alto recomendado | Formato |
|---|---|---|---|
| `logo-iecm-color.png` | 240 px | 80 px | PNG fondo transparente o SVG |
| `logo-iecm-blanco.png` | 180 px | 60 px | PNG fondo transparente o SVG |
| `logo-iecm-isotipo.png` | 64 px | 64 px | PNG fondo transparente o SVG |

## Instrucciones

1. **Reemplaza cada archivo placeholder** con el logo oficial del IECM en las dimensiones indicadas.
2. **Formato preferido**: PNG con fondo transparente (`alpha channel`). SVG también aceptado.
3. **Resolución**: mínimo 2x (el doble de los píxeles indicados) para pantallas Retina/HiDPI.
4. **Nombrado**: no cambies los nombres de archivo — los componentes los referencian directamente.

## Ubicación en componentes

```
AppSidebar.vue      → logo-iecm-blanco.png    (menú lateral izquierdo)
LoginView.vue       → logo-iecm-color.png     (panel izquierdo de login)
AppNavbar.vue       → logo-iecm-isotipo.png   (header topbar, 32×32 px)
```

## Comentarios en el código

Busca `<!-- REEMPLAZAR:` en los componentes para encontrar exactamente dónde va cada logo.
