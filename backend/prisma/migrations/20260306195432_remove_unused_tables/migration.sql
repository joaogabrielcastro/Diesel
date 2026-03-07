-- RemoveUnusedTables
-- Remove PaymentSplit table
DROP TABLE IF EXISTS "payment_splits" CASCADE;

-- Remove QuickOrder table
DROP TABLE IF EXISTS "quick_orders" CASCADE;

-- Update UserRole enum to remove CASINO
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'WAITER', 'KITCHEN', 'CASHIER');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";
DROP TYPE "UserRole_old";
