/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("crew_assignments");

  const existing = collection.fields.getByName("attendance_confirmation");
  if (existing) {
    if (existing.type === "bool") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("attendance_confirmation"); // exists with wrong type, remove first
  }

  collection.fields.add(new BoolField({
    name: "attendance_confirmation",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("crew_assignments");
    collection.fields.removeByName("attendance_confirmation");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})