import useRequest from '..'

const getJSONDataFromAPI = params => {
  return fetch('http://xxxx?' + new URLSearchParams(params ?? {}).toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => res.json())
    .catch(err => console.error(err))
}

export default () => {
  const getData = useRequest(getJSONDataFromAPI, {
    // Different key values for different request cases
    key: '',
    // Request manual
    manual: true,
    // Default params
    params: {
      keywords: 'useRequest',
    },
    // Default data
    initialData: {
      data: [],
    },
    swr: {
      // ... SWR options https://swr.vercel.app/zh-CN/docs/options
    },
  })

  // The same request parameters are triggered only once for a short period of time
  const getDataOnce = () => {
    getData.run({
      keywords: '1',
    })
  }

  const getDataRefresh = () => {
    // Refresh with last entry
    getData.refresh()
  }

  const getDataMutate = () => {
    // Update the local data immediately, but disable the revalidation
    getData.mutate({
      data: [{ text: 'Mutate' }],
    })
  }

  if (getData.loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <p>
        output: <code>{JSON.stringify(getData.data)}</code>
      </p>
      <p>
        <button onClick={getDataOnce}>getDataOnce</button>
      </p>
      <p>
        <button onClick={getDataRefresh}>getDataRefresh</button>
      </p>
      <p>
        <button onClick={getDataMutate}>getDataMutate</button>
      </p>
    </div>
  )
}
