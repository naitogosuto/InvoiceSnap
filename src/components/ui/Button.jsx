import { forwardRef } from 'react'

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
  link: 'text-primary-600 hover:text-primary-800 underline-offset-2 hover:underline',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, loading, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg font-medium
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variants[variant] || variants.primary}
          ${sizes[size] || sizes.md}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!loading && icon && <span className="h-4 w-4">{icon}</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
