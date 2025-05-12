import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { validateDiscount } from "@/services/public";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

interface DiscountFormProps {
  cartItems: any[];
  onApplyDiscount: (discountData: any) => void;
}

export default function DiscountForm({
  cartItems,
  onApplyDiscount,
}: DiscountFormProps) {
  const [discountCode, setDiscountCode] = useState("");
  const [discountStatus, setDiscountStatus] = useState<
    "idle" | "validating" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { loading, callEndpoint } = useFetchAndLoad();

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) return;

    setDiscountStatus("validating");
    setErrorMessage("");

    try {
      const response = await callEndpoint(
        validateDiscount(discountCode, cartItems)
      );

      if (response && response.data) {
        setDiscountStatus("success");
        onApplyDiscount(response.data);
      } else {
        setDiscountStatus("error");
        setErrorMessage("Código de descuento no válido");
      }
    } catch (err: any) {
      console.error("Error validando descuento:", err);
      setDiscountStatus("error");
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage("No se pudo validar el código de descuento");
      }
    }
  };

  const renderStatusIndicator = () => {
    if (discountStatus === "validating" || loading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
      );
    } else if (discountStatus === "success") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (discountStatus === "error") {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="mt-4">
      <h3 className="font-medium mb-2">¿Tienes un código de descuento?</h3>

      <div className="flex gap-2 items-center">
        <div className="flex-grow">
          <Input
            placeholder="Ingresa tu código"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            disabled={discountStatus === "validating" || loading}
          />
        </div>
        <Button
          type="button"
          variant={discountStatus === "success" ? "outline" : "default"}
          onClick={handleValidateDiscount}
          disabled={!discountCode || discountStatus === "validating" || loading}
          className="whitespace-nowrap"
        >
          {discountStatus === "success" ? "Aplicado" : "Aplicar"}
        </Button>

        <div className="ml-2">{renderStatusIndicator()}</div>
      </div>

      {discountStatus === "error" && errorMessage && (
        <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
