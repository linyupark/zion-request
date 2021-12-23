import { useState } from 'react'
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'

interface UseRequestOptions {
  // The request id defaults to''
  key?: string
  manual?: boolean
  // Default request parameters
  params?: any
  swr?: SWRConfiguration
}

interface UseRequestResp extends SWRResponse {
  loading: boolean
  run: (newParams?: any) => void
  refresh: () => void
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
  const swrResp: SWRResponse = useSWR(
    key ? [key, params] : null,
    fetcher,
    mergeOptions.swr,
  )

  // Manual execution request
  const run = (newParams?: any) => {
    setKey(fetcher.name + mergeOptions.key)
    setParams(newParams)
  }

  // Refresh with the same request parameters (Will not trigger loading)
  const refresh = () => swrResp.mutate({ ...swrResp.data }, true)

  // Returns whether the loading state is triggered
  const loading = swrResp.data === undefined && swrResp.isValidating

  return {
    ...swrResp,
    loading,
    run,
    refresh,
  }
}

export default useRequest
