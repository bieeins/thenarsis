/// <reference path="../pb_data/types.d.ts" />
// Hook to validate crew_assignments referential integrity
// Prevents creation of records with non-existent references
// Logs integrity issues for audit trail

onRecordCreate((e) => {
  // Validate order_id exists
  const orderId = e.record.get("order_id");
  if (orderId) {
    try {
      const order = $app.findRecordById("orders", orderId);
      if (!order) {
        throw new BadRequestError("Referenced order_id does not exist in orders collection");
      }
    } catch (err) {
      throw new BadRequestError("Referenced order_id does not exist in orders collection: " + err.message);
    }
  }

  // Validate crew_id exists
  const crewId = e.record.get("crew_id");
  if (crewId) {
    try {
      const crew = $app.findRecordById("users", crewId);
      if (!crew) {
        throw new BadRequestError("Referenced crew_id does not exist in users collection");
      }
    } catch (err) {
      throw new BadRequestError("Referenced crew_id does not exist in users collection: " + err.message);
    }
  }

  // Validate assigned_by exists (if provided)
  const assignedBy = e.record.get("assigned_by");
  if (assignedBy) {
    try {
      const assignedByUser = $app.findRecordById("users", assignedBy);
      if (!assignedByUser) {
        throw new BadRequestError("Referenced assigned_by does not exist in users collection");
      }
    } catch (err) {
      throw new BadRequestError("Referenced assigned_by does not exist in users collection: " + err.message);
    }
  }

  e.next();
}, "crew_assignments");

// Hook to log crew_assignments updates for audit trail
onRecordAfterCreateSuccess((e) => {
  console.log("✓ Crew assignment created: " + e.record.id + " | Order: " + e.record.get("order_id") + " | Crew: " + e.record.get("crew_id"));
  e.next();
}, "crew_assignments");

onRecordAfterDeleteSuccess((e) => {
  console.log("✓ Crew assignment deleted: " + e.record.id + " | Order: " + e.record.get("order_id") + " | Crew: " + e.record.get("crew_id"));
  e.next();
}, "crew_assignments");