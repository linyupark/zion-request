import { useMemo, useState } from "react";
import useSWR, { MutatorCallback, SWRConfiguration, SWRResponse } from "swr";
import mitt from "mitt";

const emitter = mitt();

interface NewData {
  [key: string]: any;
}

interface UseRequestOptions {
  // The request id defaults to''
  key?: string;
  manual?: boolean;
  // Default request parameters
  params?: any | null;
  // Default data alias swr.fallbackData
  initialData?: any;
  // SWR config
  swr?: SWRConfiguration;
}

interface UseRequestResp extends Omit<SWRResponse, "mutate"> {
  loading: boolean;
  run: (newParams?: any, reload?: boolean) => any;
  refresh: () => void;
  params?: any;
  mutate: (newData: NewData) => void;
  swrMutate: <Data = any>(
    data?: Data | Promise<Data> | MutatorCallback<Data>,
    shouldRevalidate?: boolean
  ) => Promise<Data | undefined>;
}

/**
 * React useRequest hook
 * @param fetcher () => Promise<any>
 * @param options UseRequestOptions
 * @returns UseRequestResp
 */
const useRequest = (
  fetcher: (params?: null | any, key?: string) => Promise<any>,
  options?: UseRequestOptions
): UseRequestResp => {
  const mergeOptions = {
    key: "",
    manual: false, // Manual execution
    params: null,
    initialData: undefined,
    ...options,
    swr: {
      // https://swr.vercel.app/zh-CN/docs/options
      revalidateOnFocus: false,
      ...(options?.swr ?? {})
    }
  };

  const customKey = fetcher.name + mergeOptions.key;

  // SWR condition request
  const [key, setKey] = useState(
    mergeOptions.manual === true ? null : customKey
  );

  // Request parameter
  const [params, setParams] = useState(mergeOptions.params);

  // Request parameter precedence
  const swrFetcher = (key: string | undefined, params: any) =>
    fetcher(params, key);

  // Main
  const swrResp: SWRResponse = useSWR(
    key ? (params === null ? key : [key, params]) : null,
    swrFetcher,
    {
      ...mergeOptions.swr,
      onSuccess: (data, key, config) => {
        emitter.emit(customKey + "onSuccess", data);
        if (mergeOptions.swr.onSuccess) {
          mergeOptions.swr.onSuccess(data, key, config);
        }
      },
      onError: (err, key, config) => {
        emitter.emit(customKey + "onError", err);
        if (mergeOptions.swr.onError) {
          mergeOptions.swr.onError(err, key, config);
        }
      },
      fallbackData: mergeOptions.initialData
    }
  );

  // Refresh with the same request parameters (Will not trigger loading)
  const refresh = () => {
    const type = Object.prototype.toString.call(swrResp.data);
    let newData = swrResp.data;

    if (type.includes("Array")) {
      newData = [...swrResp.data];
    }
    if (type.includes("Object")) {
      newData = { ...swrResp.data };
    }
    return swrResp.mutate(newData, true);
  };

  // Manual execution request
  const run = async (newParams?: any, reload?: boolean) => {
    if (
      key !== null &&
      JSON.stringify(params) === JSON.stringify(newParams) &&
      reload
    ) {
      // 发出请求刷新
      return refresh();
    }
    return new Promise((rs, rj) => {
      emitter.on(customKey + "onSuccess", (data) => {
        emitter.off(customKey + "onSuccess");
        rs(data);
      });
      emitter.on(customKey + "onError", (err) => {
        emitter.off(customKey + "onError");
        rj(err);
      });
      setParams(newParams);
      setKey(customKey);
    });
  };

  // Update the local data immediately, but disable the revalidation
  const mutate = (newData: NewData) => {
    const type = Object.prototype.toString.call(swrResp.data);
    let mergeData = newData;

    if (type.includes("Object")) {
      mergeData = { ...swrResp.data, ...newData };
    }
    return swrResp.mutate(mergeData, false);
  };

  // Returns whether the loading state is triggered
  const loading = useMemo(() => {
    if (key === null) {
      return (
        swrResp.data === undefined && swrResp.isValidating && !swrResp.error
      );
    }
    return swrResp.isValidating;
  }, [key, swrResp]);

  return {
    loading,
    run,
    refresh,
    params,
    ...swrResp,
    mutate,
    swrMutate: swrResp.mutate
  };
};

export default useRequest;
