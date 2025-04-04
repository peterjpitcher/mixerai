-- Add status column to brands table
ALTER TABLE public.brands
ADD COLUMN status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing brands to be approved
UPDATE public.brands
SET status = 'approved'
WHERE status = 'pending';

-- Create a notification trigger for brand status changes
CREATE OR REPLACE FUNCTION public.handle_brand_status_change()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    )
    SELECT
      user_id,
      'brand_' || NEW.status,
      CASE
        WHEN NEW.status = 'approved' THEN 'Brand Approved'
        WHEN NEW.status = 'rejected' THEN 'Brand Rejected'
        ELSE 'Brand Status Updated'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN 'The brand "' || NEW.name || '" has been approved.'
        WHEN NEW.status = 'rejected' THEN 'The brand "' || NEW.name || '" has been rejected.'
        ELSE 'The brand "' || NEW.name || '" status has been updated to ' || NEW.status || '.'
      END,
      jsonb_build_object(
        'brand_id', NEW.id,
        'brand_name', NEW.name,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    FROM public.brand_users
    WHERE brand_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER brand_status_change_trigger
  AFTER UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_brand_status_change(); 