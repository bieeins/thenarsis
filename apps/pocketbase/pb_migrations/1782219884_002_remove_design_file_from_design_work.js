/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("design_work");
  collection.fields.removeByName("design_file");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("design_work");
  collection.fields.add(new FileField({
    name: "design_file",
    required: false,
    maxSelect: 5,
    maxSize: 20971520
  }));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})