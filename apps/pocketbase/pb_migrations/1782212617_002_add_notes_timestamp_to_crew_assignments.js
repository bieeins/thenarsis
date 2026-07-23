/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("crew_assignments");

  const existing = collection.fields.getByName("notes_timestamp");
  if (existing) {
    if (existing.type === "autodate") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("notes_timestamp"); // exists with wrong type, remove first
  }

  collection.fields.add(new AutodateField({
    name: "notes_timestamp",
    required: false,
    onCreate: true,
    onUpdate: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("crew_assignments");
    collection.fields.removeByName("notes_timestamp");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})