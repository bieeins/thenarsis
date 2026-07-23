/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("products");

  const record0 = new Record(collection);
    record0.id = "ov5zy0wgrfdk8tt";
    record0.set("package_name", "Basic Photography Package");
    record0.set("base_price", 500);
    record0.set("category", "Photography");
    record0.set("description", "Standard photography package for events");
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
    record1.id = "cse86albqefeoso";
    record1.set("package_name", "Premium Videography Package");
    record1.set("base_price", 1200);
    record1.set("category", "Videography");
    record1.set("description", "Professional videography with editing");
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
    record2.id = "gx5e77dhkgseoti";
    record2.set("package_name", "Complete Bundle");
    record2.set("base_price", 1800);
    record2.set("category", "Bundle");
    record2.set("description", "Photography and videography combined");
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
  const seededRecordIds = ["gx5e77dhkgseoti", "cse86albqefeoso", "ov5zy0wgrfdk8tt"];
  for (const seededRecordId of seededRecordIds) {
    try {
      app.delete(app.findRecordById("products", seededRecordId));
    } catch (error) {
      if (error.message.includes("no rows in result set")) {
        continue;
      }
      throw error;
    }
  }
})