export function Card({ children, className = '', padded = true, ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${padded ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>
}
