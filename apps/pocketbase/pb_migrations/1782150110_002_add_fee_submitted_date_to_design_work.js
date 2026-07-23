/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("design_work");

  const existing = collection.fields.getByName("fee_submitted_date");
  if (existing) {
    if (existing.type === "date") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("fee_submitted_date"); // exists with wrong type, remove first
  }

  collection.fields.add(new DateField({
    name: "fee_submitted_date",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("design_work");
    collection.fields.removeByName("fee_submitted_date");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})