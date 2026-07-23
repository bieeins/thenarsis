/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2421222202");

  // Remove design_file_link field
  collection.fields.removeById("text8221963782");

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2421222202");

  // Restore design_file_link field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text8221963782",
    "max": 0,
    "min": 0,
    "name": "design_file_link",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  return app.save(collection);
})
