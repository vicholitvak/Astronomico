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

        const body = req.body;

        // Accept both field name conventions (backward compat with older pago.html)
        const tourType = body.tourType;
        const persons = body.persons;
        const date = body.date;
        const name = body.name || body.customerName;
        const email = body.email || body.customerEmail;
        const phone = body.phone || body.customerPhone;
        const accommodation = body.accommodation;
        const message = body.message;
        const tourName = body.tourName;
        const participant_names = body.participant_names || body.participantNames;
        const total_participants = body.total_participants;
        const booking_id = body.booking_id;

        // Default prices per person (CLP)
        const DEFAULT_PRICES = { regular: 42000, private: 130000, astrophoto: 120000 };
        const price = body.price || DEFAULT_PRICES[tourType] || DEFAULT_PRICES.private;

        // Validate required fields
        if (!tourType || !persons || !date || !name || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate participant names if provided
        if (participant_names && !Array.isArray(participant_names)) {
            return res.status(400).json({ error: 'participant_names must be an array' });
        }

        // Initialize Mercado Pago client
        const client = new MercadoPagoConfig({
            accessToken: accessToken,
            options: { timeout: 5000 }
        });

        const preference = new Preference(client);

        // Calculate total with Mercado Pago commission (4.64% = 3.9% + IVA)
        const MP_COMMISSION_RATE = 0.0464;
        const basePrice = parseInt(price);
        const personsCount = parseInt(persons);

        // Calculate price with commission so business receives base price net
        const priceWithCommission = Math.round(basePrice / (1 - MP_COMMISSION_RATE));

        let subtotal;
        let quantity;
        let unitPrice;
        let description;

        // All tours now use per-person pricing (including private tour to match GYG)
        subtotal = priceWithCommission * personsCount;
        quantity = personsCount;
        unitPrice = priceWithCommission;
        if (tourType === 'private') {
            description = `Tour Privado VIP para ${personsCount} persona(s) - Fecha: ${date}`;
        } else {
            description = `Tour para ${personsCount} persona(s) - Fecha: ${date}`;
        }

        // Create preference
        const preferenceData = {
            items: [
                {
                    id: tourType,
                    title: tourName || `Tour Astronómico - ${tourType}`,
                    description: description,
                    category_id: 'travels',
                    quantity: quantity,
                    unit_price: unitPrice,
                    currency_id: 'CLP'
                }
            ],
            payer: {
                name: name.split(' ')[0] || name,
                surname: name.split(' ').slice(1).join(' ') || name,
                email: email,
                phone: phone ? {
                    area_code: phone.replace(/\D/g, '').substring(0, 2) || "56",
                    number: phone.replace(/\D/g, '').substring(2) || phone.replace(/\D/g, '')
                } : undefined
            },
            back_urls: {
                success: 'https://atacamadarksky.cl/payment-success.html',
                failure: 'https://atacamadarksky.cl/payment-failure.html',
                pending: 'https://atacamadarksky.cl/payment-pending.html'
            },
            auto_return: 'approved',
            binary_mode: false,  // Allow pending review for international payments instead of straight rejection
            notification_url: 'https://atacamadarksky.cl/api/mercadopago-webhook',
            metadata: {
                tour_type: tourType,
                tour_date: date,
                customer_name: name,
                customer_email: email,
                customer_phone: phone,
                customer_accommodation: accommodation || '',
                customer_message: message || '',
                persons: persons,
                participant_names: participant_names ? JSON.stringify(participant_names) : JSON.stringify([name]),
                total_participants: total_participants || persons,
                // Información de seguridad adicional
                customer_ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || "unknown",
                user_agent: req.headers['user-agent'] || "unknown",
                booking_channel: 'website',
                business_type: 'tourism',
                service_date: date,
                advance_days: Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)),
                booking_id: booking_id || '',
                booking_timestamp: new Date().toISOString()
            },
            statement_descriptor: 'ATACAMA TOUR',  // Máx 11 caracteres, aparece en el estado de cuenta
            external_reference: booking_id || `ATK-${Date.now()}`,
            additional_info: {
                ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || "unknown",
                items: [
                    {
                        id: tourType,
                        title: tourName || `Tour Astronómico - ${tourType}`,
                        description: description,
                        picture_url: "https://atacamadarksky.cl/images/logo.png",
                        category_id: "travels",
                        quantity: quantity,
                        unit_price: unitPrice
                    }
                ],
                payer: {
                    first_name: name.split(' ')[0] || name,
                    last_name: name.split(' ').slice(1).join(' ') || name,
                    phone: phone ? {
                        area_code: phone.replace(/\D/g, '').substring(0, 2) || "56",
                        number: phone.replace(/\D/g, '').substring(2) || phone.replace(/\D/g, '')
                    } : undefined,
                    registration_date: new Date().toISOString()
                }
            },
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
