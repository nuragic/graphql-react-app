import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";

import "./App.css";

const RESULT = `query GetResult {
  result
}`;

const ADD = `mutation AddValue($num: Int) {
  add(num: $num)
}`;

const SUBTRACT = `mutation SubtractValue($num: Int) {
  subtract(num: $num)
}`;

const ON_RESULT_CHANGE = `subscription OnResultChange {
  onResultChange {
    operation
    prev
    current
  }
}`;

export default function App({ mutationFn, useSubscription }) {
  const queryClient = useQueryClient();

  const { isLoading, data } = useQuery([RESULT], {
    notifyOnChangeProps: ["data", "error"],
  });

  const addMutation = useMutation(
    (variables) => mutationFn({ query: ADD, variables }),
    {
      onSuccess: ({ data }) => {
        queryClient.setQueryData([RESULT], { result: data.add });
      },
    }
  );

  const subtractMutation = useMutation(
    (variables) => mutationFn({ query: SUBTRACT, variables }),
    {
      onSuccess: ({ data }) => {
        queryClient.setQueryData([RESULT], { result: data.subtract });
      },
    }
  );

  const [resultState, setResultState] = useState({
    operation: "",
    prev: "",
    current: "",
  });

  useSubscription(
    {
      query: ON_RESULT_CHANGE,
    },
    ({ data: { onResultChange }, errors }) => {
      if (errors && errors.length > 0) {
        console.log(errors[0]);
      }
      if (onResultChange) {
        queryClient.setQueryData([RESULT], {
          result: onResultChange.current,
        });
        setResultState(onResultChange);
      }
    }
  );

  return (
    <div className="app">
      <div className="count">
        <h1>{isLoading ? "Loading…" : data?.result}</h1>
      </div>
      <div className="buttons">
        <button
          onClick={() => {
            return subtractMutation.mutate({ num: 1 });
          }}
        >
          -
        </button>
        <button
          onClick={() => {
            return addMutation.mutate({ num: 1 });
          }}
        >
          +
        </button>
      </div>
      <code>{JSON.stringify(resultState)}</code>
    </div>
  );
}
