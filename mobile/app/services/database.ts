import * as SQLite from "expo-sqlite";

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
  description: string | null;
  image: string | null;
  active: boolean;
  preparationTime: number | null;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  active: boolean;
}

export interface Order {
  id: string;
  comandaId: string;
  status: string;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  observations: string | null;
  status: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync("diesel_bar.db");
      await this.createTables();
      console.log("✅ Database initialized");
    } catch (error) {
      console.error("❌ Database init error:", error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error("Database not initialized");

    // Categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        "order" INTEGER NOT NULL,
        active INTEGER DEFAULT 1,
        updated_at TEXT NOT NULL
      );
    `);

    // Products table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category_id TEXT NOT NULL,
        category_name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        active INTEGER DEFAULT 1,
        preparation_time INTEGER,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);

    // Orders table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        comanda_id TEXT NOT NULL,
        status TEXT NOT NULL,
        observations TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);

    // Order items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        observations TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    // Sync queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        retries INTEGER DEFAULT 0
      );
    `);

    console.log("✅ Tables created");
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getAllAsync<Category>(
      'SELECT * FROM categories WHERE active = 1 ORDER BY "order"',
    );
    return result;
  }

  async saveCategories(categories: Category[]) {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync("DELETE FROM categories");

    for (const category of categories) {
      await this.db.runAsync(
        `INSERT INTO categories (id, name, icon, "order", active, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.icon,
          category.order,
          category.active ? 1 : 0,
          new Date().toISOString(),
        ],
      );
    }
  }

  // Products
  async getProducts(categoryId?: string): Promise<Product[]> {
    if (!this.db) throw new Error("Database not initialized");

    if (categoryId) {
      return await this.db.getAllAsync<Product>(
        "SELECT * FROM products WHERE category_id = ? AND active = 1",
        [categoryId],
      );
    }

    return await this.db.getAllAsync<Product>(
      "SELECT * FROM products WHERE active = 1",
    );
  }

  async saveProducts(products: any[]) {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync("DELETE FROM products");

    for (const product of products) {
      await this.db.runAsync(
        `INSERT INTO products 
         (id, name, price, category_id, category_name, description, image, active, preparation_time, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          Number(product.price),
          product.categoryId,
          product.category?.name || "",
          product.description,
          product.image,
          product.active ? 1 : 0,
          product.preparationTime,
          new Date().toISOString(),
        ],
      );
    }
  }

  // Orders
  async getUnsyncedOrders(): Promise<Order[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAllAsync<Order>(
      "SELECT * FROM orders WHERE synced = 0",
    );
  }

  async saveOrder(order: any, items: any[]) {
    if (!this.db) throw new Error("Database not initialized");

    // Save order
    await this.db.runAsync(
      `INSERT INTO orders (id, comanda_id, status, observations, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.comandaId,
        order.status,
        order.observations,
        order.createdAt || new Date().toISOString(),
        new Date().toISOString(),
        0,
      ],
    );

    // Save items
    for (const item of items) {
      await this.db.runAsync(
        `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, observations, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id || `${order.id}_${item.productId}`,
          order.id,
          item.productId,
          item.productName || "",
          item.quantity,
          Number(item.price),
          item.observations,
          item.status || "PENDING",
        ],
      );
    }
  }

  async markOrderSynced(orderId: string) {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.runAsync("UPDATE orders SET synced = 1 WHERE id = ?", [
      orderId,
    ]);
  }

  // Clear all data
  async clearAll() {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.execAsync(`
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM products;
      DELETE FROM categories;
      DELETE FROM sync_queue;
    `);
  }
}

export const databaseService = new DatabaseService();
