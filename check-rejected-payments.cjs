require('dotenv').config({ path: '.env.local' });
const { MercadoPagoConfig, Payment } = require('mercadopago');

async function checkRejectedPayments() {
    try {
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
        });

        const payment = new Payment(client);

        console.log('🔍 Buscando pagos rechazados del 21 de noviembre de 2025...\n');

        // Mercado Pago API search - buscar pagos con diferentes estados
        const searchParams = {
            sort: 'date_created',
            criteria: 'desc',
            begin_date: '2025-11-21T00:00:00.000Z',
            end_date: '2025-11-22T00:00:00.000Z'
        };

        console.log('Parámetros de búsqueda:', searchParams);

        const searchResult = await payment.search({
            options: searchParams
        });

        console.log('\n📊 Resultados encontrados:', searchResult.results?.length || 0);

        if (searchResult.results && searchResult.results.length > 0) {
            console.log('\n=== TODOS LOS PAGOS DEL 21 DE NOVIEMBRE ===\n');

            for (const pay of searchResult.results) {
                console.log('─────────────────────────────────────────');
                console.log('ID de Pago:', pay.id);
                console.log('Estado:', pay.status);
                console.log('Estado Detallado:', pay.status_detail);
                console.log('Monto:', pay.transaction_amount, 'CLP');
                console.log('Fecha:', new Date(pay.date_created).toLocaleString('es-CL'));
                console.log('Descripción:', pay.description);
                console.log('Email del pagador:', pay.payer?.email);
                console.log('Nombre del pagador:', pay.payer?.first_name, pay.payer?.last_name);

                if (pay.metadata) {
                    console.log('\nMetadata:');
                    console.log('  - Tour:', pay.metadata.tour_type);
                    console.log('  - Fecha del tour:', pay.metadata.tour_date);
                    console.log('  - Personas:', pay.metadata.persons);
                    console.log('  - Cliente:', pay.metadata.customer_name);
                }

                if (pay.status === 'rejected') {
                    console.log('\n⚠️ PAGO RECHAZADO');
                    console.log('Razón del rechazo:', pay.status_detail);
                }

                console.log('─────────────────────────────────────────\n');
            }

            // Filtrar solo los rechazados
            const rejectedPayments = searchResult.results.filter(p => p.status === 'rejected');

            if (rejectedPayments.length > 0) {
                console.log('\n\n🚨 PAGOS RECHAZADOS DETALLADOS:\n');

                for (const rejected of rejectedPayments) {
                    console.log('═══════════════════════════════════════════');
                    console.log('ID:', rejected.id);
                    console.log('Monto:', rejected.transaction_amount, 'CLP');
                    console.log('Fecha:', new Date(rejected.date_created).toLocaleString('es-CL'));
                    console.log('Estado:', rejected.status);
                    console.log('Detalle:', rejected.status_detail);
                    console.log('\nCliente:');
                    console.log('  Nombre:', rejected.payer?.first_name, rejected.payer?.last_name);
                    console.log('  Email:', rejected.payer?.email);
                    console.log('  Teléfono:', rejected.payer?.phone?.number);

                    console.log('\nMétodo de pago:');
                    console.log('  Tipo:', rejected.payment_type_id);
                    console.log('  Método:', rejected.payment_method_id);

                    if (rejected.metadata) {
                        console.log('\nDetalles de la reserva:');
                        console.log('  Tour:', rejected.metadata.tour_type);
                        console.log('  Fecha tour:', rejected.metadata.tour_date);
                        console.log('  Personas:', rejected.metadata.persons);
                    }

                    console.log('\nInformación técnica:');
                    console.log('  External reference:', rejected.external_reference);
                    console.log('  Operation type:', rejected.operation_type);

                    console.log('═══════════════════════════════════════════\n');
                }
            } else {
                console.log('\n✅ No se encontraron pagos rechazados en esta fecha');
            }
        } else {
            console.log('\n⚠️ No se encontraron pagos en la fecha especificada');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.cause) {
            console.error('Causa:', error.cause);
        }
    }
}

checkRejectedPayments();
