/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const order = $app.findRecordById("orders", e.record.get("order_id"));
  const designerId = e.record.get("designer_id");
  
  const notification = new Record($app.findCollectionByNameOrId("notifications"));
  notification.set("user_id", designerId);
  notification.set("type", "assignment");
  notification.set("title", "New design work assigned");
  notification.set("message", "New design work assigned: " + order.get("event_name"));
  notification.set("related_order_id", e.record.get("order_id"));
  
  $app.save(notification);
  e.next();
}, "design_work");