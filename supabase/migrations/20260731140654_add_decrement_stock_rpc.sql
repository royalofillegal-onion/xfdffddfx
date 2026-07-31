/*
# Add decrement_stock RPC function

1. New Functions
   - `decrement_stock(product_id uuid, qty int)`:
     Atomically decrements a product's stock by the given quantity, but only if
     sufficient stock remains. Prevents overselling during concurrent checkouts.

2. Security
   - SECURITY DEFINER so it can update the products table (which is admin-write
     only via RLS) without exposing general update permissions to customers.
   - Executable by authenticated users (needed during checkout).

3. Notes
   - Returns the new stock value, or -1 if there was insufficient stock.
   - Safe to re-run (idempotent creation via CREATE OR REPLACE).
*/

CREATE OR REPLACE FUNCTION public.decrement_stock(product_id uuid, qty int)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_stock integer;
BEGIN
  UPDATE public.products
  SET stock = stock - qty, updated_at = now()
  WHERE id = product_id AND stock >= qty
  RETURNING stock INTO new_stock;

  IF new_stock IS NULL THEN
    RETURN -1;
  END IF;
  RETURN new_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int) TO authenticated;
