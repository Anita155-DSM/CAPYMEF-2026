import { useState } from "react";

export const useForm = (initialValue) => {
  const [formState, setFormState] = useState(initialValue);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState({
      ...formState,
      [name]: value,
    });
  };

  //
  const handleReset = () => {
    setFormState(initialValue);
  };
  //

  return {
    handleReset,
    handleChange,
    formState,
    ...formState,
  };
};
