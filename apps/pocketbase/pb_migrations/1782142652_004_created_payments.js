/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fetch related collections to get their IDs
  const invoicesCollection = app.findCollectionByNameOrId("invoices");

  const collection = new Collection({
    "createRule": "@request.auth.role = 'owner'",
    "deleteRule": "@request.auth.role = 'owner'",
    "fields":     [
          {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text8078704467",
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
                "id": "relation9106806158",
                "name": "invoice_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": invoicesCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "number7832207776",
                "name": "amount",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "number",
                "max": null,
                "min": 0,
                "onlyInt": false
          },
          {
                "hidden": false,
                "id": "date1936421567",
                "name": "payment_date",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "date",
                "max": "",
                "min": ""
          },
          {
                "hidden": false,
                "id": "select0794198374",
                "name": "payment_method",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "Bank Transfer",
                      "Cash",
                      "Check",
                      "Other"
                ]
          },
          {
                "hidden": false,
                "id": "editor5968670243",
                "name": "notes",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "editor"
          },
          {
                "hidden": false,
                "id": "autodate4117776310",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
          },
          {
                "hidden": false,
                "id": "autodate3914654592",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
          }
    ],
    "id": "pbc_7629850439",
    "indexes": [],
    "listRule": "@request.auth.role = 'owner'",
    "name": "payments",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = 'owner'",
    "viewRule": "@request.auth.role = 'owner'"
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
    const collection = app.findCollectionByNameOrId("pbc_7629850439");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})