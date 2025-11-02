import React from 'react';

interface FormErrorProps {
  message?: string;
}

const FormError: React.FC<FormErrorProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 text-sm text-spamRed" id="form-error">
      {message}
    </p>
  );
};

export default FormError;
