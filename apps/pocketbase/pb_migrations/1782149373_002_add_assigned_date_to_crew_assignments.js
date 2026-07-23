/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("crew_assignments");

  const existing = collection.fields.getByName("assigned_date");
  if (existing) {
    if (existing.type === "autodate") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("assigned_date"); // exists with wrong type, remove first
  }

  collection.fields.add(new AutodateField({
    name: "assigned_date",
    onCreate: true,
    onUpdate: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("crew_assignments");
    collection.fields.removeByName("assigned_date");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})