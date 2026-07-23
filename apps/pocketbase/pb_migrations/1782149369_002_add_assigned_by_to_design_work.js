/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const _pb_users_auth_Collection = app.findCollectionByNameOrId("_pb_users_auth_");
  const collection = app.findCollectionByNameOrId("design_work");

  const existing = collection.fields.getByName("assigned_by");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("assigned_by"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "assigned_by",
    required: false,
    collectionId: _pb_users_auth_Collection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("design_work");
    collection.fields.removeByName("assigned_by");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})