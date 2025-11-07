import { memo } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersRound, CarFront, ScrollText, TrendingUp, Loader2 } from 'lucide-react';

const Dashboard = memo(function Dashboard() {
  const { data: statsData, isLoading } = useDashboardStats();

  const stats = [
    {
      name: 'Active Leads',
      value: isLoading ? '...' : String(statsData?.activeLeads || 0),
      icon: UsersRound,
      change: '+12%'
    },
    {
      name: 'Available Vehicles',
      value: isLoading ? '...' : String(statsData?.totalVehicles || 0),
      icon: CarFront,
      change: '+5%'
    },
    {
      name: 'Quotes Sent',
      value: isLoading ? '...' : String(statsData?.totalQuotes || 0),
      icon: ScrollText,
      change: '+8%'
    },
    {
      name: 'Conversion Rate',
      value: isLoading ? '...' : `${statsData?.conversionRate || 0}%`,
      icon: TrendingUp,
      change: '+2%'
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your dealership performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-success">
                      {stat.change} from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm">New lead from website</p>
                  <span className="ml-auto text-xs text-muted-foreground">2m ago</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <p className="text-sm">Quote accepted</p>
                  <span className="ml-auto text-xs text-muted-foreground">15m ago</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <p className="text-sm">Credit app submitted</p>
                  <span className="ml-auto text-xs text-muted-foreground">1h ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Messages Sent</span>
                  <span className="text-sm font-medium">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Leads Qualified</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Test Drives Scheduled</span>
                  <span className="text-sm font-medium">8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
});

export default Dashboard;
