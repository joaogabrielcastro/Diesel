import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendingUp, Package, Clock, DollarSign } from "lucide-react";
import { reportsApi } from "../services/api";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { useLanguageStore } from "../store/language";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function Reports() {
  const { t } = useLanguageStore();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["sales-report", dateRange],
    queryFn: () => reportsApi.getSales(dateRange.startDate, dateRange.endDate),
  });

  const { data: topProductsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["top-products", dateRange],
    queryFn: () =>
      reportsApi.getTopProducts(dateRange.startDate, dateRange.endDate, 10),
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue-report", dateRange],
    queryFn: () =>
      reportsApi.getRevenue(dateRange.startDate, dateRange.endDate, "day"),
  });

  const { data: ordersStatusData, isLoading: loadingStatus } = useQuery({
    queryKey: ["orders-status", dateRange],
    queryFn: () =>
      reportsApi.getOrdersStatus(dateRange.startDate, dateRange.endDate),
  });

  const { data: peakHoursData, isLoading: loadingPeakHours } = useQuery({
    queryKey: ["peak-hours", dateRange],
    queryFn: () =>
      reportsApi.getPeakHours(dateRange.startDate, dateRange.endDate),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("reports.title")}</h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="bg-dark-light border border-gray-700 rounded px-3 py-2 text-sm"
            />
            <span className="text-gray-400">{t("reports.to")}</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="bg-dark-light border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loadingSales ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {t("reports.totalOrders")}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {salesData?.data.totalOrders || 0}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Package className="text-blue-500 w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {t("reports.totalRevenue")}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(salesData?.data.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <DollarSign className="text-green-500 w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {t("reports.averageTicket")}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(salesData?.data.averageOrderValue || 0)}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <TrendingUp className="text-purple-500 w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            {t("reports.dailyRevenue")}
          </h2>
          {loadingRevenue ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="period"
                  stroke="#9ca3af"
                  tickFormatter={formatDate}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={t("reports.revenue")}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">{t("reports.topProducts")}</h2>
          {loadingProducts ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData?.data?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="product.name"
                  stroke="#9ca3af"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar
                  dataKey="totalQuantity"
                  fill="#10b981"
                  name={t("reports.quantity")}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Status Pie Chart */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            {t("reports.ordersStatus")}
          </h2>
          {loadingStatus ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersStatusData?.data || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ordersStatusData?.data?.map((_entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak Hours Chart */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock size={20} />
            {t("reports.peakHours")}
          </h2>
          {loadingPeakHours ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  tickFormatter={(hour) => `${hour}h`}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                  labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                />
                <Bar
                  dataKey="orders"
                  fill="#f59e0b"
                  name={t("reports.orders")}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      {!loadingProducts && topProductsData?.data && (
        <div className="card mt-6">
          <h2 className="text-xl font-bold mb-4">
            {t("reports.productDetails")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">
                    {t("reports.productName")}
                  </th>
                  <th className="text-left py-3 px-4">
                    {t("reports.category")}
                  </th>
                  <th className="text-right py-3 px-4">
                    {t("reports.quantity")}
                  </th>
                  <th className="text-right py-3 px-4">
                    {t("reports.revenue")}
                  </th>
                  <th className="text-right py-3 px-4">
                    {t("reports.orders")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProductsData.data.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-gray-800 hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">
                      {item.product.name}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {item.product.category.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.totalQuantity}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right">{item.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
