/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("crew_assignments");

  const existing = collection.fields.getByName("attendance_status");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("attendance_status"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "attendance_status",
    required: false,
    values: ["belum_jawab", "hadir", "tidak_hadir"]
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("crew_assignments");
    collection.fields.removeByName("attendance_status");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})