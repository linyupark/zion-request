### @x011/request

Use [SWR](https://swr.vercel.app/zh-CN) in the way of [useRequest](https://ahooks.js.org/zh-CN/hooks/use-request/index) hook

### Examples
* [Basic](https://github.com/linyupark/zion-request/tree/master/src/example/basic.tsx)

### Change Logs
* [0.0.7] Bugfix & run function add new params reload, provider force send request with same params and trigger loading
* [0.0.4] Optimize the position of the request promise function parameter to the first place, add the use of example code
* [0.0.2] Add params SWR response and initialData parameter = swr.fallbackData, mutate => swrMutate, mutate will update the local data immediately, but disable the revalidation
* [0.0.1] Add default parameters, manually execute functions, and refresh interfaces that match useRequest, etc.

