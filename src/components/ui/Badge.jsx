export function Badge({ children, variant = 'gray', className = '', size = 'sm' }) {
  const variants = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    primary: 'bg-primary-100 text-primary-700',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant] || variants.gray}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
