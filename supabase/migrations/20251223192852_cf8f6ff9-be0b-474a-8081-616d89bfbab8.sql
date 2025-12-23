-- Fix the generate_order_number function to handle race conditions better
-- Using advisory lock to prevent concurrent duplicates
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  today DATE := CURRENT_DATE;
  seq INT;
  prefix CHAR;
  lock_id BIGINT;
BEGIN
  -- Create a unique lock ID based on the date
  lock_id := (EXTRACT(EPOCH FROM today)::BIGINT);
  
  -- Acquire an advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(lock_id);
  
  INSERT INTO daily_order_counter (counter_date, last_sequence) 
  VALUES (today, 1)
  ON CONFLICT (counter_date) DO UPDATE 
  SET last_sequence = daily_order_counter.last_sequence + 1
  RETURNING last_sequence INTO seq;
  
  prefix := chr(65 + ((seq - 1) / 999));
  RETURN prefix || lpad(((seq - 1) % 999 + 1)::text, 3, '0');
END;
$function$;