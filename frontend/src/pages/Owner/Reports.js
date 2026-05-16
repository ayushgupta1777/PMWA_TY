// src/pages/Owner/Reports.js  
import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, DollarSign, Package } from 'lucide-react';

const Reports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // API call for analytics
      setAnalytics({
        totalRevenue: 150000,
        totalBills: 1250,
        averageOrderValue: 120,
        topMedicines: [
          { name: 'Paracetamol', sales: 500, revenue: 25000 },
          { name: 'Dolo 650', sales: 300, revenue: 24000 }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">View your pharmacy's performance and insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{analytics.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalBills}</p>
              </div>
              <BarChart className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">₹{analytics.averageOrderValue}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Top Medicines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Top Selling Medicines</h2>
          <div className="space-y-4">
            {analytics.topMedicines.map((medicine, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{medicine.name}</p>
                    <p className="text-sm text-gray-600">{medicine.sales} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{medicine.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;