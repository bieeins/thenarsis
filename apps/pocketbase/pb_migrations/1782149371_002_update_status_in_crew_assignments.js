/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("crew_assignments");
  const field = collection.fields.getByName("status");
  field.values = ["pending", "in_progress", "completed"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("crew_assignments");
  const field = collection.fields.getByName("status");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.values = ["pending", "paid"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})