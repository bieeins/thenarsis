import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

const CalendarSummaryCards = ({ stats }) => {
  const { total, pending, inProgress, completed, cancelled } = stats;

  const getPercentage = (count) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <Card className="bg-[#0a0a0a] text-white border-transparent shadow-md hover:-translate-y-1 transition-transform duration-200">
        <CardContent className="p-5 flex flex-col items-start">
          <div className="p-2.5 bg-white/10 rounded-lg mb-3">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium text-white/70">Total Events</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold font-numeric">{total}</p>
            <span className="text-xs text-white/50">This Month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 text-amber-900 border-amber-200 shadow-sm hover:-translate-y-1 transition-transform duration-200">
        <CardContent className="p-5 flex flex-col items-start">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-amber-700/80">Pending</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold font-numeric">{pending}</p>
            <span className="text-xs font-medium text-amber-600/80">{getPercentage(pending)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 text-blue-900 border-blue-200 shadow-sm hover:-translate-y-1 transition-transform duration-200">
        <CardContent className="p-5 flex flex-col items-start">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg mb-3">
            <PlayCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-blue-700/80">In Progress</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold font-numeric">{inProgress}</p>
            <span className="text-xs font-medium text-blue-600/80">{getPercentage(inProgress)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 text-emerald-900 border-emerald-200 shadow-sm hover:-translate-y-1 transition-transform duration-200">
        <CardContent className="p-5 flex flex-col items-start">
          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-emerald-700/80">Completed</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold font-numeric">{completed}</p>
            <span className="text-xs font-medium text-emerald-600/80">{getPercentage(completed)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-50 text-red-900 border-red-200 shadow-sm hover:-translate-y-1 transition-transform duration-200">
        <CardContent className="p-5 flex flex-col items-start">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-lg mb-3">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-red-700/80">Cancelled</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold font-numeric">{cancelled}</p>
            <span className="text-xs font-medium text-red-600/80">{getPercentage(cancelled)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarSummaryCards;