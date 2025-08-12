import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { getOwnerEarnings, getOwnerBookings } from '../../api/ownerApi';

const OwnerEarningsPage = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earningsData, setEarningsData] = useState({
    monthlyEarnings: [],
    totalEarnings: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    estimatedPayout: 0,
    recentTransactions: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch earnings data
        const earningsResponse = await getOwnerEarnings({
          year: selectedYear,
          timeRange
        });
        
        // Fetch recent transactions
        const transactionsResponse = await getOwnerBookings({
          limit: 5,
          status: 'completed'
        });
        
        setEarningsData({
          monthlyEarnings: earningsResponse.monthlyEarnings || [],
          totalEarnings: earningsResponse.totalEarnings || 0,
          totalBookings: earningsResponse.totalBookings || 0,
          averageBookingValue: earningsResponse.averageBookingValue || 0,
          estimatedPayout: earningsResponse.estimatedPayout || 0,
          recentTransactions: transactionsResponse.bookings || []
        });
      } catch (err) {
        console.error('Error fetching earnings data:', err);
        setError('Failed to load earnings data. Please try again.');
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, selectedYear]);

  // Prepare chart data
  const chartData = {
    labels: earningsData.monthlyEarnings.map(item => item.month),
    datasets: [
      {
        label: 'Earnings ($)',
        data: earningsData.monthlyEarnings.map(item => item.earnings || 0),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Bookings',
        data: earningsData.monthlyEarnings.map(item => (item.bookings || 0) * 10), // Scale for better visualization
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  // Calculate changes if we have at least 2 months of data
  const monthlyEarnings = earningsData.monthlyEarnings;
  let earningsChange = 0;
  let bookingsChange = 0;
  
  if (monthlyEarnings.length > 1) {
    const currentMonthData = monthlyEarnings[monthlyEarnings.length - 1];
    const prevMonthData = monthlyEarnings[monthlyEarnings.length - 2];
    
    if (prevMonthData.earnings > 0) {
      earningsChange = ((currentMonthData.earnings - prevMonthData.earnings) / prevMonthData.earnings * 100).toFixed(1);
    }
    
    if (prevMonthData.bookings > 0) {
      bookingsChange = ((currentMonthData.bookings - prevMonthData.bookings) / prevMonthData.bookings * 100).toFixed(1);
    }
  }

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Earnings ($)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Number of Bookings',
        },
        ticks: {
          callback: function(value) {
            return value / 10; // Scale back for display
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading earnings data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Earnings Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your earnings and booking statistics
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="time-range" className="block text-sm font-medium text-gray-700">
                  Time Range
                </label>
                <select
                  id="time-range"
                  name="time-range"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  id="year"
                  name="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {[2022, 2023, 2024].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CalendarIcon className="-ml-1 mr-2 h-5 w-5" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Total Earnings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        ${earningsData.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${earningsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {earningsChange >= 0 ? (
                          <ArrowUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" />
                        )}
                        <span className="sr-only">
                          {earningsChange >= 0 ? 'Increased' : 'Decreased'} by
                        </span>
                        {Math.abs(earningsChange)}% vs last month
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <CreditCardIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {earningsData.totalBookings}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${bookingsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {bookingsChange >= 0 ? (
                          <ArrowUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" />
                        )}
                        <span className="sr-only">
                          {bookingsChange >= 0 ? 'Increased' : 'Decreased'} by
                        </span>
                        {Math.abs(bookingsChange)}% vs last month
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Average Booking Value */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <BanknotesIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg. Booking Value</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        ${earningsData.averageBookingValue.toFixed(2)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Payout */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <BanknotesIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Estimated Payout</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        ${earningsData.estimatedPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <span className="text-xs text-gray-500">(after 15% fee)</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="h-96">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Transactions</h3>
          </div>
          <div className="bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Court
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earningsData.recentTransactions.length > 0 ? (
                  earningsData.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className={transaction.id % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.bookingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">
                        #{transaction.bookingNumber || transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.user?.name || 'Guest User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.court?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className="text-green-600">${transaction.totalAmount?.toFixed(2) || '0.00'}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerEarningsPage;
