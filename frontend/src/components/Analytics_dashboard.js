import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    uniqueUsers: 0,
    queryModuleDistribution: [],
    responseTypeDistribution: [],
    avgRating: 0,
    dailyQueriesTrend: [],
    topQueries: [],
    escalationRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const COLORS = ['#4f6df5', '#12c2e9', '#c471ed', '#f64f59', '#8fd3f4'];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/analytics/dashboard?timeRange=${timeRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated data for demonstration
  useEffect(() => {
    // This would normally come from the API call above
    const simulatedData = {
      totalQueries: 1283,
      uniqueUsers: 157,
      avgRating: 4.2,
      escalationRate: 8.3,
      queryModuleDistribution: [
        { name: 'Sales', value: 380 },
        { name: 'GST', value: 320 },
        { name: 'Purchase', value: 240 },
        { name: 'Finance', value: 180 },
        { name: 'Stores', value: 120 },
        { name: 'Production', value: 60 }
      ],
      responseTypeDistribution: [
        { name: 'FAQ Match', value: 45 },
        { name: 'AI with Context', value: 35 },
        { name: 'AI Only', value: 15 },
        { name: 'Escalated', value: 5 }
      ],
      dailyQueriesTrend: [
        { date: '03/01', queries: 42, escalations: 3 },
        { date: '03/02', queries: 38, escalations: 2 },
        { date: '03/03', queries: 45, escalations: 4 },
        { date: '03/04', queries: 52, escalations: 5 },
        { date: '03/05', queries: 48, escalations: 3 },
        { date: '03/06', queries: 39, escalations: 2 },
        { date: '03/07', queries: 43, escalations: 4 }
      ],
      topQueries: [
        { query: "How to generate GST invoice?", count: 43 },
        { query: "Where can I see pending orders?", count: 38 },
        { query: "How to check inventory status?", count: 35 },
        { query: "What is the process for return goods?", count: 29 },
        { query: "How to create a new customer?", count: 24 }
      ]
    };
    
    setAnalytics(simulatedData);
    setIsLoading(false);
  }, [timeRange]);

  if (isLoading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>AskNova Analytics Dashboard</h1>
        <div className="time-filter">
          <button 
            className={timeRange === 'day' ? 'active' : ''} 
            onClick={() => setTimeRange('day')}
          >
            Today
          </button>
          <button 
            className={timeRange === 'week' ? 'active' : ''} 
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''} 
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
        </div>
      </header>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Queries</h3>
          <p className="stat-value">{analytics.totalQueries.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Unique Users</h3>
          <p className="stat-value">{analytics.uniqueUsers.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Rating</h3>
          <p className="stat-value">{analytics.avgRating.toFixed(1)}/5</p>
        </div>
        <div className="stat-card">
          <h3>Escalation Rate</h3>
          <p className="stat-value">{analytics.escalationRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h2>Queries by Module</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.queryModuleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analytics.queryModuleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Queries']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Response Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.responseTypeDistribution}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              <Bar dataKey="value" fill="#4f6df5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card wide">
          <h2>Daily Queries & Escalations</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={analytics.dailyQueriesTrend}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="queries" 
                stroke="#4f6df5" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
                name="Queries"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="escalations" 
                stroke="#f64f59" 
                strokeWidth={2}
                name="Escalations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Top Queries</h2>
          <div className="top-queries-list">
            {analytics.topQueries.map((item, index) => (
              <div key={index} className="query-item">
                <div className="query-rank">{index + 1}</div>
                <div className="query-text">{item.query}</div>
                <div className="query-count">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h2>Sentiment Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Positive', value: 65 },
                  { name: 'Neutral', value: 25 },
                  { name: 'Negative', value: 10 }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill="#4CAF50" />
                <Cell fill="#2196F3" />
                <Cell fill="#F44336" />
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'User Sentiment']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-footer">
        <button className="export-button" onClick={() => alert('Exporting report...')}>
          Export Report
        </button>
        <p className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;