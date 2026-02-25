"use client";

import CreatePaymentRequestForm from "../CreatePaymentRequestForm";

export default function CreatePaymentRequestFormPage() {
  const handleCreated = () => {
    console.log("Payment request successfully created.");
  };

  return <CreatePaymentRequestForm onCreated={handleCreated} />;
}
