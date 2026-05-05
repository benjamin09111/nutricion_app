import CartClient from "./CartClient";

export const metadata = {
  title: "Carrito de Compras (Cuantificador) | NutriNet",
  description: "Cuantificación nutricional y financiera de la pauta pautada.",
};

export default function CartPage() {
  return (
    <div className="container mx-auto py-8">
      <CartClient />
    </div>
  );
}
