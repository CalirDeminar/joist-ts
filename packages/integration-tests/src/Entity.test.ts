import { Author } from "@src/entities";
import { insertAuthor } from "@src/entities/inserts";
import { newEntityManager } from "@src/setupDbTests";

describe("Entity", () => {
  it("does not expose the metadata via Object.keys/enumerable properties", async () => {
    await insertAuthor({ first_name: "f" });
    const em = newEntityManager();
    const author = await em.load(Author, "1");
    const copy = deepCopyAndNormalize(author);
    expect(copy).toMatchInlineSnapshot(`
      {
        "allPublisherAuthorNames": {
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "opts": {
            "isReactive": true,
          },
        },
        "authors": {
          "fieldName": "authors",
          "loaded": undefined,
          "otherColumnName": "mentor_id",
          "otherFieldName": "mentor",
          "undefined": null,
        },
        "bookComments": {
          "fieldName": "bookComments",
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "reactiveHint": {
            "books": {
              "comments": "text",
            },
          },
        },
        "books": {
          "fieldName": "books",
          "loaded": undefined,
          "otherColumnName": "author_id",
          "otherFieldName": "author",
          "undefined": null,
        },
        "comments": {
          "fieldName": "comments",
          "loaded": undefined,
          "otherColumnName": "parent_author_id",
          "otherFieldName": "parent",
          "undefined": null,
        },
        "currentDraftBook": {
          "_isLoaded": false,
          "fieldName": "currentDraftBook",
          "loaded": undefined,
          "otherFieldName": "currentDraftAuthor",
          "undefined": null,
        },
        "favoriteBook": {
          "_isLoaded": false,
          "fieldName": "favoriteBook",
          "fn": {},
          "loadPromise": undefined,
          "loaded": undefined,
          "reactiveHint": {
            "books": {
              "reviews_ro": "rating",
            },
          },
          "undefined": null,
        },
        "image": {
          "_isLoaded": false,
          "fieldName": "image",
          "isCascadeDelete": true,
          "loaded": undefined,
          "otherColumnName": "author_id",
          "otherFieldName": "author",
          "undefined": null,
        },
        "latestComment": {
          "_isLoaded": false,
          "loadPromise": undefined,
          "opts": {
            "get": {},
            "isLoaded": {},
            "load": {},
          },
          "undefined": null,
        },
        "latestComment2": {
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "opts": {
            "isReactive": true,
          },
        },
        "latestComments": {
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "opts": {},
        },
        "mentor": {
          "_isLoaded": false,
          "fieldName": "mentor",
          "loaded": undefined,
          "otherFieldName": "authors",
          "undefined": null,
        },
        "numberOfBooks": {
          "fieldName": "numberOfBooks",
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "reactiveHint": [
            "books",
            "firstName",
          ],
        },
        "numberOfBooks2": {
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "opts": {
            "isReactive": true,
          },
        },
        "numberOfPublicReviews": {
          "fieldName": "numberOfPublicReviews",
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "reactiveHint": {
            "books": {
              "reviews": [
                "isPublic",
                "isPublic2",
                "rating",
              ],
            },
          },
        },
        "numberOfPublicReviews2": {
          "fieldName": "numberOfPublicReviews2",
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "reactiveHint": {
            "books": {
              "reviews": [
                "isPublic",
                "isTest",
                "rating",
              ],
            },
          },
        },
        "publisher": {
          "_isLoaded": false,
          "fieldName": "publisher",
          "loaded": undefined,
          "otherFieldName": "authors",
          "undefined": null,
        },
        "reviewedBooks": {
          "_isLoaded": false,
          "loadPromise": undefined,
          "opts": {
            "add": {},
            "get": {},
            "isLoaded": {},
            "load": {},
            "remove": {},
            "set": {},
          },
        },
        "reviews": {
          "_isLoaded": false,
          "loadPromise": undefined,
          "opts": {
            "get": {},
            "isLoaded": {},
            "load": {},
          },
        },
        "tags": {
          "addedBeforeLoaded": undefined,
          "columnName": "author_id",
          "fieldName": "tags",
          "joinTableName": "authors_to_tags",
          "loaded": undefined,
          "otherColumnName": "tag_id",
          "otherFieldName": "authors",
          "removedBeforeLoaded": undefined,
        },
        "tagsOfAllBooks": {
          "fieldName": "tagsOfAllBooks",
          "fn": {},
          "loadPromise": undefined,
          "loaded": false,
          "reactiveHint": {
            "books": {
              "tags": "name",
            },
          },
        },
        "transientFields": {
          "afterCommitIdIsSet": false,
          "afterCommitIsDeletedEntity": false,
          "afterCommitIsNewEntity": false,
          "afterCommitRan": false,
          "afterValidationRan": false,
          "ageRuleInvoked": 0,
          "beforeCreateRan": false,
          "beforeDeleteRan": false,
          "beforeFlushRan": false,
          "beforeUpdateRan": false,
          "bookCommentsCalcInvoked": 0,
          "deleteDuringFlush": false,
          "graduatedRuleInvoked": 0,
          "mentorRuleInvoked": 0,
          "numberOfBooksCalcInvoked": 0,
          "setGraduatedInFlush": false,
        },
        "userOneToOne": {
          "_isLoaded": false,
          "fieldName": "userOneToOne",
          "isCascadeDelete": false,
          "loaded": undefined,
          "otherColumnName": "author_id",
          "otherFieldName": "authorManyToOne",
          "undefined": null,
        },
      }
    `);
  });
});

// Based on the deep copy that was tripping up Webstorm
function deepCopyAndNormalize(value: any) {
  const active: unknown[] = [];
  return (function doCopy(value, path): any {
    if (value == null) {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
      return value;
    }
    if (value instanceof RegExp) {
      return value;
    }

    if (active.indexOf(value) !== -1) {
      return "[Circular reference found] Truncated by IDE";
    }
    active.push(value);
    try {
      if (Array.isArray(value)) {
        return value.map(function (element, i) {
          return doCopy(element, `${path}.${i}`);
        });
      }

      if (isObject(value)) {
        var keys = Object.keys(value);
        keys.sort();
        var ret: any = {};
        keys.forEach(function (key) {
          // If we hint anything with `.hooks` assume it's metadata
          if (key === "hooks") {
            throw new Error(`Recursed into the metadata: ${path}`);
          }
          ret[key] = doCopy(value[key], `${path}.${key}`);
        });
        return ret;
      }
      return value;
    } finally {
      active.pop();
    }
  })(value, "value");
}

function isObject(val: any): boolean {
  return val === Object(val);
}
