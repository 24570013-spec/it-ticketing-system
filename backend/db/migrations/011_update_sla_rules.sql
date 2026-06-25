-- Migration 011: Update SLA rules — per priority (hours)
USE ticketing_db;

-- Update SLA: high=2jam, medium=4jam, low=8jam
UPDATE sla_rules SET response_hours = 1, resolution_hours = 2  WHERE priority = 'high';
UPDATE sla_rules SET response_hours = 2, resolution_hours = 4  WHERE priority = 'medium';
UPDATE sla_rules SET response_hours = 4, resolution_hours = 8  WHERE priority = 'low';

-- Recalculate sla_deadline for open/active tickets based on new rules
UPDATE tickets t
JOIN sla_rules s ON t.priority = s.priority
SET t.sla_deadline = DATE_ADD(t.created_at, INTERVAL s.resolution_hours HOUR)
WHERE t.status NOT IN ('resolved', 'closed')
  AND t.sla_deadline IS NOT NULL;

SELECT CONCAT('SLA updated: high=2h, medium=4h, low=8h') AS status;
