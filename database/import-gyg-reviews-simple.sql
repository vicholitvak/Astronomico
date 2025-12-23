-- ============================================================================
-- IMPORTAR REVIEWS DE GETYOURGUIDE - DICIEMBRE 2025
-- ============================================================================
-- Ejecutar: psql $DATABASE_URL < database/import-gyg-reviews-simple.sql
-- ============================================================================

-- 1. Agregar campo source si no existe (para indicar origen del review)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'reviews' AND column_name = 'source') THEN
        ALTER TABLE reviews ADD COLUMN source VARCHAR(50) DEFAULT 'direct';
    END IF;
END $$;

-- 2. Agregar italiano a los idiomas permitidos
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_language_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_language_check
    CHECK (language IN ('es', 'en', 'pt', 'fr', 'de', 'it'));

-- 3. Crear bookings placeholder para los reviews de GYG
INSERT INTO bookings (
    booking_id, date, time, name, email, phone, persons,
    tour_type, status, source, payment_method, payment_status,
    message, gyg_reference, created_at
)
VALUES
    ('GYG-REV-2025-001', '2025-12-19', '21:00', 'Visitante GYG', 'gyg@getyourguide.com', '', 1, 'regular', 'completed', 'gyg', 'getyourguide', 'paid', 'Booking para review importado', 'GYGBLHYG8H6A', '2025-12-19 21:00:00'),
    ('GYG-REV-2025-002', '2025-12-20', '20:00', 'Marianne', 'gyg@getyourguide.com', '', 2, 'private', 'completed', 'gyg', 'getyourguide', 'paid', 'Booking para review importado', 'GYGZGZ887LLY', '2025-12-20 20:00:00'),
    ('GYG-REV-2025-003', '2025-12-20', '21:00', 'James', 'gyg@getyourguide.com', '', 1, 'regular', 'completed', 'gyg', 'getyourguide', 'paid', 'Booking para review importado', 'GYG-JAMES-UK', '2025-12-20 21:00:00')
ON CONFLICT (booking_id) DO NOTHING;

