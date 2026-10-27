-- Vanduo Marse: guided quad tours are scheduled events with seats, so they reuse
-- events + event_tickets. A new enum value must be committed before anything
-- can use it, hence its own migration.

alter type public.event_category add value if not exists 'keturratis';
