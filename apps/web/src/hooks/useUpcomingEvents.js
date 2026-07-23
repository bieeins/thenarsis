import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';

const POLL_INTERVAL_MS = 30000;

export const useUpcomingEvents = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [hasAnyEvents, setHasAnyEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all assignments for the crew member with expanded order and product data
      const records = await crewAssignmentService.listAll({ crewId: currentUser.id });

      // Track if they have any events at all for empty state handling
      setHasAnyEvents(records.length > 0);

      // Define date range: today to today + 7 days
      const today = startOfDay(new Date());
      const nextWeek = endOfDay(addDays(new Date(), 7));

      // Map, filter, and sort the merged data
      const upcoming = records
        .map((assignment) => {
          const order = assignment.order;
          return {
            assignment_id: assignment.id,
            order_id: order?.id,
            event_name: order?.event_name,
            customer_name: order?.customer_name,
            event_date: order?.event_date,
            event_time: order?.event_date,
            event_location: order?.event_location,
            package_name: order?.product?.package_name,
            status: order?.status,
            total_amount: order?.total_amount,
            attendance_status: assignment.attendance_status,
            assigned_date: assignment.assigned_date || assignment.created_at,
          };
        })
        .filter((event) => {
          if (!event.event_date) return false;
          const eventDate = new Date(event.event_date);
          return isAfter(eventDate, today) && isBefore(eventDate, nextWeek);
        })
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 5); // Display max 5 upcoming events

      setEvents(upcoming);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError('Failed to load upcoming events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    loadData();
    const intervalId = setInterval(loadData, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadData, currentUser]);

  return { events, hasAnyEvents, loading, error, refetch: loadData };
};
