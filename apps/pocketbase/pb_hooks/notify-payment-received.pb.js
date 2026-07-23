/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const invoiceId = e.record.get("invoice_id");
  const invoice = $app.findRecordById("invoices", invoiceId);
  const orderId = invoice.get("order_id");
  
  const crewAssignments = $app.findRecordsByFilter("crew_assignments", "order_id = '" + orderId + "'", "", 1000, 0);
  const amount = e.record.get("amount");
  
  for (let i = 0; i < crewAssignments.length; i++) {
    const crewId = crewAssignments[i].get("crew_id");
    
    const notification = new Record($app.findCollectionByNameOrId("notifications"));
    notification.set("user_id", crewId);
    notification.set("type", "payment_received");
    notification.set("title", "Payment received");
    notification.set("message", "Payment received: " + amount + " IDR");
    notification.set("related_order_id", orderId);
    
    $app.save(notification);
  }
  
  e.next();
}, "payments");