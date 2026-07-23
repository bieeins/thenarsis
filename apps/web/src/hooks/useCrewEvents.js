import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const useCrewEvents = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    const crewId = currentUser?.id;
    
    console.group(`[useCrewEvents] 🚀 Data Fetch Cycle (Simple Fetch)`);
    console.log(`(1) Hook Start - crew_id: ${crewId}`);

    if (!crewId) {
      console.warn('[useCrewEvents] ⚠️ No valid crewId available. Returning early.');
      setEvents([]);
      setLoading(false);
      console.groupEnd();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`(2) Fetching crew_assignments for crew_id="${crewId}"...`);
      const assignmentsRes = await pb.collection('crew_assignments').getList(1, 500, {
        filter: `crew_id="${crewId}"`,
        expand: 'assigned_by',
        sort: '-created',
        $autoCancel: false
      });

      const assignments = assignmentsRes.items;
      console.log(`(3) Fetch Complete: Retrieved ${assignments.length} crew_assignments.`);
      console.log(`    Assignments Raw Data:`, assignments);

      if (assignments.length === 0) {
        console.log(`[useCrewEvents] ℹ️ Empty crew_assignments. No events to display.`);
        setEvents([]);
        setLoading(false);
        console.groupEnd();
        return;
      }

      const mergedEvents = [];
      const failedAssignments = [];

      for (const assignment of assignments) {
        if (!assignment.order_id) {
          console.warn(`[useCrewEvents] ⚠️ Skipping assignment ${assignment.id} - missing order_id.`);
          continue;
        }

        try {
          console.log(`(4) Fetching related order for assignment ${assignment.id} (order_id: ${assignment.order_id})...`);
          const order = await pb.collection('orders').getOne(assignment.order_id, {
            expand: 'product_id',
            $autoCancel: false
          });
          
          console.log(`    ✅ Order Fetched: ${order.id} - ${order.event_name}`);

          console.log(`(5) Fetching design_work for order ${order.id}...`);
          const designWorkRes = await pb.collection('design_work').getList(1, 500, {
            filter: `order_id="${order.id}"`,
            $autoCancel: false
          });
          
          const designWorks = designWorkRes.items;
          console.log(`    ✅ Design Work Fetched: ${designWorks.length} records found.`);

          // Extract product details and calculate files count
          const product = order.expand?.product_id;
          const assigner = assignment.expand?.assigned_by;
          const filesCount = designWorks.reduce((total, dw) => total + (dw.design_file ? dw.design_file.length : 0), 0);

          mergedEvents.push({
            id: assignment.id,
            crew_assignment_id: assignment.id,
            attendance_status: assignment.attendance_status || 'pending',
            attendance_amount: assignment.attendance_amount || assignment.fee || 0,
            crew_notes: assignment.crew_notes || '',
            check_in_time: assignment.check_in_time || null,
            check_out_time: assignment.check_out_time || null,
            assigned_date: assignment.assigned_date || assignment.created,
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
            
            design_files: designWorks,
            files_count: filesCount,
            
            created: order.created,
            updated: order.updated
          });

        } catch (itemErr) {
          console.error(`[useCrewEvents] ❌ ERROR processing assignment ${assignment.id}:`, itemErr);
          failedAssignments.push({ id: assignment.id, message: itemErr?.message || 'Unknown error' });
          // Continue processing remaining assignments even if one fails
        }
      }

      // Sort events by event_date descending
      mergedEvents.sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0));

      console.log(`(6) Final Merged Events Array:`, mergedEvents);
      console.log(`    Final Events Count: ${mergedEvents.length}`);

      if (failedAssignments.length > 0) {
        console.warn(`[useCrewEvents] ⚠️ ${failedAssignments.length} assignment(s) failed to load:`, failedAssignments);
        setError(`${failedAssignments.length} of ${assignments.length} assigned event(s) could not be loaded. Please contact the owner if this persists.`);
      }

      setEvents(mergedEvents);

    } catch (err) {
      console.error('[useCrewEvents] ❌ FATAL ERROR during fetch cycle:', err);
      setError(err.message || 'Failed to load your assigned events. Please try again.');
    } finally {
      console.log(`[useCrewEvents] --- END FETCH CYCLE ---`);
      console.groupEnd();
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchEvents();
    // Intentionally omitted realtime subscriptions to ensure stability
  }, [fetchEvents]);

  return { 
    events, 
    loading, 
    error, 
    refetch: fetchEvents 
  };
};