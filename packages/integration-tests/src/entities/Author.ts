import { EntityManager } from "joist-orm";
import { AuthorCodegen, authorConfig, AuthorOpts } from "./entities";

export class Author extends AuthorCodegen {
  public beforeFlushRan = false;
  public afterCommitRan = false;

  constructor(em: EntityManager, opts: AuthorOpts) {
    super(em, opts);
  }

  /** Implements the business logic for a (synchronous) derived primitive. */
  get initials(): string {
    return (this.firstName || "")[0] + (this.lastName !== undefined ? this.lastName[0] : "");
  }

  get fullName(): string {
    return this.firstName + (this.lastName ? ` ${this.lastName}` : "");
  }

  set isPopular(isPopular: boolean | undefined) {
    super.isPopular = isPopular;
    // Testing protected fields
    if (isPopular && !this.wasEverPopular) {
      super.setWasEverPopular(true);
    }
  }
}

authorConfig.addRule((a) => {
  if (a.firstName && a.firstName === a.lastName) {
    return "firstName and lastName must be different";
  }
});

authorConfig.addRule((a) => {
  if (a.lastName === "NotAllowedLastName") {
    return "lastName is invalid";
  }
});

authorConfig.addRule((a) => {
  if (a.hasChanged.lastName) {
    return "lastName cannot be changed";
  }
});

authorConfig.addRule(async (a) => {
  const books = await a.books.load();
  if (books.length > 0 && books.find((b) => b.title === a.firstName)) {
    return "A book title cannot be the author's firstName";
  }
});

authorConfig.beforeFlush((author) => {
  author.beforeFlushRan = true;
});

authorConfig.afterCommit((author) => {
  author.afterCommitRan = true;
});
