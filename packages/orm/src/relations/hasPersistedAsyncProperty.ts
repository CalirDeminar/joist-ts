import { Entity } from "../Entity";
import { currentlyInstantiatingEntity, getEmInternalApi } from "../EntityManager";
import { getMetadata } from "../EntityMetadata";
import { isLoaded, setField } from "../index";
import { Reacted, ReactiveHint } from "../reactiveHints";

const I = Symbol();

/**
 * A `PersistedAsyncProperty` is a value that is derived from other entities/values,
 * similar to an `AsyncProperty`, but it is also persisted in the database.
 *
 * This allows callers (or SQL queries) to access the value without first calling
 * `await load()` on the property.
 *
 * So, unlike `AsyncProperty`, `.get` is always available; if the property is unloaded,
 * then `.get` will return the last-calculated value, but if the property is loaded,
 * then it will go ahead and invoke function to calculate the latest value (i.e. so
 * that you can observe the latest & greatest value w/o waiting for `em.flush` to
 * re-calc the value while persisting to the database.
 */
export interface PersistedAsyncProperty<T extends Entity, V> {
  isLoaded: boolean;
  isSet: boolean;

  /**
   * Calculates the latest derived value.
   *
   * Users are not required to call this method explicitly, as Joist will keep the
   * persisted value automatically in-sync, but if for some reason (code changes,
   * bug fixes, etc.) you need to trigger an explicit recalc, you can call `.load()`,
   * any dependent data will be loaded from the database, and the latest value
   * returned, and then later stored to the database on `em.flush`.
   *
   * Note that persisted properties used in load hints, i.e. `em.populate`s that
   * accidentally list reactive fields (instead of just relations) will not have
   * `.load()` invoked, and will instead use the previously-calculated value.
   */
  load(opts?: { forceReload?: boolean }): Promise<V>;

  /** If loaded, returns the latest derived value, or if unload returns the previously-calculated value. */
  get: V;

  /**
   * Returns the as-of-last-flush previously-calculated value.
   *
   * This is useful if you have to purposefully avoid using the lambda to calc the latest value,
   * i.e. if you're in a test and want to watch a calculated value change from some dummy value
   * to the new derived value.
   * */
  fieldValue: V;

  [I]?: T;
}

/**
 * Creates a calculated derived value from a load hint + lambda.
 *
 * The property can be accessed by default as a promise, with `someProperty.load()`.
 *
 * But if `someProperty` is used as a populate hint, then it can be accessed synchronously,
 * with `someProperty.get`.
 */
export function hasPersistedAsyncProperty<T extends Entity, const H extends ReactiveHint<T>, V>(
  fieldName: keyof T & string,
  hint: H,
  fn: (entity: Reacted<T, H>) => V,
): PersistedAsyncProperty<T, V> {
  const entity = currentlyInstantiatingEntity as T;
  return new PersistedAsyncPropertyImpl(entity, fieldName, hint, fn);
}

export class PersistedAsyncPropertyImpl<T extends Entity, H extends ReactiveHint<T>, V>
  implements PersistedAsyncProperty<T, V>
{
  readonly #entity: T;
  readonly #reactiveHint: H;
  private loaded = false;
  private loadPromise: any;
  constructor(
    entity: T,
    public fieldName: keyof T & string,
    public reactiveHint: H,
    private fn: (entity: Reacted<T, H>) => V,
  ) {
    this.#entity = entity;
    this.#reactiveHint = reactiveHint;
  }

  load(opts?: { forceReload?: boolean }): Promise<V> {
    const { loadHint } = this;
    if (!this.loaded || opts?.forceReload) {
      return (this.loadPromise ??= this.#entity.em
        .populate(this.#entity, { hint: this.loadHint, isPersistedAsyncPropertyLoad: true } as any)
        .then(() => {
          this.loadPromise = undefined;
          this.loaded = true;
          // Go through `this.get` so that `setField` is called to set our latest value
          return this.get;
        }));
    }
    return Promise.resolve(this.get);
  }

  /** Returns either the latest calculated value (if loaded) or the previously-calculated value (if not loaded). */
  get get(): V {
    const { fn } = this;
    if (this.loaded || (!this.isSet && isLoaded(this.#entity, this.loadHint))) {
      const newValue = fn(this.#entity as Reacted<T, H>);
      // It's cheap to set this every time we're called, i.e. even if it's not the
      // official "being called during em.flush" update (...unless we're accessing it
      // during the validate phase of `em.flush`, then skip it to avoid tripping up
      // the "cannot change entities during flush" logic.)
      if (!getEmInternalApi(this.#entity.em).isValidating) {
        setField(this.#entity, this.fieldName, newValue);
      }
      return newValue;
    } else if (this.isSet) {
      return this.#entity.__orm.data[this.fieldName];
    } else {
      throw new Error(`${this.fieldName} has not been derived yet`);
    }
  }

  get fieldValue(): V {
    return this.#entity.__orm.data[this.fieldName];
  }

  get isSet() {
    return this.fieldName in this.#entity.__orm.data;
  }

  get isLoaded() {
    return this.loaded;
  }

  get loadHint(): any {
    return getMetadata(this.#entity).config.__data.cachedReactiveLoadHints[this.fieldName];
  }
}

/** Type guard utility for determining if an entity field is an AsyncProperty. */
export function isPersistedAsyncProperty(
  maybeAsyncProperty: any,
): maybeAsyncProperty is PersistedAsyncProperty<any, any> {
  return maybeAsyncProperty instanceof PersistedAsyncPropertyImpl;
}

/** Type guard utility for determining if an entity field is a loaded AsyncProperty. */
export function isLoadedAsyncProperty(maybeAsyncProperty: any): maybeAsyncProperty is PersistedAsyncProperty<any, any> {
  return isPersistedAsyncProperty(maybeAsyncProperty) && maybeAsyncProperty.isLoaded;
}
