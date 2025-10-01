import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Inventory() {
  const mockVehicles = [
    {
      id: '1',
      year: 2024,
      make: 'Toyota',
      model: 'Camry',
      trim: 'XLE',
      price: 32999,
      mileage: 1245,
      exterior_color: 'Silver',
      status: 'available',
      images: ['/placeholder.svg'],
    },
    {
      id: '2',
      year: 2023,
      make: 'Honda',
      model: 'CR-V',
      trim: 'EX-L',
      price: 36499,
      mileage: 8500,
      exterior_color: 'Black',
      status: 'available',
      images: ['/placeholder.svg'],
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-2">
              Browse and manage your vehicle inventory
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by make, model, VIN..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${vehicle.price.toLocaleString()}
                    </span>
                    <Badge variant="secondary">
                      {vehicle.mileage.toLocaleString()} km
                    </Badge>
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{vehicle.exterior_color}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Create Quote
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
