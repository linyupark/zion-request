import { useMemo, useState } from 'react'
import useSWR, { MutatorCallback, SWRConfiguration, SWRResponse } from 'swr'

interface NewData {
  [key: string]: any
}

interface UseRequestOptions {
  // The request id defaults to''
  key?: string
  manual?: boolean
  // Default request parameters
  params?: any | null
  // Default data alias swr.fallbackData
  initialData?: any
  // SWR config
  swr?: SWRConfiguration
}

interface UseRequestResp extends Omit<SWRResponse, 'mutate'> {
  loading: boolean
  run: (newParams?: any, reload?: boolean) => void
  refresh: () => void
  params?: any
  mutate: (newData: NewData) => void
  swrMutate: <Data = any>(
    data?: Data | Promise<Data> | MutatorCallback<Data>,
    shouldRevalidate?: boolean,
  ) => Promise<Data | undefined>
}

/**
 * React useRequest hook
 * @param fetcher () => Promise<any>
 * @param options UseRequestOptions
 * @returns UseRequestResp
 */
const useRequest = (
  fetcher: (params?: null | any, key?: string) => Promise<any>,
  options?: UseRequestOptions,
): UseRequestResp => {
  const mergeOptions = {
    key: '',
    manual: false, // Manual execution
    params: null,
    initialData: undefined,
    ...options,
    swr: {
      // https://swr.vercel.app/zh-CN/docs/options
      revalidateOnFocus: false,
      ...(options?.swr ?? {}),
    },
  }

  // SWR condition request
  const [key, setKey] = useState(
    mergeOptions.manual === true ? null : fetcher.name + mergeOptions.key,
  )

  // Request parameter
  const [params, setParams] = useState(mergeOptions.params)

  // Request parameter precedence
  const swrFetcher = (key, params) => fetcher(params, key)

  // Main
  const swrResp: SWRResponse = useSWR(
    key ? (params === null ? key : [key, params]) : null,
    swrFetcher,
    {
      ...mergeOptions.swr,
      fallbackData: mergeOptions.initialData,
    },
  )

  // Manual execution request
  const run = (newParams?: any, reload?: boolean) => {
    if (
      key !== null &&
      JSON.stringify(params) === JSON.stringify(newParams) &&
      reload
    ) {
      // 发出请求刷新
      refresh()
      return
    }
    setParams(newParams)
    setKey(fetcher.name + mergeOptions.key)
  }

  // Refresh with the same request parameters (Will not trigger loading)
  const refresh = () => swrResp.mutate({ ...swrResp.data }, true)

  // Update the local data immediately, but disable the revalidation
  const mutate = (newData: NewData) =>
    swrResp.mutate({ ...swrResp.data, ...newData }, false)

  // Returns whether the loading state is triggered
  const loading = useMemo(() => {
    if (key === null) {
      return (
        swrResp.data === undefined && swrResp.isValidating && !swrResp.error
      )
    }
    return swrResp.isValidating
  }, [key, swrResp])

  return {
    loading,
    run,
    refresh,
    params,
    ...swrResp,
    mutate,
    swrMutate: swrResp.mutate,
  }
}

export default useRequest
