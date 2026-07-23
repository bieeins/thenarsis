import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

const CalendarControls = ({ currentDate, setCurrentDate, timezone, setTimezone }) => {
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevMonth} title="Previous Month (Left Arrow)">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNextMonth} title="Next Month (Right Arrow)">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={handleToday} className="ml-2 font-medium">
          Today
        </Button>
        <h2 className="text-2xl font-bold ml-4 min-w-[160px]">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Timezone:
        </div>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="Select Timezone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">GMT+00:00 (UTC)</SelectItem>
            <SelectItem value="Asia/Kolkata">GMT+05:30 (IST)</SelectItem>
            <SelectItem value="Asia/Jakarta">GMT+07:00 (WIB)</SelectItem>
            <SelectItem value="Asia/Singapore">GMT+08:00 (SGT)</SelectItem>
            <SelectItem value="Asia/Tokyo">GMT+09:00 (JST)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CalendarControls;