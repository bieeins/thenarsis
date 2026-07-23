import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { designWorkService } from '@/services/designWorkService.js';

export const useCrewEvents = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    const crewId = currentUser?.id;

    if (!crewId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignments = await crewAssignmentService.listAll({
        crewId,
        sort: 'created_at',
        order: 'desc',
      });

      if (assignments.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const mergedEvents = [];
      const failedAssignments = [];

      for (const assignment of assignments) {
        if (!assignment.order_id) {
          continue;
        }

        try {
          const order = assignment.order;
          if (!order) {
            throw new Error('Order not found for assignment');
          }

          const designWorks = await designWorkService.list({ orderId: order.id, perPage: 500 });
          const designWorksItems = designWorks.data || [];

          const product = order.product;
          const assigner = assignment.assigned_by_user;
          const filesCount = designWorksItems.reduce(
            (total, dw) => total + (dw.design_file ? dw.design_file.length : 0),
            0
          );

          mergedEvents.push({
            id: assignment.id,
            crew_assignment_id: assignment.id,
            attendance_status: assignment.attendance_status || 'pending',
            attendance_amount: assignment.attendance_amount || assignment.fee || 0,
            crew_notes: assignment.crew_notes || '',
            check_in_time: assignment.check_in_time || null,
            check_out_time: assignment.check_out_time || null,
            assigned_date: assignment.assigned_date || assignment.created_at,
            assigned_by: assigner?.name || 'System',
            assignment_status: assignment.status || 'pending',

            order_id: order.id,
            event_name: order.event_name || 'Unnamed Event',
            customer_name: order.customer_name || 'Unknown Customer',
            phone_number: order.phone_number || 'N/A',
            event_date: order.event_date || null,
            event_time: order.event_time || order.event_date || null,
            event_location: order.event_location || 'Location TBD',
            status: order.status || 'Pending',
            notes: order.notes || '',

            product_id: order.product_id || null,
            package_name: product?.package_name || 'Custom Package',

            design_files: designWorksItems,
            files_count: filesCount,

            created: order.created_at,
            updated: order.updated_at,
          });
        } catch (itemErr) {
          console.error(`[useCrewEvents] Error processing assignment ${assignment.id}:`, itemErr);
          failedAssignments.push({ id: assignment.id, message: itemErr?.message || 'Unknown error' });
        }
      }

      mergedEvents.sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0));

      if (failedAssignments.length > 0) {
        setError(
          `${failedAssignments.length} of ${assignments.length} assigned event(s) could not be loaded. Please contact the owner if this persists.`
        );
      }

      setEvents(mergedEvents);
    } catch (err) {
      console.error('[useCrewEvents] Fatal error during fetch cycle:', err);
      setError(err.message || 'Failed to load your assigned events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
};
