/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("crew_assignments");

  const existing = collection.fields.getByName("attendance_amount");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("attendance_amount"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "attendance_amount",
    required: false,
    min: 0
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("crew_assignments");
    collection.fields.removeByName("attendance_amount");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})