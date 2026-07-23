import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, MapPin, X, Filter } from 'lucide-react';

const EventSearchAndFilter = ({ filters, setFilters, onClear, resultCount }) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = [
    filters.search,
    filters.status !== 'All',
    filters.datePreset !== 'All',
    filters.location
  ].filter(Boolean).length;

  return (
    <div className="bg-card border rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Filter Events</h3>
            <p className="text-xs text-muted-foreground">
              Showing {resultCount} result{resultCount !== 1 ? 's' : ''} 
              {activeFilterCount > 0 && ` • ${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-foreground h-8 px-3">
            <X className="w-4 h-4 mr-1.5" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Event or customer name..." 
              value={filters.search} 
              onChange={(e) => handleFilterChange('search', e.target.value)} 
              className="pl-9 h-10" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by location..." 
              value={filters.location} 
              onChange={(e) => handleFilterChange('location', e.target.value)} 
              className="pl-9 h-10" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Date Range</label>
          <Select value={filters.datePreset} onValueChange={(v) => handleFilterChange('datePreset', v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Time</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="This Year">This Year</SelectItem>
              <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
              <SelectItem value="Custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filters.datePreset === 'Custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
            <Input 
              type="date" 
              value={filters.customStart} 
              onChange={(e) => handleFilterChange('customStart', e.target.value)} 
              className="h-10" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">End Date</label>
            <Input 
              type="date" 
              value={filters.customEnd} 
              onChange={(e) => handleFilterChange('customEnd', e.target.value)} 
              className="h-10" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSearchAndFilter;