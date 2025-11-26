-- ============================================================================
-- FIX: Corregir función get_review_stats
-- Problema: Estaba contando TODAS las reseñas (incluyendo pending/rejected)
-- en el promedio y total, cuando debería contar solo las aprobadas
-- ============================================================================

CREATE OR REPLACE FUNCTION get_review_stats(p_tour_type VARCHAR DEFAULT NULL)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  rating_distribution JSONB,
  total_approved BIGINT,
  total_pending BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total de reseñas APROBADAS (para mostrar al público)
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as total_reviews,

    -- Promedio solo de reseñas APROBADAS
    ROUND(AVG(overall_rating) FILTER (WHERE status = 'approved'), 2) as average_rating,

    -- Distribución solo de reseñas APROBADAS
    jsonb_build_object(
      '5_stars', COUNT(*) FILTER (WHERE overall_rating = 5 AND status = 'approved'),
      '4_stars', COUNT(*) FILTER (WHERE overall_rating = 4 AND status = 'approved'),
      '3_stars', COUNT(*) FILTER (WHERE overall_rating = 3 AND status = 'approved'),
      '2_stars', COUNT(*) FILTER (WHERE overall_rating = 2 AND status = 'approved'),
      '1_star', COUNT(*) FILTER (WHERE overall_rating = 1 AND status = 'approved')
    ) as rating_distribution,

    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as total_approved,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as total_pending
  FROM reviews
  WHERE (p_tour_type IS NULL OR tour_type = p_tour_type);
END;
$$ LANGUAGE plpgsql;

-- Verificar que funcione
SELECT * FROM get_review_stats();
