import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ResponsiveContainer
} from 'recharts'

const AnalyticsChart = ({ 
  type = 'line', 
  data = [], 
  title, 
  height = 300,
  color = '#3B82F6',
  showGrid = true,
  showLegend = true,
  dataKey,
  xAxisKey = 'name',
  yAxisKey = 'value'
}) => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16'  // lime
  ]

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={dataKey || yAxisKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={dataKey || yAxisKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.3}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar 
              dataKey={dataKey || yAxisKey} 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey || yAxisKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )

      case 'multiline':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {}).filter(key => key !== xAxisKey).map((key, index) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]} 
                strokeWidth={2}
                dot={{ strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case 'multibar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {Object.keys(data[0] || {}).filter(key => key !== xAxisKey).map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={colors[index % colors.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Unsupported chart type: {type}
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

// Predefined chart configurations for common use cases
export const RevenueChart = ({ data, title = "Revenue Trend" }) => (
  <AnalyticsChart
    type="area"
    data={data}
    title={title}
    color="#10B981"
    dataKey="revenue"
    xAxisKey="month"
    height={350}
  />
)

export const BookingsChart = ({ data, title = "Bookings Overview" }) => (
  <AnalyticsChart
    type="bar"
    data={data}
    title={title}
    color="#3B82F6"
    dataKey="bookings"
    xAxisKey="date"
    height={300}
  />
)

export const UserActivityChart = ({ data, title = "User Activity" }) => (
  <AnalyticsChart
    type="multiline"
    data={data}
    title={title}
    xAxisKey="date"
    height={300}
  />
)

export const VenueDistributionChart = ({ data, title = "Venue Distribution" }) => (
  <AnalyticsChart
    type="pie"
    data={data}
    title={title}
    dataKey="count"
    height={350}
    showGrid={false}
    showLegend={false}
  />
)

export const PerformanceChart = ({ data, title = "Performance Metrics" }) => (
  <AnalyticsChart
    type="multibar"
    data={data}
    title={title}
    xAxisKey="metric"
    height={300}
  />
)

export default AnalyticsChart
