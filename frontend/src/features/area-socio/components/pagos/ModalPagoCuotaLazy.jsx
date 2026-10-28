import { lazy, Suspense } from "react";

// El SDK de Mercado Pago pesa: se descarga recién cuando el socio toca "Pagar".
const ModalPagoCuota = lazy(() => import("./ModalPagoCuota"));

export default function ModalPagoCuotaLazy(props) {
  return (
    <Suspense fallback={null}>
      <ModalPagoCuota {...props} />
    </Suspense>
  );
}
