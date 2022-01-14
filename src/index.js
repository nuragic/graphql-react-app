import React, { useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { createClient } from "graphql-ws";
import { QueryClient, QueryClientProvider } from "react-query";
import App from "./App";

import "./index.css";

const client = createClient({
  url: "ws://localhost:4000/graphql",
  lazy: false,
});

// query, mutation
async function queryOrMutation(subscribePayload) {
  return new Promise((resolve, reject) => {
    let result;
    const cleanUp = client.subscribe(subscribePayload, {
      next: (data) => (result = data),
      complete: () => {
        cleanUp();
        return resolve(result);
      },
      error: reject,
    });
  });
}

// subscription
function useSubscription(operationPayload, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const subscription = client.subscribe(operationPayload, {
      next: (result) => {
        callbackRef.current(result);
      },
      error: (errors) => {
        callbackRef.current({ errors });
      },
      complete: () => {
        subscription.unsubscribe();
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line
  // the effect should be run when component is mounted and unmounted
}

const queryFn = async ({ queryKey }) => {
  const [query, variables, operationName, extensions] = queryKey;
  const { data } = await queryOrMutation({
    query,
    variables,
    operationName,
    extensions,
  });
  return data;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // default function used by all useQuery calls
      queryFn,
      // prevents re-fetching queries by default, data is updated manually with subscriptions
      staleTime: Infinity,
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App mutationFn={queryOrMutation} useSubscription={useSubscription} />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
