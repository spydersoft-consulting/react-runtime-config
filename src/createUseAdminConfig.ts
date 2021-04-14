import { InjectedProps, Config, ResolvedConfigValue, AdminFields } from "./types";
import { useCallback, useMemo } from "react";
import { useWatchLocalstorageEvents } from "./utils";

export function createUseAdminConfig<T extends Record<string, Config>, TNamespace extends string>(
  props: InjectedProps<T, TNamespace>,
) {
  return () => {
    const localstorageDep = useWatchLocalstorageEvents(props.storage, props.localOverride);

    const configKeys: (keyof T)[] = useMemo(() => Object.keys(props.schema), [props.schema]);

    const fields = useMemo(() => {
      return configKeys.map(key => ({
        key,
        path: `${props.namespace}.${key}`,
        ...props.schema[key],
        windowValue: props.getWindowValue(key),
        storageValue: props.getStorageValue(key),
        isFromStorage: props.getStorageValue(key) !== null,
        value: props.getConfig(key),
        set: (value: ResolvedConfigValue<T[typeof key]>) => props.setConfig(key, value),
      })) as AdminFields<T>;
    }, [localstorageDep, configKeys]);

    const reset = useCallback(() => {
      configKeys.forEach(path => {
        props.storage.removeItem(`${props.namespace}.${path}`);
      });
      window.dispatchEvent(new Event("storage"));
    }, [configKeys, props.namespace]);

    return {
      /**
       * List of all config values
       */
      fields,

      /**
       * Reset the store
       */
      reset,

      /**
       * Namespace
       */
      namespace: props.namespace,
    };
  };
}
