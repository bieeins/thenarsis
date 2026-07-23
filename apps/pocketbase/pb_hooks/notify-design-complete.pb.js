/// <reference path="../pb_data/types.d.ts" />
onRecordUpdate((e) => {
  const original = e.record.original();
  const newStatus = e.record.get("status");
  const oldStatus = original.get("status");
  
  if (oldStatus !== "Done" && newStatus === "Done") {
    const orderId = e.record.get("order_id");
    const order = $app.findRecordById("orders", orderId);
    
    const crewAssignments = $app.findRecordsByFilter("crew_assignments", "order_id = '" + orderId + "'", "", 1000, 0);
    
    for (let i = 0; i < crewAssignments.length; i++) {
      const crewId = crewAssignments[i].get("crew_id");
      
      const notification = new Record($app.findCollectionByNameOrId("notifications"));
      notification.set("user_id", crewId);
      notification.set("type", "design_ready");
      notification.set("title", "Design files ready");
      notification.set("message", "Design files ready for: " + order.get("event_name"));
      notification.set("related_order_id", orderId);
      
      $app.save(notification);
    }
  }
  
  e.next();
}, "design_work");