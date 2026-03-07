-- CreateTable
CREATE TABLE "order_prints" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "printed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "order_prints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_prints_order_id_idx" ON "order_prints"("order_id");

-- AddForeignKey
ALTER TABLE "order_prints" ADD CONSTRAINT "order_prints_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
