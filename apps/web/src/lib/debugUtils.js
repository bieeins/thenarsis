import pb from '@/lib/pocketbaseClient.js';

export const logCrewAssignments = async () => {
  console.group('🔍 [Debug] logCrewAssignments');
  try {
    console.log('Fetching all crew_assignments...');
    const records = await pb.collection('crew_assignments').getFullList({
      expand: 'order_id,crew_id,assigned_by',
      $autoCancel: false
    });
    console.log(`Found ${records.length} crew_assignments.`);
    console.table(records.map(r => ({
      id: r.id,
      crew_id: r.crew_id,
      order_id: r.order_id,
      status: r.status,
      attendance: r.attendance_status,
      assigned_by: r.assigned_by
    })));
    console.log('Full records:', records);
  } catch (err) {
    console.error('Error fetching crew_assignments:', err);
  }
  console.groupEnd();
};

export const logOrders = async () => {
  console.group('🔍 [Debug] logOrders');
  try {
    console.log('Fetching all orders...');
    const records = await pb.collection('orders').getFullList({
      expand: 'product_id,assigned_designer_id',
      $autoCancel: false
    });
    console.log(`Found ${records.length} orders.`);
    console.table(records.map(r => ({
      id: r.id,
      event_name: r.event_name,
      customer: r.customer_name,
      date: r.event_date,
      status: r.status
    })));
    console.log('Full records:', records);
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
  console.groupEnd();
};

export const logCurrentUser = () => {
  console.group('🔍 [Debug] logCurrentUser');
  const user = pb.authStore.model;
  if (!user) {
    console.warn('No user is currently authenticated.');
  } else {
    console.log('Authenticated User ID:', user.id);
    console.log('Authenticated User Role:', user.role);
    console.log('Authenticated User Email:', user.email);
    console.log('Full user object:', user);
  }
  console.groupEnd();
};

export const verifyCrewData = async (crew_id) => {
  console.group(`🔍 [Debug] verifyCrewData (crew_id: ${crew_id})`);
  if (!crew_id) {
    console.error('Error: crew_id parameter is required.');
    console.groupEnd();
    return;
  }

  try {
    console.log(`Verifying assignments for crew_id="${crew_id}"...`);
    const assignments = await pb.collection('crew_assignments').getFullList({
      filter: `crew_id="${crew_id}"`,
      expand: 'order_id',
      $autoCancel: false
    });

    console.log(`Found ${assignments.length} assignments for this crew member.`);
    if (assignments.length === 0) {
      console.warn('This crew member has no assignments.');
    } else {
      let validOrders = 0;
      let orphaned = 0;

      assignments.forEach((assignment, index) => {
        const order = assignment.expand?.order_id;
        if (order) {
          validOrders++;
          console.log(`[Valid] Assignment ${assignment.id} maps to Order ${order.id} (${order.event_name})`);
        } else {
          orphaned++;
          console.warn(`[Orphaned] Assignment ${assignment.id} has NO valid order! (Missing order_id: ${assignment.order_id})`);
        }
      });

      console.log(`Summary for crew_id="${crew_id}":`);
      console.log(`- Total Assignments: ${assignments.length}`);
      console.log(`- Valid Orders Linked: ${validOrders}`);
      console.log(`- Orphaned Assignments: ${orphaned}`);
    }
  } catch (err) {
    console.error(`Error verifying data for crew_id="${crew_id}":`, err);
  }
  console.groupEnd();
};

// Bind to window object for easy browser console access
if (typeof window !== 'undefined') {
  window.debugUtils = {
    logCrewAssignments,
    logOrders,
    logCurrentUser,
    verifyCrewData
  };
  console.log('🛠️ [Debug] debugUtils attached to window.debugUtils. Try running window.debugUtils.logCurrentUser() in console.');
}