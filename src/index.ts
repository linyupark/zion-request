import { useState } from 'react'
import useSWR, { MutatorCallback, SWRConfiguration, SWRResponse } from 'swr'

interface NewData {
  [key: string]: any
}

interface UseRequestOptions {
  // The request id defaults to''
  key?: string
  manual?: boolean
  // Default request parameters
  params: null | any
  // Default data alias swr.fallbackData
  initialData?: any
  // SWR config
  swr?: SWRConfiguration
}

interface UseRequestResp extends Omit<SWRResponse, 'mutate'> {
  loading: boolean
  run: (newParams?: any) => void
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
  fetcher: () => Promise<any>,
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

  // Main
  const swrResp: SWRResponse = useSWR(key ? [key, params] : null, fetcher, {
    ...mergeOptions.swr,
    fallbackData: mergeOptions.initialData,
  })

  // Manual execution request
  const run = (newParams?: any) => {
    setKey(fetcher.name + mergeOptions.key)
    setParams(newParams)
  }

  // Refresh with the same request parameters (Will not trigger loading)
  const refresh = () => swrResp.mutate({ ...swrResp.data }, true)

  // Update the local data immediately, but disable the revalidation
  const mutate = (newData: NewData) =>
    swrResp.mutate({ ...swrResp.data, ...newData }, false)

  // Returns whether the loading state is triggered
  const loading = swrResp.data === undefined && swrResp.isValidating

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
