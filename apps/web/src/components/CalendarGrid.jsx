import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isWeekend } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

const CalendarGrid = ({ currentDate, eventsByDate, onEventClick, timezone }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
    if (s === 'in progress') return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
    if (s === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
    if (s === 'cancelled') return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
  };

  const formatTimeWithZone = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone === 'UTC' ? 'UTC' : timezone
      }).format(date);
    } catch (e) {
      return format(new Date(dateString), 'HH:mm');
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col h-[800px]">
      {/* Header */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-auto overflow-hidden bg-border gap-px">
        <AnimatePresence mode="wait">
          {days.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const isWknd = isWeekend(day);

            return (
              <motion.div
                key={day.toString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.01 }}
                className={`min-h-[120px] bg-card p-2 flex flex-col transition-colors ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground/50' : ''} ${isWknd && isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto calendar-scroll space-y-1.5 pr-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`text-xs p-1.5 rounded border cursor-pointer transition-all truncate ${getEventColor(event.status)}`}
                      title={`${event.event_name} - ${event.customer_name}`}
                    >
                      <div className="font-semibold truncate">{event.event_name || 'Unnamed'}</div>
                      {event.product?.package_name && (
                        <div className="truncate opacity-70 text-[10px]">{event.product.package_name}</div>
                      )}
                      <div className="flex items-center gap-1 mt-0.5 opacity-80 text-[10px]">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{formatTimeWithZone(event.event_date)}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground font-medium py-1 hover:text-foreground cursor-pointer transition-colors">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarGrid;