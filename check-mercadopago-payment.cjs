require('dotenv').config({ path: '.env.local' });
const { MercadoPagoConfig, Payment } = require('mercadopago');

async function checkPayment() {
    try {
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
        });

        const payment = new Payment(client);

        // El booking_id sugiere que el payment ID podría ser similar
        // Vamos a buscar pagos recientes
        console.log('Buscando información del pago de Marc Kreutzmann...\n');

        // Intentar con el ID del booking
        const paymentId = '1763481800260'; // Del booking_id ATK-1763481800260

        try {
            const paymentInfo = await payment.get({ id: paymentId });

            console.log('=== INFORMACIÓN DEL PAGO ===\n');
            console.log('ID de Pago:', paymentInfo.id);
            console.log('Estado:', paymentInfo.status);
            console.log('Monto:', paymentInfo.transaction_amount, 'CLP');
            console.log('Descripción:', paymentInfo.description);
            console.log('\n=== METADATA ===\n');
            console.log(JSON.stringify(paymentInfo.metadata, null, 2));
            console.log('\n=== PAYER INFO ===\n');
            console.log('Nombre:', paymentInfo.payer?.first_name, paymentInfo.payer?.last_name);
            console.log('Email:', paymentInfo.payer?.email);
            console.log('Teléfono:', paymentInfo.payer?.phone?.number);
            console.log('\n=== DETALLES COMPLETOS ===\n');
            console.log(JSON.stringify(paymentInfo, null, 2));
        } catch (error) {
            console.error('Error obteniendo pago:', error.message);
            console.log('\nIntentando buscar en los últimos pagos...');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkPayment();
