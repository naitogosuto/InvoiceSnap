# InvoiceSnap 🧾⚡

**InvoiceSnap** es una aplicación web SaaS moderna diseñada para autónomos y pequeñas empresas en España. Permite gestionar clientes, catálogo de productos/servicios, emitir facturas adaptadas a la normativa de la Agencia Tributaria (AEAT) con desglose de IVA e IRPF, y exportar facturas en PDF con un diseño profesional.

---

## ✨ Características Principales

- 📑 **Facturación conforme a normativa española**:
  - Desglose automático de IVA (21%, 10%, 4%, 0%) e IRPF (15%, 7%, 0%).
  - Redondeo contable adecuado.
  - Generación de secuencias y números de factura configurables.
- 🎨 **Plantilla PDF de diseño limpio**:
  - Exportación de facturas en PDF estilizado en formato A4.
  - Vista previa en tiempo real mientras creas la factura.
  - Personalización de color corporativo e IBAN de cobro.
- 📊 **Panel de Control (Dashboard)**:
  - Resumen de ingresos cobrados vs. pendientes.
  - Indicador del límite mensual de facturación (Plan Gratuito vs. Plan Pro).
  - Estado de facturas (`Borrador`, `Enviada`, `Cobrada`, `Vencida`, `Anulada`).
- 👥 **Gestión de Clientes y Catálogo**:
  - Base de datos de clientes con validación de NIF/CIF.
  - Catálogo de productos/servicios para selección rápida.
- 🔒 **Seguridad y Persistencia**:
  - Autenticación con Supabase (Email/Contraseña y OAuth con Google).
  - Protección de datos con Row Level Security (RLS) en PostgreSQL.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), React Router DOM v7.
- **Estado Global**: Zustand v5.
- **Formularios & Validación**: React Hook Form + Zod.
- **Backend & Base de Datos**: Supabase (PostgreSQL, Auth, RLS).
- **Generación de PDF**: `jsPDF` + `jspdf-autotable`.
- **Linter**: Oxlint.

---

## 🚀 Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd InvoiceSnap
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto a partir de `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```

---

## 📦 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo Vite.
- `npm run build`: Compila la aplicación para producción en `dist/`.
- `npm run lint`: Ejecuta el linter (Oxlint).
- `npm run preview`: Previsualiza la versión compilada de producción.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
