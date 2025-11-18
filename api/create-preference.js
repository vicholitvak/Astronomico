// Mercado Pago - Create Preference for Checkout
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get Mercado Pago access token from environment variables
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            console.error('MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({
                error: 'Payment system not configured. Please contact support.'
            });
        }

        const { tourType, persons, date, name, email, phone, accommodation, message, tourName, price } = req.body;

        // Validate required fields
        if (!tourType || !persons || !date || !name || !email || !phone || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Initialize Mercado Pago client
        const client = new MercadoPagoConfig({
            accessToken: accessToken,
            options: { timeout: 5000 }
        });

        const preference = new Preference(client);

        // Calculate total with Mercado Pago commission (5.94%)
        const MP_COMMISSION = 0.0594;
        const basePrice = parseInt(price);
        const personsCount = parseInt(persons);

        let subtotal;
        let quantity;
        let unitPrice;
        let description;

        if (tourType === 'private') {
            // Tour privado: precio fijo sin importar personas
            subtotal = basePrice;
            quantity = 1;
            unitPrice = basePrice + Math.ceil(basePrice * MP_COMMISSION);
            description = `Tour Privado VIP para ${personsCount} persona(s) - Fecha: ${date}`;
        } else {
            // Tours regular y astrofoto: precio por persona
            subtotal = basePrice * personsCount;
            quantity = personsCount;
            unitPrice = basePrice + Math.ceil(basePrice * MP_COMMISSION);
            description = `Tour para ${personsCount} persona(s) - Fecha: ${date}`;
        }

        // Create preference
        const preferenceData = {
            items: [
                {
                    id: tourType,
                    title: tourName || `Tour Astronómico - ${tourType}`,
                    description: description,
                    quantity: quantity,
                    unit_price: unitPrice,
                    currency_id: 'CLP'
                }
            ],
            payer: {
                name: name,
                email: email,
                phone: {
                    number: phone
                }
            },
            back_urls: {
                success: 'https://atacamadarksky.cl/payment-success.html',
                failure: 'https://atacamadarksky.cl/payment-failure.html',
                pending: 'https://atacamadarksky.cl/payment-pending.html'
            },
            auto_return: 'approved',
            notification_url: 'https://atacamadarksky.cl/api/mercadopago-webhook',
            metadata: {
                tour_type: tourType,
                tour_date: date,
                customer_name: name,
                customer_email: email,
                customer_phone: phone,
                customer_accommodation: accommodation || '',
                customer_message: message || '',
                persons: persons
            },
            statement_descriptor: 'Atacama Dark Sky Tour',
            external_reference: `ATK-${Date.now()}`,
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        const result = await preference.create({ body: preferenceData });

        console.log('Preference created successfully:', result.id);

        return res.status(200).json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });

    } catch (error) {
        console.error('Error creating Mercado Pago preference:', error);

        return res.status(500).json({
            error: 'Failed to create payment preference',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
