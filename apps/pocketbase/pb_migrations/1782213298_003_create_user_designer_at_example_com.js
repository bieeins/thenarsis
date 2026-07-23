/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const record = new Record(collection);
  record.id = "t1ru9d7pqhqdx86";
  record.set("email", "designer@example.com");
  record.setPassword("DesignPass123!");
  record.set("name", "Professional Designer");
  record.set("role", "designer");
  record.set("phone", "+1234567891");
  try {
    return app.save(record);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const record = app.findRecordById("users", "t1ru9d7pqhqdx86");
    return app.delete(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Auth record not found, skipping rollback");
      return;
    }
    throw e;
  }
})