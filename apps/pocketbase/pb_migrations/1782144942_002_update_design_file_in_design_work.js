/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("design_work");
  const field = collection.fields.getByName("design_file");
  field.maxSelect = 5;
  field.maxSize = 20971520;
  field.mimeTypes = ["application/pdf", "image/jpeg", "image/png", "application/zip"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("design_work");
  const field = collection.fields.getByName("design_file");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.maxSelect = 1;
  field.maxSize = 20971520;
  field.mimeTypes = [];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})