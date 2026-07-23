/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("orders");

  const record0 = new Record(collection);
    record0.id = "yx3qmnw1pgq114k";
    record0.set("customer_name", "John Smith");
    record0.set("phone_number", "+1-555-0101");
    record0.set("event_name", "Wedding Ceremony");
    record0.set("event_date", "2024-06-15");
    record0.set("event_location", "Grand Ballroom, Downtown");
    const record0_product_idLookup = app.findFirstRecordByFilter("products", "package_name='Complete Bundle'");
    if (!record0_product_idLookup) { throw new Error("Lookup failed for product_id: no record in 'products' matching \"package_name='Complete Bundle'\""); }
    record0.set("product_id", record0_product_idLookup.id);
    record0.set("status", "Confirmed");
    record0.set("description", "Wedding photography and videography package");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.id = "o4dtencpyhotj6y";
    record1.set("customer_name", "Sarah Johnson");
    record1.set("phone_number", "+1-555-0102");
    record1.set("event_name", "Corporate Event");
    record1.set("event_date", "2024-07-20");
    record1.set("event_location", "Convention Center");
    const record1_product_idLookup = app.findFirstRecordByFilter("products", "package_name='Premium Videography Package'");
    if (!record1_product_idLookup) { throw new Error("Lookup failed for product_id: no record in 'products' matching \"package_name='Premium Videography Package'\""); }
    record1.set("product_id", record1_product_idLookup.id);
    record1.set("status", "Pending");
    record1.set("description", "Professional videography for corporate conference");
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.id = "2aq2ywihm4btacb";
    record2.set("customer_name", "Michael Chen");
    record2.set("phone_number", "+1-555-0103");
    record2.set("event_name", "Birthday Party");
    record2.set("event_date", "2024-08-10");
    record2.set("event_location", "Community Hall");
    const record2_product_idLookup = app.findFirstRecordByFilter("products", "package_name='Basic Photography Package'");
    if (!record2_product_idLookup) { throw new Error("Lookup failed for product_id: no record in 'products' matching \"package_name='Basic Photography Package'\""); }
    record2.set("product_id", record2_product_idLookup.id);
    record2.set("status", "In Progress");
    record2.set("description", "Birthday celebration photography");
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  const seededRecordIds = ["2aq2ywihm4btacb", "o4dtencpyhotj6y", "yx3qmnw1pgq114k"];
  for (const seededRecordId of seededRecordIds) {
    try {
      app.delete(app.findRecordById("orders", seededRecordId));
    } catch (error) {
      if (error.message.includes("no rows in result set")) {
        continue;
      }
      throw error;
    }
  }
})