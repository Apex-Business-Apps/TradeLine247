import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";

interface FilterState {
  keyword: string;
  province: string;
  engines: string[];
  minSeats: number;
  maxSeats: number;
  useLocation: boolean;
  radius: number;
  sort: string;
}

interface VehicleSearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onSearch: () => void;
}

const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Nova Scotia", "Ontario",
  "Prince Edward Island", "Quebec", "Saskatchewan"
];

const ENGINE_TYPES = [
  "Gasoline", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "year_desc", label: "Year: Newest First" },
  { value: "year_asc", label: "Year: Oldest First" },
  { value: "distance", label: "Distance" },
];

export default function VehicleSearchFilters({ onFilterChange, onSearch }: VehicleSearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    province: "",
    engines: [],
    minSeats: 2,
    maxSeats: 8,
    useLocation: false,
    radius: 50,
    sort: "relevance",
  });

  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    if ('geolocation' in navigator && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as any);
      });
    }
  }, []);

  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleEngineToggle = (engine: string) => {
    const newEngines = filters.engines.includes(engine)
      ? filters.engines.filter(e => e !== engine)
      : [...filters.engines, engine];
    handleFilterUpdate({ engines: newEngines });
  };

  const requestLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setLocationPermission('granted');
      handleFilterUpdate({ useLocation: true });
    } catch (error) {
      setLocationPermission('denied');
      handleFilterUpdate({ useLocation: false });
    }
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      keyword: "",
      province: "",
      engines: [],
      minSeats: 2,
      maxSeats: 8,
      useLocation: false,
      radius: 50,
      sort: "relevance",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Keyword Search */}
        <div className="space-y-2">
          <Label htmlFor="keyword">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="keyword"
              placeholder="e.g., Camry, Honda, SUV"
              value={filters.keyword}
              onChange={(e) => handleFilterUpdate({ keyword: e.target.value })}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
          </div>
        </div>

        {/* Province */}
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Select value={filters.province} onValueChange={(value) => handleFilterUpdate({ province: value })}>
            <SelectTrigger id="province">
              <SelectValue placeholder="All provinces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All provinces</SelectItem>
              {PROVINCES.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Engine Type */}
        <div className="space-y-2">
          <Label>Engine Type</Label>
          <div className="space-y-2">
            {ENGINE_TYPES.map((engine) => (
              <div key={engine} className="flex items-center space-x-2">
                <Checkbox
                  id={`engine-${engine}`}
                  checked={filters.engines.includes(engine)}
                  onCheckedChange={() => handleEngineToggle(engine)}
                />
                <label
                  htmlFor={`engine-${engine}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {engine}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Seats */}
        <div className="space-y-2">
          <Label>Seats: {filters.minSeats} - {filters.maxSeats}</Label>
          <div className="px-2">
            <Slider
              min={2}
              max={8}
              step={1}
              value={[filters.minSeats, filters.maxSeats]}
              onValueChange={([min, max]) => handleFilterUpdate({ minSeats: min, maxSeats: max })}
              className="w-full"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Search by Distance</Label>
            {locationPermission === 'prompt' && (
              <Button variant="outline" size="sm" onClick={requestLocation}>
                <MapPin className="mr-2 h-4 w-4" />
                Enable Location
              </Button>
            )}
            {locationPermission === 'granted' && (
              <span className="text-xs text-green-600">Location enabled</span>
            )}
            {locationPermission === 'denied' && (
              <span className="text-xs text-red-600">Location denied</span>
            )}
          </div>
          {filters.useLocation && (
            <div className="space-y-2">
              <Label>Radius: {filters.radius} km</Label>
              <Slider
                min={10}
                max={200}
                step={10}
                value={[filters.radius]}
                onValueChange={([value]) => handleFilterUpdate({ radius: value })}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select value={filters.sort} onValueChange={(value) => handleFilterUpdate({ sort: value })}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={onSearch} className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}