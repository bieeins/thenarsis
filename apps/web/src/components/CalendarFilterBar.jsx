import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, FilterX } from 'lucide-react';

const CalendarFilterBar = ({ filters, setFilters, packages }) => {
  const handleClear = () => {
    setFilters({
      search: '',
      status: 'All',
      package: 'All'
    });
  };

  const activeCount = [
    filters.search !== '',
    filters.status !== 'All',
    filters.package !== 'All'
  ].filter(Boolean).length;

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search customer or event name..." 
          className="pl-9 bg-background w-full"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>
      
      <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto">
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-full sm:w-[160px] bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.package} onValueChange={(v) => setFilters({ ...filters, package: v })}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder="Package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Packages</SelectItem>
            {packages.map(pkg => (
              <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          className="w-full sm:w-auto text-muted-foreground"
          onClick={handleClear}
          disabled={activeCount === 0}
        >
          <FilterX className="w-4 h-4 mr-2" />
          Clear {activeCount > 0 && `(${activeCount})`}
        </Button>
      </div>
    </div>
  );
};

export default CalendarFilterBar;