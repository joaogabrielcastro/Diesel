-- CreateIndex
CREATE INDEX "comandas_status_table_id_idx" ON "comandas"("status", "table_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");
