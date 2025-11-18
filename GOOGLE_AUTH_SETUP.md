# Configuración de Google OAuth para Portal Admin

## 📋 Guía Paso a Paso

### 1. Crear Credenciales en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Navega a "APIs y servicios" > "Credenciales"
4. Click en "Crear credenciales" > "ID de cliente de OAuth"
5. Tipo de aplicación: **Aplicación web**

### 2. Configurar Orígenes Autorizados

En "Orígenes de JavaScript autorizados", agrega:
```
https://atacamadarksky.cl
https://www.atacamadarksky.cl
https://astronomico.vercel.app
```

### 3. Configurar URIs de Redirección

En "URIs de redireccionamiento autorizados", agrega:
```
https://atacamadarksky.cl/api/auth/callback/google
https://www.atacamadarksky.cl/api/auth/callback/google
https://astronomico.vercel.app/api/auth/callback/google
```

### 4. Obtener Credenciales

Después de crear, obtendrás:
- **Client ID** (algo como: `123456789-abc123.apps.googleusercontent.com`)
- **Client Secret** (algo como: `GOCSPX-abc123xyz`)

### 5. Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel > Settings > Environment Variables

Agrega las siguientes variables:

```bash
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_SECRET=genera_un_string_aleatorio_largo
NEXTAUTH_URL=https://atacamadarksky.cl
```

Para generar `NEXTAUTH_SECRET`, puedes usar:
```bash
openssl rand -base64 32
```

O simplemente usar cualquier string largo y aleatorio (mínimo 32 caracteres).

### 6. También Agregar en .env.local (para desarrollo)

Crea/actualiza tu archivo `.env.local`:

```bash
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_SECRET=genera_un_string_aleatorio_largo
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=vicente.litvak@gmail.com
```

### 7. Desplegar Cambios

Después de configurar las variables de entorno en Vercel:

```bash
git add .
git commit -m "Add Google OAuth authentication"
git push
```

Vercel automáticamente redesplegarádespués del push.

## 🔐 Seguridad

- **Solo tu email** (definido en `ADMIN_EMAIL`) podrá acceder al portal
- La sesión dura **30 días**
- Los tokens se guardan de forma segura con JWT
- Google maneja toda la autenticación

## 🌐 URLs Importantes

- **Login**: https://atacamadarksky.cl/admin-login.html
- **Portal Admin**: https://atacamadarksky.cl/admin (redirige a login si no estás autenticado)

## ✅ Verificar que Funciona

1. Ve a https://atacamadarksky.cl/admin
2. Debería redirigirte a `/admin-login.html`
3. Click en "Continuar con Google"
4. Inicia sesión con tu cuenta de Google autorizada
5. Deberías ser redirigido al portal admin

## 🚨 Troubleshooting

### Error: "redirect_uri_mismatch"
Verifica que las URIs de redirección en Google Cloud coincidan exactamente con las configuradas.

### Error: "Access Denied"
Tu email no coincide con `ADMIN_EMAIL` en las variables de entorno.

### No redirecciona después de login
Verifica que `NEXTAUTH_URL` esté configurado correctamente.

## 📝 Notas

- La autenticación funciona tanto en producción como en desarrollo
- Para desarrollo local, usa `http://localhost:3000` en las configuraciones
- Puedes cambiar el email autorizado modificando `ADMIN_EMAIL` en Vercel
