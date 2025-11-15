/**
 * Stripe Checkout Session Creation
 * Creates a payment session for tour bookings with international support
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      tourType,
      persons,
      date,
      time,
      name,
      email,
      phone,
      accommodation,
      message
    } = req.body;

    // Validate required fields
    if (!tourType || !persons || !date || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Define tour products with prices
    const tourProducts = {
      regular: {
        name: 'Tour Astronómico Regular',
        description: 'Observación con telescopio Unistellar eVscope, puntero láser, cóctel bajo las estrellas',
        price: 30000, // CLP
        duration: '2.5 horas',
        image: 'https://www.atacamadarksky.cl/images/regular3-2.jpg'
      },
      astrophoto: {
        name: 'Tour de Astrofotografía Especializado',
        description: 'Técnicas profesionales de astrofotografía, locaciones secretas, edición en vivo',
        price: 120000, // CLP
        duration: '5 horas',
        image: 'https://www.atacamadarksky.cl/images/fotografico.jpg'
      },
      private: {
        name: 'Tour Privado VIP',
        description: 'Experiencia exclusiva personalizada, guía astronómico privado, ubicación privilegiada',
        price: 200000, // CLP
        duration: '3 horas',
        image: 'https://www.atacamadarksky.cl/images/privado1.jpg'
      }
    };

    const selectedTour = tourProducts[tourType];

    if (!selectedTour) {
      return res.status(400).json({ error: 'Invalid tour type' });
    }

    // Calculate total price
    const unitPrice = selectedTour.price;
    const totalPrice = unitPrice * parseInt(persons);

    // Convert CLP to cents for Stripe (Stripe requires smallest currency unit)
    const priceInCents = totalPrice;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'clp',
            product_data: {
              name: selectedTour.name,
              description: `${selectedTour.description}\n\nFecha: ${date}\nHora: ${time || 'Por confirmar'}\nDuración: ${selectedTour.duration}`,
              images: [selectedTour.image],
              metadata: {
                tourType,
                date,
                time: time || 'flexible',
                duration: selectedTour.duration
              }
            },
            unit_amount: priceInCents,
          },
          quantity: parseInt(persons),
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VERCEL_URL || 'https://www.atacamadarksky.cl'}/confirmacion.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VERCEL_URL || 'https://www.atacamadarksky.cl'}/index.html#reservas`,
      customer_email: email,
      metadata: {
        tourType,
        persons: persons.toString(),
        date,
        time: time || 'flexible',
        customerName: name,
        customerPhone: phone || '',
        customerAccommodation: accommodation || '',
        customerMessage: message || '',
      },
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['CL', 'AR', 'BR', 'US', 'CA', 'MX', 'PE', 'BO', 'EC', 'CO', 'UY', 'PY', 'VE', 'GB', 'FR', 'DE', 'ES', 'IT'],
      },
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      tourType,
      persons,
      totalPrice: `$${totalPrice.toLocaleString('es-CL')} CLP`,
      customerEmail: email
    });

    // Return session ID to frontend
    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Error creating checkout session',
      details: error.message
    });
  }
}
