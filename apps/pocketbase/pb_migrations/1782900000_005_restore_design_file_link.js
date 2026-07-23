/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("design_work");

  const existing = collection.fields.getByName("design_file_link");
  if (existing) {
    return; // field already exists, skip
  }

  collection.fields.add(new TextField({
    name: "design_file_link",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("design_work");
    collection.fields.removeByName("design_file_link");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
