import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    Tooltip,
} from 'recharts';
// Ensure this file exists at src/styles/principaldashboard/PrincipalDashboard.css
// IMPORTANT: Verify the exact path and capitalization on your local file system.
import '../styles/principaldashboard/PrincipalDashboard.css'; 
// Ensure this file exists at src/store/authStore.ts (or .js)
// IMPORTANT: Verify the exact path and capitalization on your local file system.
import { useAuthStore } from '../store/authStore'; 

// Interface for user data received from Django API.
interface DjangoUserData {
    name: string;
    role: string;
}

// Interface for individual late arrival records from Django API.
interface DjangoLateArrival {
    student_name: string;
    timestamp: string;
}

// Interface for the complete Principal Dashboard data from Django API.
// Note: This matches the JSON structure you provided, which does NOT include 'total_students' or department data.
interface PrincipalDashboardDjangoData {
    user: DjangoUserData;
    late_arrivals: DjangoLateArrival[];
}

const PrincipalDashboard: React.FC = () => {
    const navigate = useNavigate();
    // Retrieve authentication status and token from the global authentication store.
    const { user, token, isAuthenticated, logout } = useAuthStore(); 

    // State for the selected date range filter (client-side filtering).
    const [selectedDateRange, setSelectedDateRange] = useState<string>('currentDay');

    // States for data fetched from the Django backend.
    const [principalDashboardDjangoData, setPrincipalDashboardDjangoData] = useState<PrincipalDashboardDjangoData | null>(null);
    const [isLoadingPrincipalDashboardDjangoData, setIsLoadingPrincipalDashboardDjangoData] = useState(true);
    // State to hold any errors encountered during Django API calls.
    const [errorPrincipalDashboardDjango, setErrorPrincipalDashboardDjango] = useState<string | null>(null);

    // Effect hook for handling user authentication and role-based access.
    // Redirects to login if not authenticated, or to home if not a Principal.
    useEffect(() => {
        if (!isAuthenticated) {
            console.warn("User not authenticated, redirecting to login.");
            navigate('/login');
            return;
        }
        // Ensure only 'Principal' role users can access this dashboard.
        if (user && user.role !== 'Principal') {
            console.warn(`User with role ${user.role} attempted to access Principal Dashboard. Redirecting.`);
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    // Effect hook for fetching Principal Dashboard data from the Django backend.
    useEffect(() => {
        const fetchPrincipalDashboardDjangoData = async () => {
            if (!isAuthenticated || !token) {
                setIsLoadingPrincipalDashboardDjangoData(false);
                setErrorPrincipalDashboardDjango('Authentication required to fetch data.');
                return;
            }

            setIsLoadingPrincipalDashboardDjangoData(true);
            setErrorPrincipalDashboardDjango(null);

            try {
                // Determine the base API URL for Django using environment variable or a default.
                const API_BASE_URL_DJANGO = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
                // Construct the specific endpoint for the principal dashboard.
                const endpoint = `${API_BASE_URL_DJANGO}/principal-dashboard/`;
                console.log("Fetching from endpoint:", endpoint); // Debugging log

                // Make the API request with appropriate headers including the authorization token.
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Include the bearer token.
                    },
                });

                console.log("API Response Status:", response.status); // Debugging log

                // Handle non-OK HTTP responses.
                if (!response.ok) {
                    let errorMessage = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        // Check if errorData is an object and has a 'detail' property.
                        if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData) {
                            errorMessage = errorData.detail;
                        } else {
                            // If JSON is valid but doesn't have a 'detail' field or is not an object.
                            errorMessage = `API error: ${JSON.stringify(errorData)}`;
                        }
                    } catch (jsonError) {
                        // If response is not OK and JSON parsing fails, provide a generic message.
                        errorMessage = `Failed to parse API error response. Status: ${response.status}. Please check backend logs.`;
                        console.error("JSON parsing error on non-OK response:", jsonError); // Debugging log
                    }
                    throw new Error(errorMessage);
                }

                // Parse the JSON response and update state.
                const data: PrincipalDashboardDjangoData = await response.json();
                console.log("Successfully fetched Django data:", data); // Debugging log
                setPrincipalDashboardDjangoData(data);
            } catch (err: any) {
                console.error("Error fetching Principal Dashboard Django data:", err); // Debugging log
                // Set a user-friendly error message.
                setErrorPrincipalDashboardDjango(err.message || 'An unexpected error occurred while fetching Django data.');
            } finally {
                setIsLoadingPrincipalDashboardDjangoData(false);
            }
        };

        // Only fetch data if authenticated and token is available.
        if (isAuthenticated && token) {
            fetchPrincipalDashboardDjangoData();
        }
    }, [isAuthenticated, token, navigate]);

    // Handler for changes in the date range filter.
    const handleDateRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDateRange(event.target.value);
    };

    // Function to filter late arrivals based on the selected date range.
    const filterLateArrivals = (arrivals: DjangoLateArrival[]) => {
        const now = new Date();
        return arrivals.filter(arrival => {
            const arrivalDate = new Date(arrival.timestamp);
            if (selectedDateRange === 'currentDay') {
                return arrivalDate.toDateString() === now.toDateString();
            } else if (selectedDateRange === '7days') {
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(now.getDate() - 7);
                return arrivalDate >= sevenDaysAgo;
            } else if (selectedDateRange === '30days') {
                const thirtyDaysAgo = new Date(now);
                thirtyDaysAgo.setDate(now.getDate() - 30);
                return arrivalDate >= thirtyDaysAgo;
            }
            return true; // Should not happen with defined options.
        });
    };

    // Filter late arrivals based on the fetched data and selected date range.
    const filteredLateArrivals = principalDashboardDjangoData?.late_arrivals
        ? filterLateArrivals(principalDashboardDjangoData.late_arrivals)
        : [];

    // Calculate the number of late students for the selected period.
    const lateStudentsCount = filteredLateArrivals.length;

    // IMPORTANT: Total students count is NOT provided by your current JSON structure from the backend.
    // Therefore, the gauge charts relying on a percentage will display N/A or 0%.
    // In a real application, you would need to adjust your Django API to provide this data.
    const totalStudentsAvailableFromAPI = 0; // Set to 0 as it's not in the provided JSON

    // Calculate the number of students assumed to be on time.
    const onTimeStudentsCount = totalStudentsAvailableFromAPI > 0 ? totalStudentsAvailableFromAPI - lateStudentsCount : 0;

    // Dynamically set card labels based on the selected date range.
    const onTimeStudentsLabel = selectedDateRange === 'currentDay' ? "Students On-Time" : `On-Time Students (${selectedDateRange === '7days' ? 'Last 7 Days' : 'Last 30 Days'})`;
    const latecomersLabel = selectedDateRange === 'currentDay' ? "Latecomers Today" : `Latecomers (${selectedDateRange === '7days' ? 'Last 7 Days' : 'Last 30 Days'})`;

    // Calculate Non-Latecomers Rate (students on time percentage).
    const nonLatecomersRate = totalStudentsAvailableFromAPI > 0
        ? parseFloat(((onTimeStudentsCount / totalStudentsAvailableFromAPI) * 100).toFixed(2))
        : 0; // Default to 0 if total students is not available

    // Calculate Latecomers Rate percentage.
    const latecomersRate = totalStudentsAvailableFromAPI > 0
        ? parseFloat(((lateStudentsCount / totalStudentsAvailableFromAPI) * 100).toFixed(2))
        : 0; // Default to 0 if total students is not available

    // Data for the Non-Latecomers Rate RadialBarChart.
    const nonLatecomersGaugeData = [{
        name: 'Non-Latecomers Rate',
        value: nonLatecomersRate,
        fill: '#666666'
    }];

    // Data for the Latecomers Rate RadialBarChart.
    const latecomersGaugeData = [{
        name: 'Latecomers Rate',
        value: latecomersRate,
        fill: '#333333'
    }];

    // Display a loading message while data is being fetched.
    if (isLoadingPrincipalDashboardDjangoData) {
        return (
            <div className="principal-dashboard flex items-center justify-center min-h-screen">
                <p className="loading-message">Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="principal-dashboard">
            {/* Dashboard Header Section */}
            <header className="dashboard-header">
                <h1 className="dashboard-title">Principal Dashboard (Late Attendance)</h1>
                <div className="header-actions">
                    {/* Display welcome message if user name is available from API */}
                    {principalDashboardDjangoData?.user?.name && (
                        <span className="text-gray-700 font-medium mr-4">Welcome, {principalDashboardDjangoData.user.name}</span>
                    )}
                    {/* Logout button */}
                    <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 ease-in-out">
                        Logout
                    </button>
                </div>
            </header>

            {/* Display error message if any error occurred during data fetching */}
            {errorPrincipalDashboardDjango && (
                <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{errorPrincipalDashboardDjango}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" onClick={() => setErrorPrincipalDashboardDjango(null)}><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                    </span>
                </div>
            )}

            <section className="dashboard-filters">
                <div className="filter-box">
                    <label htmlFor="date-range">Date</label>
                    <select id="date-range" onChange={handleDateRangeChange} value={selectedDateRange}>
                        <option value="currentDay">Current Day</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                </div>
                <div className="filter-box">
                    <label htmlFor="departments">Departments</label>
                    <select id="departments" value="All" disabled>
                        <option value="All">All (Data not available from current API)</option>
                    </select>
                </div>
            </section>

            <section className="dashboard-summary-grid">
                <div className="summary-card">
                    <h3 className="card-label">{onTimeStudentsLabel}</h3>
                    {/* Display 'N/A' if total students count is 0, otherwise display calculated value. */}
                    <p className="card-value">{totalStudentsAvailableFromAPI > 0 ? onTimeStudentsCount : 'N/A'}</p>
                    {totalStudentsAvailableFromAPI === 0 && (
                        <p className="text-sm text-red-500 mt-1">Total students count not available from API.</p>
                    )}
                </div> 

                <div className="summary-card">
                    <h3 className="card-label">{latecomersLabel}</h3>
                    <p className="card-value">{lateStudentsCount}</p>
                </div>

                {/* Non-Latecomers Rate Gauge Chart */}
                <div className="summary-card chart-card">
                    <h3 className="card-label">Non-Latecomers Rate</h3>
                    {totalStudentsAvailableFromAPI > 0 ? (
                        <div className="chart-container-gauge">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="70%"
                                    outerRadius="90%"
                                    barSize={10}
                                    data={nonLatecomersGaugeData}
                                    startAngle={225} 
                                    endAngle={-45} 
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar
                                        label={{
                                            position: 'insideStart',
                                            fill: '#fff',
                                            formatter: (label: React.ReactNode) => {
                                                if (typeof label === 'number') {
                                                    return `${label.toFixed(2)}%`;
                                                }
                                                return label;
                                            }
                                        }}
                                        background 
                                        dataKey="value" 
                                    />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                                    <text
                                        x="50%"
                                        y="55%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="gauge-label"
                                    >
                                        {nonLatecomersRate}%
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="no-data-message-chart">N/A (Total students count missing from API)</p>
                    )}
                </div>

                {/* Latecomers Rate Gauge Chart */}
                <div className="summary-card chart-card">
                    <h3 className="card-label">Latecomers Rate</h3>
                    {totalStudentsAvailableFromAPI > 0 ? (
                        <div className="chart-container-gauge">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="70%"
                                    outerRadius="90%"
                                    barSize={10}
                                    data={latecomersGaugeData}
                                    startAngle={225}
                                    endAngle={-45}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar
                                        label={{
                                            position: 'insideStart',
                                            fill: '#fff',
                                            formatter: (label: React.ReactNode) => {
                                                if (typeof label === 'number') {
                                                    return `${label.toFixed(2)}%`;
                                                }
                                                return label;
                                            }
                                        }}
                                        background
                                        dataKey="value"
                                    />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                                    <text
                                        x="50%"
                                        y="55%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="gauge-label"
                                    >
                                        {latecomersRate}%
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="no-data-message-chart">N/A (Total students count missing from API)</p>
                    )}
                </div>
            </section>

            <section className="dashboard-chart-section">
                <h3 className="section-title">Latecomers by Department (Data Not Available)</h3>
                <p className="no-data-message">
                    Department-specific latecomer data is not provided by the current Django API endpoint.
                    The 'late_arrivals' only contain student names and timestamps.
                </p>
            </section>

            <section className="dashboard-chart-section">
                <h3 className="section-title">Detailed Late Arrivals (from Django API)</h3>
                {filteredLateArrivals.length > 0 ? (
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Arrival Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLateArrivals.map((arrival, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {arrival.student_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(arrival.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="no-data-message">No detailed late arrivals for the selected date range from the Django backend.</p>
                )}
            </section>
        </div>
    );
};

export default PrincipalDashboard;
