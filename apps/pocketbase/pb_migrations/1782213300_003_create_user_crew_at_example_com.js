/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  const record = new Record(collection);
  record.id = "zprtbfbw0ff6fyx";
  record.set("email", "crew@example.com");
  record.setPassword("CrewPass123!");
  record.set("name", "Crew Member");
  record.set("role", "crew");
  record.set("phone", "+1234567892");
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
    const record = app.findRecordById("users", "zprtbfbw0ff6fyx");
    return app.delete(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Auth record not found, skipping rollback");
      return;
    }
    throw e;
  }
})