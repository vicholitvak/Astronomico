# Tours Astronómicos Atacama 🌟

Sitio web profesional para ofrecer tours astronómicos en San Pedro de Atacama, Chile. Diseño responsivo, moderno y optimizado para conversión de visitantes a reservas.

## 🚀 Características Principales

- **Diseño Responsivo**: Adaptado perfectamente para móviles, tablets y desktop
- **Tema Astronómico**: Colores oscuros con acentos dorados evocando el cielo nocturno
- **SEO Optimizado**: Meta tags, estructura semántica y contenido optimizado
- **Formulario de Reservas**: Sistema de contacto integrado con validación
- **Multi-idioma**: Soporte básico español/inglés
- **Animaciones Suaves**: Efectos visuales que mejoran la experiencia
- **Integración WhatsApp**: Botón flotante para consultas rápidas
- **Google Maps**: Mapa integrado con ubicación en San Pedro de Atacama

## 📁 Estructura del Proyecto

```
astro-page/
├── index.html          # Página principal
├── styles.css          # Estilos CSS principales
├── script.js           # Funcionalidad JavaScript
├── README.md           # Este archivo
├── favicon.ico         # Icono del sitio (opcional)
├── manifest.json       # Configuración PWA (opcional)
└── netlify.toml        # Configuración para Netlify (opcional)
```

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Flexbox, Grid, Variables CSS, Media Queries
- **JavaScript Vanilla**: Sin dependencias externas
- **Font Awesome**: Iconos profesionales
- **Google Fonts**: Tipografía Roboto
- **Google Maps**: Mapa integrado
- **Formspree**: Para procesamiento de formularios (configurable)

## 🎨 Paleta de Colores

```css
--primary-color: #FFD700    /* Dorado estrella */
--secondary-color: #4A90E2  /* Azul espacial */
--accent-color: #FF6B6B     /* Rojo Marte */
--bg-primary: #0a0a0a       /* Negro espacio profundo */
--bg-secondary: #1a1a2e     /* Azul noche oscuro */
--bg-tertiary: #16213e      /* Azul medianoche */
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px
- **Large Desktop**: > 1400px

## ⚙️ Configuración

### 1. Configurar Formulario de Contacto

Edita el archivo `index.html` línea 487:

```html
<form id="booking-form" class="booking-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

Reemplaza `YOUR_FORM_ID` con tu ID de Formspree o configura otro servicio de formularios.

### 2. Personalizar Información de Contacto

Actualiza en `index.html`:
- **Teléfono/WhatsApp**: Líneas 685-686, 702-703
- **Email**: Línea 690-691
- **Dirección**: Línea 680-681
- **Google Maps**: Línea 712 (coordenadas del iframe)

### 3. Configurar Redes Sociales

Actualiza los enlaces en:
- **Header**: No incluido (agregar si necesario)
- **Sección Contacto**: Líneas 705-708
- **Footer**: Líneas 790-793

### 4. Personalizar Tours y Precios

Edita la sección de tours (líneas 279-445) para actualizar:
- Nombres de tours
- Precios
- Descripciones
- Imágenes (URLs de Unsplash incluidas)
- Características incluidas

## 🚀 Despliegue

### Opción 1: Netlify (Recomendado)

1. Sube todos los archivos a un repositorio GitHub
2. Conecta tu repositorio a [Netlify](https://netlify.com)
3. La configuración en `netlify.toml` se aplicará automáticamente
4. Tu sitio estará disponible en una URL personalizable

### Opción 2: GitHub Pages

1. Sube archivos a un repositorio GitHub
2. Ve a Settings > Pages
3. Selecciona "Deploy from branch" > "main"
4. Tu sitio estará en `https://tu-usuario.github.io/nombre-repo`

### Opción 3: Servidor Web Tradicional

1. Sube todos los archivos via FTP/SFTP
2. Asegúrate de que `index.html` esté en la raíz
3. Configura redirects si es necesario

### Opción 4: Vercel

1. Instala Vercel CLI: `npm install -g vercel`
2. En la carpeta del proyecto: `vercel`
3. Sigue las instrucciones de configuración

## 🔧 Optimizaciones Recomendadas

### Imágenes
- Comprime imágenes a < 100KB
- Usa formatos WebP para mejor compresión
- Implementa lazy loading (ya incluido)

### Performance
- Minifica CSS y JS para producción
- Habilita compresión Gzip en el servidor
- Utiliza un CDN para recursos estáticos

### SEO
- Actualiza meta descriptions por sección
- Agrega structured data (JSON-LD)
- Configura Google Analytics
- Registra en Google Search Console

## 📋 Lista de Verificación Pre-Lanzamiento

### Contenido
- [ ] Actualizar información de contacto real
- [ ] Configurar formulario de reservas
- [ ] Revisar precios y tours actuales
- [ ] Verificar enlaces de redes sociales
- [ ] Actualizar coordenadas del mapa

### Técnico
- [ ] Probar formulario de contacto
- [ ] Verificar responsividad en dispositivos reales
- [ ] Testear velocidad de carga
- [ ] Validar HTML/CSS
- [ ] Probar en diferentes navegadores

### Legal
- [ ] Crear página de términos y condiciones
- [ ] Crear política de privacidad
- [ ] Configurar cookies policy si es necesario
- [ ] Verificar compliance GDPR (si aplica)

## 🛠️ Personalización Avanzada

### Agregar Más Idiomas

Edita `script.js` líneas 80-105 para agregar más traducciones:

```javascript
const translations = {
    es: { /* contenido español */ },
    en: { /* contenido inglés */ },
    pt: { /* contenido portugués */ },
    // Agregar más idiomas...
};
```

### Integrar Sistema de Pagos

Para agregar pagos en línea:

1. **Stripe**: Agrega Stripe Elements al formulario
2. **PayPal**: Integra botones PayPal
3. **Mercado Pago**: Para mercado latinoamericano

### Agregar Blog/Noticias

Estructura recomendada:
```
blog/
├── index.html          # Lista de artículos
├── posts/
│   ├── post1.html
│   └── post2.html
└── assets/
    └── images/
```

### Analytics y Tracking

Agrega antes del `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 📞 Soporte

Para soporte técnico o personalizaciones adicionales:

- Revisa la documentación en comentarios del código
- Consulta recursos de CSS Grid y Flexbox
- Utiliza las herramientas de desarrollo del navegador

## 📄 Licencia

Este proyecto está diseñado para uso comercial. Puedes modificar y usar libremente para tu negocio de tours astronómicos.

## 🌟 Créditos

- **Imágenes**: Unsplash (URLs incluidas en código)
- **Iconos**: Font Awesome
- **Fuentes**: Google Fonts (Roboto)
- **Inspiración**: Diseño basado en la belleza del cielo nocturno de Atacama

---

**¡Listo para conquistar las estrellas!** 🚀✨

Para cualquier duda sobre implementación, revisa los comentarios detallados en cada archivo del código fuente.