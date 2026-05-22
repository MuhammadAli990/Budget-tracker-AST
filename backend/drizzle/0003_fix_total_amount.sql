-- Check if column exists, if not add it, if it does exist but is missing, update it
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budgets' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE "budgets" ADD COLUMN "total_amount" integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Update existing budgets to have totalAmount equal to their current amount
UPDATE "budgets" SET "total_amount" = "amount" WHERE "total_amount" = 0 OR "total_amount" IS NULL;
