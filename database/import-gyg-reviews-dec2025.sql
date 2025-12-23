-- ============================================================================
-- IMPORTAR REVIEWS DE GETYOURGUIDE - DICIEMBRE 2025
-- ============================================================================
-- Este script importa los 3 reviews recibidos en GetYourGuide
-- Ejecutar con: psql $DATABASE_URL < database/import-gyg-reviews-dec2025.sql
-- ============================================================================

-- Primero agregar italiano a los idiomas permitidos
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_language_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_language_check
    CHECK (language IN ('es', 'en', 'pt', 'fr', 'de', 'it'));

-- Opcional: Remover la foreign key de booking_id para reviews importados
-- (Solo si los bookings no existen en la DB)
-- ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_review_booking;

-- Primero verificar si los bookings existen
DO $$
DECLARE
    booking_exists_1 BOOLEAN;
    booking_exists_2 BOOLEAN;
    booking_exists_3 BOOLEAN;
    booking_id_1 VARCHAR;
    booking_id_2 VARCHAR;
    booking_id_3 VARCHAR;
BEGIN
    -- Buscar booking del review italiano (GYGBLHYG8H6A)
    SELECT EXISTS(SELECT 1 FROM bookings WHERE gyg_reference LIKE '%BLHYG8H6A%') INTO booking_exists_1;

    -- Buscar booking de Marianne (GYGZGZ887LLY)
    SELECT EXISTS(SELECT 1 FROM bookings WHERE gyg_reference LIKE '%ZGZ887LLY%') INTO booking_exists_2;

    -- Buscar booking de James (no tenemos código GYG visible)
    SELECT EXISTS(SELECT 1 FROM bookings WHERE date = '2025-12-20' AND name ILIKE '%James%') INTO booking_exists_3;

    RAISE NOTICE 'Booking Review 1 (Italiano): %', booking_exists_1;
    RAISE NOTICE 'Booking Review 2 (Marianne): %', booking_exists_2;
    RAISE NOTICE 'Booking Review 3 (James): %', booking_exists_3;
END $$;

-- ============================================================================
-- OPCION A: Si los bookings YA EXISTEN en la DB (vía API de GYG)
-- ============================================================================
-- Primero obtenemos los booking_ids reales

-- Review 1: Italiano - Tour Regular - 19 Dic 2025
INSERT INTO reviews (
    review_id,
    booking_id,
    overall_rating,
    guide_rating,
    equipment_rating,
    location_rating,
    value_rating,
    title,
    comment,
    reviewer_name,
    reviewer_email,
    reviewer_country,
    language,
    tour_type,
    tour_date,
    status,
    is_featured,
    verified_purchase
)
SELECT
    'REV-GYG-2025DEC-001',
    booking_id,
    5, -- overall
    5, -- guide (Vicente fue muy elogiado)
    5, -- equipment (mencionó telescopios)
    5, -- location (cielo estrellado)
    5, -- value
    'Serata astronomica indimenticabile!',
    'Ho partecipato alla "Serata astronomica" di Vicente: un''esperienza indimenticabile, davvero! Un cielo stellato mai visto prima! Vicente c''è l''ha descritto in maniera dettagliata e divertente, ma allo stesso tempo con rigorosa competenza: nozioni come nebulosa, stella, costellazione, universo lette nei libri di scuola, sono state riproposte in modo chiaro ed efficace. La teoria è stata poi supportata dalla possibilità di vedere realmente, con l''aiuto di due telescopi, una nebulosa, Giove, Saturno, le stelle! Che emozione! Sono felice di lasciare San Pedro con il ricordo meraviglioso di questa serata astronomica sotto il cielo magico del deserto, grazie Vicente! Raccomando questa esperienza soprattutto ai giovani e alle famiglie con bambini, perché quello che si impara con Vicente, non lo si impara nei banchi di scuola!',
    'Viaggiatore italiano',
    'gyg-review-1@getyourguide.com',
    'Italia',
    'it', -- Italiano (ahora está permitido)
    'regular',
    '2025-12-19',
    'approved',
    true, -- Es un review excelente, destacar
    true
FROM bookings
WHERE gyg_reference LIKE '%BLHYG8H6A%'
LIMIT 1
ON CONFLICT (review_id) DO NOTHING;

-- Agregar respuesta del dueño
INSERT INTO review_responses (review_id, response_text, responder_name)
VALUES (
    'REV-GYG-2025DEC-001',
    '¡Muchísimas gracias por estas palabras tan bonitas! Me emociona saber que el cielo de Atacama dejó una huella en tu corazón. Para mí, cada noche bajo las estrellas es una oportunidad de compartir la maravilla del universo, y comentarios como el tuyo me confirman que vale la pena. Espero que lleves contigo ese recuerdo del desierto y que algún día vuelvas a visitarnos. ¡Un abrazo desde San Pedro!',
    'Vicente'
)
ON CONFLICT DO NOTHING;

-- Review 2: Marianne - Tour Privado - 20 Dic 2025
INSERT INTO reviews (
    review_id,
    booking_id,
    overall_rating,
    guide_rating,
    equipment_rating,
    location_rating,
    value_rating,
    title,
    comment,
    reviewer_name,
    reviewer_email,
    reviewer_country,
    language,
    tour_type,
    tour_date,
    status,
    is_featured,
    verified_purchase
)
SELECT
    'REV-GYG-2025DEC-002',
    booking_id,
    5,
    5,
    5,
    5,
    5,
    'An unforgettable stargazing experience',
    'An unforgettable stargazing experience with Vicente. Seeing the southern hemisphere sky meant a brighter Milky Way and even two visible nebulas—truly awe-inspiring. Vicente is an exceptional guide: deeply knowledgeable about astronomy and physics, and gifted at explaining exactly what you''re seeing with your own eyes in a way that makes the science feel alive and accessible. He created a warm, thoughtful atmosphere with comfy chairs, cozy blankets, excellent cheese plates, and wine served in beautiful locally spun ceramic mugs. Beyond the stars, he generously shared insights into Chilean culture and was happy to banter about philosophy, which made the evening feel personal and human, not scripted. The most epic part: he sent us stunning long-exposure photos of the night sky and of us under it—forever souvenirs from a once-in-a-lifetime night. A great human and a great guide. Skip the crowds and go with Vicente.',
    'Marianne',
    'gyg-review-2@getyourguide.com',
    'Estados Unidos',
    'en',
    'private',
    '2025-12-20',
    'approved',
    true,
    true
