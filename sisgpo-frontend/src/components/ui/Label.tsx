import React from 'react';

// `htmlFor` é usado para associar a label a um input específico (melhora a acessibilidade).
// `children` é o texto da label.
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({ children, htmlFor, className = '', ...props }) => {
  return (
    <label
      htmlFor={htmlFor}
      // block: ocupa a largura total
      // text-sm: tamanho de fonte pequeno
      // font-medium: peso da fonte médio
      // text-textSecondary: cor do texto
      // mb-2: margem inferior
      className={`block text-sm font-medium text-textSecondary mb-2 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;
