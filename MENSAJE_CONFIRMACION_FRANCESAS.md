# 📱 Mensaje de Confirmación para las Francesas

## Versión en Inglés/Francés:

```
Hello! 🌟

Your payment has been confirmed! ✅

**TONIGHT'S TOUR - IMPORTANT:**
📍 Meeting Point: Plaza Apacheta (center of San Pedro)
⏰ Time: 20:50 (8:50 PM) - Please be on time!
📅 Date: Tonight, November 24

**What to bring:**
• WARM CLOTHES (jacket, gloves, hat) - it gets very cold!
• Comfortable shoes
• Camera if you want photos
• Water

**Location Plaza Apacheta:**
It's the main plaza in the center
Address: Tocopilla esquina Domingo Atienza
Google Maps: https://maps.google.com/?q=-22.909722,-68.199722

I'll pick you up there at 20:50 to go to the tour location.

Any questions? Reply here!
See you tonight! 🌌

Vicente
Atacama Dark Sky
```

## Versión con un poco de Francés:

```
Bonjour! 🌟

Votre paiement est confirmé! ✅
Your payment is confirmed!

**CE SOIR / TONIGHT - IMPORTANT:**
📍 Point de rencontre / Meeting: Plaza Apacheta
⏰ Heure / Time: 20:50 (8:50 PM)
📅 Date: Ce soir / Tonight - 24 November

**À apporter / What to bring:**
• VÊTEMENTS CHAUDS / WARM CLOTHES
  (veste, gants, bonnet / jacket, gloves, hat)
• Chaussures confortables / Comfortable shoes
• Appareil photo / Camera
• Eau / Water

**Où est Plaza Apacheta?**
Centre de San Pedro de Atacama
Adresse: Tocopilla esquina Domingo Atienza
Google Maps: https://maps.google.com/?q=-22.909722,-68.199722

Je vous retrouve là-bas à 20:50!
I'll meet you there at 20:50!

Questions? Répondez ici / Reply here!
À ce soir! See you tonight! 🌌

Vicente
Atacama Dark Sky
```

## Información para Vicente:

### Resumen de la situación:
1. ✅ Las francesas pagaron exitosamente
2. ❌ No recibieron email de confirmación (revisar spam o problema con webhook)
3. ✅ Tour confirmado para HOY 24 de noviembre
4. 📍 Punto de encuentro: Plaza Apacheta a las 20:50

### Checklist para esta noche:
- [ ] Confirmar número exacto de personas (¿3?)
- [ ] Verificar si tienen los nombres de todas las participantes
- [ ] Recordarles que traigan ropa MUY abrigada
- [ ] Confirmar si necesitan recogida desde hotel después o van directo a Plaza

### Posibles razones del email no recibido:
1. **Spam/Junk folder** - Pedir que revisen
2. **Email incorrecto** - Verificar dirección
3. **Problema con webhook** - El pago se procesó pero el webhook no se ejecutó

### Para verificar el pago en Mercado Pago:
1. Entrar a tu cuenta de Mercado Pago
2. Buscar el pago de hoy por el monto (probablemente $90,000 si son 3 personas)
3. Verificar el ID del pago
4. El metadata debería tener toda la información

### Si necesitas enviar confirmación manual:
1. Usa el script `send-manual-confirmation.js`
2. Actualiza los datos reales:
   - Email de las clientas
   - Nombres
   - Número de personas
   - Monto pagado
3. Ejecuta con: `node send-manual-confirmation.js`