-- 4. Insertar los 3 reviews de GetYourGuide
INSERT INTO reviews (
    review_id, booking_id, overall_rating, guide_rating, equipment_rating, location_rating, value_rating,
    title, comment, reviewer_name, reviewer_email, reviewer_country, language, tour_type, tour_date,
    status, is_featured, verified_purchase, source, created_at
)
VALUES
-- Review 1: Italiano - Tour Regular - 19 Dic 2025
(
    'REV-GYG-2025-001',
    'GYG-REV-2025-001',
    5, 5, 5, 5, 5,
    'Serata astronomica indimenticabile!',
    'Ho partecipato alla "Serata astronomica" di Vicente: un''esperienza indimenticabile, davvero! Un cielo stellato mai visto prima! Vicente c''è l''ha descritto in maniera dettagliata e divertente, ma allo stesso tempo con rigorosa competenza: nozioni come nebulosa, stella, costellazione, universo lette nei libri di scuola, sono state riproposte in modo chiaro ed efficace. La teoria è stata poi supportata dalla possibilità di vedere realmente, con l''aiuto di due telescopi, una nebulosa, Giove, Saturno, le stelle! Che emozione! Sono felice di lasciare San Pedro con il ricordo meraviglioso di questa serata astronomica sotto il cielo magico del deserto, grazie Vicente! Raccomando questa esperienza soprattutto ai giovani e alle famiglie con bambini, perché quello che si impara con Vicente, non lo si impara nei banchi di scuola!',
    'Viaggiatore italiano',
    'gyg-review@getyourguide.com',
    'Italia',
    'it',
    'regular',
    '2025-12-19',
    'approved',
    true,
    true,
    'getyourguide',
    '2025-12-22 10:00:00'
),
-- Review 2: Marianne - Tour Privado - 20 Dic 2025
(
    'REV-GYG-2025-002',
    'GYG-REV-2025-002',
    5, 5, 5, 5, 5,
    'An unforgettable stargazing experience',
    'An unforgettable stargazing experience with Vicente. Seeing the southern hemisphere sky meant a brighter Milky Way and even two visible nebulas—truly awe-inspiring. Vicente is an exceptional guide: deeply knowledgeable about astronomy and physics, and gifted at explaining exactly what you''re seeing with your own eyes in a way that makes the science feel alive and accessible. He created a warm, thoughtful atmosphere with comfy chairs, cozy blankets, excellent cheese plates, and wine served in beautiful locally spun ceramic mugs. Beyond the stars, he generously shared insights into Chilean culture and was happy to banter about philosophy, which made the evening feel personal and human, not scripted. The most epic part: he sent us stunning long-exposure photos of the night sky and of us under it—forever souvenirs from a once-in-a-lifetime night. A great human and a great guide. Skip the crowds and go with Vicente.',
    'Marianne',
    'gyg-review@getyourguide.com',
    'Estados Unidos',
    'en',
    'private',
    '2025-12-20',
    'approved',
    true,
    true,
    'getyourguide',
    '2025-12-22 10:00:00'
),
-- Review 3: James - Tour Regular - 20 Dic 2025
(
    'REV-GYG-2025-003',
    'GYG-REV-2025-003',
    5, 5, 5, 5, 5,
    'Fabulous host with passion for astronomy',
    'Vincente was a fabulous host his knowledge and passion for astronomy were obvious in his presentation where he seamlessly switched between Spanish and English for our bilingual group. After a minor mishap Vincente went above and beyond to set things right and ensure we had an incredible experience. The photos shared after were a lovely way to commemorate the experience. Thanks Vincente!',
    'James',
    'gyg-review@getyourguide.com',
    'Reino Unido',
    'en',
    'regular',
    '2025-12-20',
    'approved',
    true,
    true,
    'getyourguide',
    '2025-12-20 12:00:00'
)
ON CONFLICT (review_id) DO UPDATE SET
    title = EXCLUDED.title,
    comment = EXCLUDED.comment,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    source = EXCLUDED.source;

-- 5. Agregar las respuestas del dueño (Vicente)
INSERT INTO review_responses (review_id, response_text, responder_name, created_at)
VALUES
(
    'REV-GYG-2025-001',
    '¡Muchísimas gracias por estas palabras tan bonitas! Me emociona saber que el cielo de Atacama dejó una huella en tu corazón. Para mí, cada noche bajo las estrellas es una oportunidad de compartir la maravilla del universo, y comentarios como el tuyo me confirman que vale la pena. Espero que lleves contigo ese recuerdo del desierto y que algún día vuelvas a visitarnos. ¡Un abrazo desde San Pedro!',
    'Vicente',
    '2025-12-22 12:00:00'
),
(
    'REV-GYG-2025-002',
    'Thank you for these kind words! What a joyful, laughter-filled night. You were right about The Dark Forest—thanks for getting me back to reading. Jeff, your thoughtful insights made the night richer. Marianne: I owe you a laser pointer! You crossed the 4-question threshold. Come back in our winter—the center of the storm will be waiting, with the laser. Un gran abrazo universal, Vincent Van G. ✨',
    'Vicente',
    '2025-12-22 12:00:00'
)
ON CONFLICT DO NOTHING;

-- 6. Verificar resultados
SELECT '✅ Reviews de GetYourGuide importados!' as status;

SELECT
    review_id,
    reviewer_name,
    reviewer_country,
    overall_rating as stars,
    source,
    LEFT(title, 40) as title_preview,
    tour_date
FROM reviews
WHERE source = 'getyourguide'
ORDER BY tour_date DESC;

-- 7. Estadísticas totales
SELECT
    source,
    COUNT(*) as total,
    ROUND(AVG(overall_rating)::numeric, 2) as avg_rating
FROM reviews
WHERE status = 'approved'
GROUP BY source;
