import React from 'react';
import './Button.css';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  type = 'button',
}) => {
  return (
    <button
      type={type}
      className={`btn ${variant} ${size}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="btn-loading">
          <span className="spinner" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
