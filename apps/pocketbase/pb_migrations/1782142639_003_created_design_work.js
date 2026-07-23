/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fetch related collections to get their IDs
  const ordersCollection = app.findCollectionByNameOrId("orders");
  const usersCollection = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    "createRule": "@request.auth.role = 'owner'",
    "deleteRule": "@request.auth.role = 'owner'",
    "fields":     [
          {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text7559155347",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
          },
          {
                "hidden": false,
                "id": "relation0374406304",
                "name": "order_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": ordersCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "relation7340237206",
                "name": "designer_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": usersCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "editor2573997262",
                "name": "design_notes",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "editor"
          },
          {
                "hidden": false,
                "id": "select8830970150",
                "name": "status",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "Waiting",
                      "Proses",
                      "Revisi",
                      "Done"
                ]
          },
          {
                "hidden": false,
                "id": "number0424072597",
                "name": "design_fee",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "number",
                "max": null,
                "min": 0,
                "onlyInt": false
          },
          {
                "hidden": false,
                "id": "text8221963782",
                "name": "design_file_link",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
          },
          {
                "hidden": false,
                "id": "file2612923013",
                "name": "design_file",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "file",
                "maxSelect": 1,
                "maxSize": 20971520,
                "mimeTypes": [],
                "thumbs": []
          },
          {
                "hidden": false,
                "id": "autodate3675282330",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
          },
          {
                "hidden": false,
                "id": "autodate5283228134",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
          }
    ],
    "id": "pbc_2421222202",
    "indexes": [],
    "listRule": "designer_id = @request.auth.id || @request.auth.role = 'owner'",
    "name": "design_work",
    "system": false,
    "type": "base",
    "updateRule": "designer_id = @request.auth.id || @request.auth.role = 'owner'",
    "viewRule": "designer_id = @request.auth.id || @request.auth.role = 'owner'"
  });

  try {
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("Collection already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("pbc_2421222202");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})