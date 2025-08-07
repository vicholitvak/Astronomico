// Test endpoint for email sending only
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🌟 Atacama NightSky 🌟</h1>
      </div>
      
      <div style="padding: 40px; background: #f9f9f9;">
        <h2 style="color: #333;">¡Hola ${name}!</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; line-height: 1.6;">
            Este es un <strong>email de prueba</strong> para confirmar que nuestro sistema de notificaciones está funcionando correctamente.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Si recibes este email, significa que podrás recibir confirmaciones de reserva automáticas.
          </p>
        </div>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
          <p style="color: #2e7d32; margin: 0;">
            ✅ Sistema de emails funcionando correctamente
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://atacamadarksky.cl" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px;">
            Visitar Sitio Web
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #333; color: #999; font-size: 12px;">
        <p>Atacama NightSky - Tours Astronómicos en San Pedro de Atacama</p>
        <p>📱 +56 9 5055 8761 | 📧 info@atacamadarksky.cl</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Atacama NightSky <onboarding@resend.dev>',
        to: [email],
        subject: '🔬 Test Email - Atacama NightSky',
        html: emailHtml
      })
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email enviado correctamente',
        data 
      });
    } else {
      return res.status(400).json({ 
        error: 'Error enviando email',
        details: data 
      });
    }
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ 
      error: 'Error del servidor',
      message: error.message 
    });
  }
}