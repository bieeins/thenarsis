/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const order = $app.findRecordById("orders", e.record.get("order_id"));
  const crewId = e.record.get("crew_id");
  
  const notification = new Record($app.findCollectionByNameOrId("notifications"));
  notification.set("user_id", crewId);
  notification.set("type", "assignment");
  notification.set("title", "New event assigned");
  notification.set("message", "New event assigned: " + order.get("event_name"));
  notification.set("related_order_id", e.record.get("order_id"));
  
  $app.save(notification);
  e.next();
}, "crew_assignments");