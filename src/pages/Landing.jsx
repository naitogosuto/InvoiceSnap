import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v1H8a1 1 0 000 2h1v1a1 1 0 002 0v-1h1a1 1 0 100-2h-1V9z"
                />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900">InvoiceSnap</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              Crear cuenta gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full mb-6">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
          Hecho para autónomos españoles
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Crea tu factura en{' '}
          <span className="text-primary-600">30 segundos</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          La herramienta más simple para freelancers y autónomos en España.
          IVA, IRPF, numeración legal — todo funciona solo.
          <span className="block mt-2 font-semibold text-gray-900">Sin Excel. Sin complicaciones.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
          >
            Crear cuenta gratis
            <svg className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            Ver demo
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">Sin tarjeta de crédito · 5 facturas gratis al mes</p>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Todo lo que necesitas, nada que no</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sin curvas de aprendizaje. Sin funciones que nunca usarás. Solo facturas impecables.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'IVA e IRPF automáticos',
              desc: 'Selecciona el tipo y lo calculamos todo. IVA 21%, 10%, 4% y retención de IRPF al 15% o 7%.',
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              ),
            },
            {
              title: 'Numeración legal automática',
              desc: 'Formato correlativo que cumple con Hacienda. Configurable: FACT-2026-001, 2026/001, etc.',
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              ),
            },
            {
              title: 'PDF profesional',
              desc: 'Descarga facturas en PDF listas para enviar a tu cliente. Plantilla limpia y profesional.',
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                    clipRule="evenodd"
                  />
                  <path d="M7 7h6v1H7V7zm0 3h6v1H7v-1zm0 3h4v1H7v-1z" />
                </svg>
              ),
            },
            {
              title: 'Clientes guardados',
              desc: 'Tus clientes se guardan. Selecciónalos con un clic al crear cada factura. Hasta 10 en el plan gratis.',
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              ),
            },
            {
              title: 'Cumplimiento fiscal español',
              desc: 'Cumplimos con el Reglamento de Facturación (RD 1619/2012). Tus facturas son válidas ante Hacienda.',
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ),
            },
            {
              title: 'Gratis para empezar',
              desc: '5 facturas al mes gratis. Sin límite de tiempo. Actualiza a Pro solo cuando lo necesites.',
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Precios simples</h2>
          <p className="text-lg text-gray-600">Empieza gratis. Actualiza solo cuando necesites más.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gratuito</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">0 €</div>
            <p className="text-sm text-gray-500 mb-6">/mes · sin límite de tiempo</p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              {['5 facturas/mes', '10 clientes', '1 plantilla PDF', 'IVA + IRPF automático', 'Numeración automática'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                )
              )}
            </ul>
            <Link
              to="/register"
              className="block w-full text-center px-4 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>

          <div className="bg-white rounded-xl border-2 border-primary-500 p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
              Más popular
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">7 €</div>
            <p className="text-sm text-gray-500 mb-6">/mes o 60 €/año (ahorra 24 €)</p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              {[
                'Facturas ilimitadas',
                'Clientes ilimitados',
                '4 plantillas PDF',
                'Logo + colores personalizados',
                'Catálogo de productos',
                'Dashboard + métricas',
                'Envío por email',
                'Facturas recurrentes',
                'Exportar CSV/Excel',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full text-center px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
            >
              Empezar prueba gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} InvoiceSnap. Hecho para autónomos españoles 🇪🇸</p>
        </div>
      </footer>
    </div>
  )
}
