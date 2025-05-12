import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createSubscription } from "@/services/public";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

interface SubscribeFormProps {
  subscriptionId: string;
  onSuccess?: () => void;
}

const BEER_TYPES = [
  { id: "ipa", name: "IPA - India Pale Ale" },
  { id: "stout", name: "Stout - Cerveza negra" },
  { id: "lager", name: "Lager - Cerveza rubia" },
  { id: "porter", name: "Porter - Cerveza oscura" },
  { id: "ale", name: "Ale - Cerveza inglesa" },
];

export default function SubscribeForm({
  subscriptionId,
  onSuccess,
}: SubscribeFormProps) {
  const [selectedBeerType, setSelectedBeerType] = useState(BEER_TYPES[0].id);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { loading, callEndpoint } = useFetchAndLoad();

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/suscripciones/${subscriptionId}`);
      return;
    }

    setError("");
    const selectedBeer = BEER_TYPES.find(
      (beer) => beer.id === selectedBeerType
    );

    try {
      const response = await callEndpoint(
        createSubscription(
          subscriptionId,
          selectedBeerType,
          selectedBeer?.name || ""
        )
      );

      if (response && response.data) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/perfil/suscripciones/${response.data.id}?success=true`);
        }
      } else {
        setError("No se pudo completar la suscripción. Intenta de nuevo.");
      }
    } catch (err: any) {
      console.error("Error al crear suscripción:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(
          "Error al procesar la solicitud. Por favor, intenta de nuevo."
        );
      }
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">
          Elige tu tipo de cerveza preferido
        </h3>
        <RadioGroup
          value={selectedBeerType}
          onValueChange={setSelectedBeerType}
          className="space-y-3"
        >
          {BEER_TYPES.map((beerType) => (
            <div key={beerType.id} className="flex items-center space-x-2">
              <RadioGroupItem value={beerType.id} id={beerType.id} />
              <Label htmlFor={beerType.id}>{beerType.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubscribe}
        className="w-full bg-amber-600 hover:bg-amber-700"
        disabled={loading}
      >
        {loading ? "Procesando..." : "Confirmar Suscripción"}
      </Button>
    </div>
  );
}
