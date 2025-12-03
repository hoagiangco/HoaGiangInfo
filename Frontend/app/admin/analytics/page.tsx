'use client';

import { useState, useEffect } from 'react';
import Loading from '@/components/Loading';

interface AnalyticsData {
  totalScans: number;
  scansByQR: Array<{ qrCodeName: string; qrCodeToken: string; count: number }>;
  scansByDay: Array<{ date: string; count: number }>;
  moduleStats: Array<{ moduleName: string; qrCodeCount: number }>;
  period: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?days=${days}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [days]);

  if (loading) return <Loading />;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Total Scans
          </h2>
          <p className="text-3xl font-bold text-primary-600">
            {data.totalScans.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">Last {data.period} days</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Active QR Codes
          </h2>
          <p className="text-3xl font-bold text-primary-600">
            {data.scansByQR.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">With scans</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Modules
          </h2>
          <p className="text-3xl font-bold text-primary-600">
            {data.moduleStats.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Available</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Scans by QR Code
          </h2>
          <div className="space-y-3">
            {data.scansByQR
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div
                  key={item.qrCodeToken}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.qrCodeName}
                    </p>
                    <p className="text-sm text-gray-500">{item.qrCodeToken}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary-600">
                    {item.count}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Module Usage
          </h2>
          <div className="space-y-3">
            {data.moduleStats
              .sort((a, b) => b.qrCodeCount - a.qrCodeCount)
              .map((item) => (
                <div
                  key={item.moduleName}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <p className="font-semibold text-gray-800">
                    {item.moduleName}
                  </p>
                  <div className="text-lg font-bold text-primary-600">
                    {item.qrCodeCount} QR codes
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Scans Over Time
        </h2>
        <div className="space-y-2">
          {data.scansByDay.map((day) => (
            <div key={day.date} className="flex items-center space-x-4">
              <div className="w-24 text-sm text-gray-600">{day.date}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-primary-600 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{
                    width: `${
                      (day.count / Math.max(...data.scansByDay.map((d) => d.count), 1)) *
                      100
                    }%`,
                  }}
                >
                  <span className="text-xs text-white font-semibold">
                    {day.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}