FROM bookings
WHERE gyg_reference LIKE '%ZGZ887LLY%'
LIMIT 1
ON CONFLICT (review_id) DO NOTHING;

-- Agregar respuesta del dueño
INSERT INTO review_responses (review_id, response_text, responder_name)
VALUES (
    'REV-GYG-2025DEC-002',
    'Thank you for these kind words! What a joyful, laughter-filled night. You were right about The Dark Forest—thanks for getting me back to reading. Jeff, your thoughtful insights made the night richer. Marianne: I owe you a laser pointer! You crossed the 4-question threshold. Come back in our winter—the center of the storm will be waiting, with the laser. Un gran abrazo universal, Vincent Van G.',
    'Vicente'
)
ON CONFLICT DO NOTHING;

-- Review 3: James - Tour Regular/Privado - 20 Dic 2025
-- Nota: Sin código GYG visible, buscar por fecha y nombre similar
INSERT INTO reviews (
    review_id,
    booking_id,
    overall_rating,
    guide_rating,
    equipment_rating,
    location_rating,
    value_rating,
    title,
    comment,
    reviewer_name,
    reviewer_email,
    reviewer_country,
    language,
    tour_type,
    tour_date,
    status,
    is_featured,
    verified_purchase
)
SELECT
    'REV-GYG-2025DEC-003',
    booking_id,
    5,
    5,
    5,
    5,
    5,
    'Fabulous host with passion for astronomy',
    'Vincente was a fabulous host his knowledge and passion for astronomy were obvious in his presentation where he seamlessly switched between Spanish and English for our bilingual group. After a minor mishap Vincente went above and beyond to set things right and ensure we had an incredible experience. The photos shared after were a lovely way to commemorate the experience. Thanks Vincente!',
    'James',
    'gyg-review-3@getyourguide.com',
    'Reino Unido',
    'en',
    'regular',
    '2025-12-20',
    'approved',
    true,
    true
FROM bookings
WHERE date = '2025-12-20'
  AND (name ILIKE '%James%' OR source = 'gyg')
LIMIT 1
ON CONFLICT (review_id) DO NOTHING;

-- Agregar respuesta del dueño (si la tienes)
-- INSERT INTO review_responses...

-- ============================================================================
-- OPCION B: Si los bookings NO EXISTEN (crear bookings placeholder)
-- ============================================================================
-- Descomentar si los bookings no existen en la DB

/*
-- Crear booking placeholder para review italiano
INSERT INTO bookings (
    booking_id, date, time, name, email, phone, persons,
    tour_type, status, source, payment_method, payment_status,
    message, gyg_reference
)
VALUES (
    'GYG-IMPORT-DEC19-001',
    '2025-12-19',
    '21:00',
    'Viaggiatore italiano',
    'gyg-import@getyourguide.com',
    '',
    1,
    'regular',
    'completed',
    'gyg',
    'getyourguide',
    'paid',
    'Booking importado para review de GYG',
    'GYGBLHYG8H6A'
)
ON CONFLICT (booking_id) DO NOTHING;

-- Crear booking placeholder para Marianne
INSERT INTO bookings (
    booking_id, date, time, name, email, phone, persons,
    tour_type, status, source, payment_method, payment_status,
    message, gyg_reference
)
VALUES (
    'GYG-IMPORT-DEC20-001',
    '2025-12-20',
    '21:00',
    'Marianne',
    'gyg-import@getyourguide.com',
    '',
    2,
    'private',
    'completed',
    'gyg',
    'getyourguide',
    'paid',
    'Booking importado para review de GYG',
    'GYGZGZ887LLY'
)
ON CONFLICT (booking_id) DO NOTHING;

-- Crear booking placeholder para James
INSERT INTO bookings (
    booking_id, date, time, name, email, phone, persons,
    tour_type, status, source, payment_method, payment_status,
    message, gyg_reference
)
VALUES (
    'GYG-IMPORT-DEC20-002',
    '2025-12-20',
    '21:00',
    'James',
    'gyg-import@getyourguide.com',
    '',
    1,
    'regular',
    'completed',
    'gyg',
    'getyourguide',
    'paid',
    'Booking importado para review de GYG',
    'GYG-JAMES-DEC20'
)
ON CONFLICT (booking_id) DO NOTHING;
*/

-- ============================================================================
-- VERIFICACION
-- ============================================================================
SELECT
    'Reviews importados:' as info,
    COUNT(*) as total
FROM reviews
WHERE review_id LIKE 'REV-GYG-2025DEC%';

SELECT
    review_id,
    reviewer_name,
    reviewer_country,
    overall_rating,
    LEFT(comment, 50) || '...' as comment_preview,
    tour_date,
    status,
    is_featured
FROM reviews
WHERE review_id LIKE 'REV-GYG-2025DEC%'
ORDER BY tour_date;

-- Ver cómo queda el schema
SELECT
    'Schema JSON-LD incluirá ' || COUNT(*) || ' reviews aprobados' as info
FROM reviews
WHERE status = 'approved';
